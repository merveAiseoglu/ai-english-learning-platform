import { Component, OnInit, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ConversationComponent } from '../conversation/conversation';
import { AudioRecordingService } from 'src/app/services/audio-recording.service';
import { OpenAIService } from 'src/app/pages/speaking/openai.service';
import { TextToSpeechService } from 'src/app/pages/speaking/text-to-speech.service';



// --- Interface Tanımları ---
interface WordData {
  kolay: string[];
  orta: string[];
  zor: string[];
}

interface SentenceData {
  kolay: string[];
  orta: string[];
  zor: string[];
}

interface Category {
  name: string;
  words: WordData;
  sentences?: SentenceData;
}

interface AppData {
  categories: Category[];
}

interface SpeechConfig {
  language: string;
  continuous: boolean;
  interim: boolean;
  maxAlternatives: number;
  confidenceThreshold: number;
}

// YENİ: Chatbot mesaj interface'i
interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  audioUrl?: string;
}

// YENİ: OpenAI API yanıtı interface'i
interface OpenAIResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

// YENİ: Whisper API yanıtı interface'i
interface WhisperResponse {
  text: string;
  confidence?: number;
}

@Component({
  selector: 'speaking-practice',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './speaking-practice.html',
  styleUrls: ['./speaking-practice.css']
})
export class SpeakingPracticeComponent implements OnInit, OnDestroy {

  // --- Signals ---
  word = signal<string>('');
  recognizedText = signal<string>('');
  feedback = signal<string>('');
  isRecording = signal<boolean>(false);
  isProcessing = signal<boolean>(false);
  recordedAudioUrl = signal<string>('');
  hasRecording = signal<boolean>(false);
  transcription = '';
  // speaking-practice.ts
transcribedText: string = '';


  audioLevel = signal<number>(0);
  isListening = signal<boolean>(false);

  private allData = signal<AppData>({ categories: [] });
  categories = computed(() => this.allData().categories.map(c => c.name));

  selectedCategory = signal<string>('');
  selectedLevel = signal<string>('kolay');

  // GÜNCELLENDİ: Yeni chatbot modu eklendi
  practiceMode = signal<'word' | 'sentence' | 'chatbot'>('word');

  speechConfig = signal<SpeechConfig>({
    language: 'en-US',
    continuous: false,
    interim: true,
    maxAlternatives: 3,
    confidenceThreshold: 0.7
  });

  isDebugMode = signal<boolean>(true);

  // YENİ: Chatbot ile ilgili signals
  chatMessages = signal<ChatMessage[]>([]);
  isChatbotThinking = signal<boolean>(false);
  isChatbotSpeaking = signal<boolean>(false);
  currentChatAudio = signal<HTMLAudioElement | null>(null);

  // --- Private Variables ---
  // YORUM SATIRI: private recognition: any;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private currentStream: MediaStream | null = null;
  private processingTimeoutId: any = null;
  // YORUM SATIRI: private recognitionTimeoutId: any = null;
  private audioContext!: AudioContext;
  private analyser!: AnalyserNode;
  private source!: MediaStreamAudioSourceNode;
  private dataArray!: Uint8Array;
  private animationId: number | null = null;
  private canvas!: HTMLCanvasElement;
  private canvasCtx!: CanvasRenderingContext2D;

  private volumeCallback?: () => void;

 constructor(
  private http: HttpClient,
  private audioService: AudioRecordingService,
  private openAIService: OpenAIService,  
  private ttsService: TextToSpeechService 
) {}


 async start() {
    await this.audioService.startRecording();
  }

  async stop() {
    this.transcription = await this.audioService.stopRecording();
  }

  ngOnInit(): void {
    this.loadWords();
    // YORUM SATIRI: this.initializeSpeechRecognition();
    this.initializeChatbot();
  }

  // YENİ: Chatbot başlangıç mesajı
  private initializeChatbot(): void {
    const welcomeMessage: ChatMessage = {
      id: this.generateMessageId(),
      text: "Hello! I'm your AI speaking partner. You can practice English conversation with me. Just press the record button and start talking!",
      isUser: false,
      timestamp: new Date()
    };
    this.chatMessages.set([welcomeMessage]);
  }

  private generateMessageId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  private loadWords(): void {
    this.http.get<AppData>('/assets/speaking-words.json').subscribe(data => {
      this.allData.set(data);
      if (data.categories.length > 0) {
        this.selectedCategory.set(data.categories[0].name);
        this.pickRandomContent();
      }
    });
  }

  onCategoryChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedCategory.set(selectElement.value);
    this.pickRandomContent();
  }

  onLevelChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedLevel.set(selectElement.value);
    this.pickRandomContent();
  }

  // GÜNCELLENDİ: Chatbot modu desteği eklendi
  setPracticeMode(mode: 'word' | 'sentence' | 'chatbot'): void {
    if (this.isRecording() || this.isProcessing()) return;
    this.practiceMode.set(mode);
    
    if (mode !== 'chatbot') {
      this.pickRandomContent();
    }
    // YORUM SATIRI: this.initializeSpeechRecognition();
  }

  pickRandomContent(): void {
    if (this.isRecording() || !this.selectedCategory() || !this.selectedLevel()) return;
    if (this.practiceMode() === 'chatbot') return; // Chatbot modunda rastgele içerik yok

    const categoryData = this.allData().categories.find(c => c.name === this.selectedCategory());
    if (!categoryData) return;

    let contentList: string[] = [];
    if (this.practiceMode() === 'word') {
      contentList = categoryData.words[this.selectedLevel() as keyof WordData] || [];
    } else {
      contentList = categoryData.sentences?.[this.selectedLevel() as keyof SentenceData] || [];
    }

    if (contentList.length === 0) {
      this.word.set(`Bu seviyede ${this.practiceMode() === 'word' ? 'kelime' : 'cümle'} yok.`);
      return;
    }

    const randomIndex = Math.floor(Math.random() * contentList.length);
    this.word.set(contentList[randomIndex]);

    this.recognizedText.set('');
    this.feedback.set('');
    this.recordedAudioUrl.set('');
    this.hasRecording.set(false);
  }

  /* YORUM SATIRI - ESKİ SpeechRecognition Kodu:
  
  private initializeSpeechRecognition(): void {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error('Speech Recognition API desteklenmiyor.');
      this.feedback.set(`
        <div class="feedback-error">
          ⚠️ Cihazınızda/Tarayıcınızda Ses Tanıma API'si desteklenmiyor.
          <small>Lütfen Chrome gibi uyumlu bir tarayıcı kullanın.</small>
        </div>
      `);
      return;
    }

    this.recognition = new SpeechRecognition();
    const config = this.speechConfig();

    this.recognition.lang = config.language;
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;
    this.recognition.continuous = false;
    this.recognition.audioCapture = true;
    this.recognition.echoCancellation = true;
    this.recognition.noiseSuppression = true;
    this.recognition.autoGainControl = true;

    this.recognition.onstart = () => {
      console.log('🎤 Ses tanıma başladı');
      this.isListening.set(true);
      
      this.recognitionTimeoutId = setTimeout(() => {
        if (this.isListening()) {
          console.log('⏰ Recognition timeout - 15 saniye geçti, durduruluyor');
          try {
            this.recognition.stop();
          } catch (e) {
            console.error('Recognition stop hatası:', e);
          }
        }
      }, 15000);
      
      if (this.practiceMode() === 'chatbot') {
        this.feedback.set('🎤 Listening... Say something to chat!');
      } else {
        this.feedback.set('🎤 Dinleniyor...');
      }
    };

    this.recognition.onresult = (event: any) => {
      console.log('🎯 Ses tanıma sonucu alındı:', event);
      
      if (this.recognitionTimeoutId) {
        clearTimeout(this.recognitionTimeoutId);
        this.recognitionTimeoutId = null;
      }

      let finalTranscript = '';
      let confidence = 0;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        
        if (result.isFinal && result[0]) {
          finalTranscript = result[0].transcript.trim();
          confidence = result[0].confidence || 0;
          console.log(`📝 Final transcript: "${finalTranscript}" (confidence: ${confidence})`);
          break;
        }
      }

      this.isListening.set(false);
      
      if (finalTranscript && finalTranscript.length > 0) {
        this.recognizedText.set(finalTranscript);
        
        const minConfidence = this.practiceMode() === 'chatbot' ? 0.3 : 0.5;
        
        if (confidence >= minConfidence || confidence === 0) {
          if (this.practiceMode() === 'chatbot') {
            this.processChatbotMessage(finalTranscript);
          } else {
            this.processRecognitionResult(finalTranscript, confidence);
          }
        } else {
          this.feedback.set(`
            <div class="feedback-warning">
              ⚠️ Ses net değil (güven: %${(confidence * 100).toFixed(0)}). 
              Tekrar: "${finalTranscript}"
              <br><small>Daha net konuşmayı deneyin.</small>
            </div>
          `);
        }
      } else {
        this.recognizedText.set('(Ses tanınamadı)');
        if (this.practiceMode() === 'chatbot') {
          this.feedback.set('⚠️ Sorry, I couldn\'t hear you clearly. Please try again.');
        } else {
          this.feedback.set('⚠️ Ses tanınamadı. Lütfen daha net konuşmayı deneyin.');
        }
      }
      
      setTimeout(() => {
        this.isProcessing.set(false);
      }, 500);
    };

    this.recognition.onerror = (event: any) => {
      console.error('🚨 Speech recognition error:', event.error);
      
      if (this.recognitionTimeoutId) {
        clearTimeout(this.recognitionTimeoutId);
        this.recognitionTimeoutId = null;
      }
      
      this.isListening.set(false);
      
      if (event.error === 'no-speech' && this.hasRecording()) {
        console.log('🔄 No-speech hatası ama kayıt var, yeniden deneme...');
        setTimeout(() => {
          if (this.isProcessing() && !this.isListening()) {
            this.startSpeechRecognitionSafely();
          }
        }, 1000);
      } else if (event.error === 'aborted') {
        console.log('📴 Recognition normal şekilde durduruldu');
        this.isProcessing.set(false);
      } else {
        this.isProcessing.set(false);
        this.handleSpeechError(event.error);
      }
    };

    this.recognition.onend = () => {
      console.log('📴 Ses tanıma sona erdi');
      
      if (this.recognitionTimeoutId) {
        clearTimeout(this.recognitionTimeoutId);
        this.recognitionTimeoutId = null;
      }
      
      this.isListening.set(false);

      if (!this.recognizedText() && this.recordedAudioUrl() && this.isProcessing()) {
        this.recognizedText.set('(Ses tanınamadı)');
        
        if (this.practiceMode() === 'chatbot') {
          this.feedback.set(`
            <div class="feedback-warning">
              ⚠️ I couldn't understand what you said.<br>
              <small>• Please speak louder and clearer<br>
              • Check your microphone<br>
              • Reduce background noise</small>
              <button onclick="this.closest('.feedback-warning').style.display='none'" 
                      style="margin-top: 8px; padding: 4px 8px; background: #3498db; color: white; border: none; border-radius: 3px; cursor: pointer;">
                Try Again
              </button>
            </div>
          `);
        } else {
          this.feedback.set(`
            <div class="feedback-warning">
              ⚠️ Ses tanınamadı ancak kaydınız mevcut.<br>
              <small>• Daha yüksek sesle konuşmayı deneyin<br>
              • Mikrofonunuzu kontrol edin<br>
              • Arka plan gürültüsünü azaltın</small>
            </div>
          `);
        }
        
        setTimeout(() => {
          this.isProcessing.set(false);
        }, 1000);
      }
    };
  }

  private handleRecognitionFailure(): void {
    this.isProcessing.set(false);
    this.isListening.set(false);
    
    this.feedback.set(`
      <div class="feedback-error">
        ⚠️ Ses tanıma başlatılamadı.
        <div style="margin-top: 8px;">
          <button onclick="location.reload()" 
                  style="padding: 8px 12px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Sayfayı Yenile
          </button>
        </div>
      </div>
    `);
  }

  private startSpeechRecognitionSafely(): void {
    if (!this.recognition) {
      this.handleSpeechError('recognition-not-initialized');
      return;
    }

    try {
      this.recognition.abort();
      
      setTimeout(() => {
        try {
          this.recognition.start();
          console.log('🎤 Ses tanıma güvenli şekilde başlatıldı');
        } catch (error) {
          console.error('Ses tanıma başlatma hatası:', error);
          this.handleRecognitionFailure();
        }
      }, 500);
      
    } catch (error) {
      console.error('Recognition başlatma hatası:', error);
      this.handleRecognitionFailure();
    }
  }

  YORUM SATIRI SONU */

  // YENİ: Whisper Backend ile transkripsiyon
// Mevcut sendAudioToWhisper method'unu değiştirin:
private sendAudioToWhisper(audioBlob: Blob): void {
  this.isProcessing.set(true);
  this.feedback.set('🎤 Transcribing audio with Whisper...');

  // SEÇENEK 1: Base64 versiyonu (YENİ)
  this.audioService.sendToBackendBase64(audioBlob)
    .then(transcribedText => {
      console.log('Base64 Whisper sonucu:', transcribedText);
      
      if (transcribedText && transcribedText.trim().length > 0) {
        this.recognizedText.set(transcribedText.trim());
        
        if (this.practiceMode() === 'chatbot') {
          this.processChatbotMessage(transcribedText.trim());
        } else {
          this.processRecognitionResult(transcribedText.trim(), 0);
        }
      } else {
        this.handleTranscriptionError('empty-transcript');
      }
    })
    .catch(error => {
      console.error('Base64 Whisper API hatası:', error);
      this.handleTranscriptionError('api-error');
    });

  // SEÇENEK 2: Mevcut FormData versiyonu (YEDEK)
  /*
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');

  this.http.post<any>('http://localhost:5000/transcribe', formData)
    .subscribe({
      next: (response) => {
        // ...mevcut kod
      },
      error: (error) => {
        // ...mevcut kod  
      }
    });
  */
}

  // YENİ: Transkripsiyon hatası işleme
  private handleTranscriptionError(errorType: string): void {
    this.isProcessing.set(false);
    
    let errorMessage = '';
    
    switch(errorType) {
      case 'empty-transcript':
        if (this.practiceMode() === 'chatbot') {
          errorMessage = '⚠️ Could not understand the audio. Please speak clearer.';
        } else {
          errorMessage = '⚠️ Ses anlaşılamadı. Lütfen daha net konuşun.';
        }
        break;
      case 'api-error':
        if (this.practiceMode() === 'chatbot') {
          errorMessage = '⚠️ Transcription service error. Please try again.';
        } else {
          errorMessage = '⚠️ Transkripsiyon servisi hatası. Lütfen tekrar deneyin.';
        }
        break;
      default:
        errorMessage = '⚠️ Unknown transcription error.';
    }
    
    this.feedback.set(`<div class="feedback-error">${errorMessage}</div>`);
  }

  // Tüm state'leri sıfırlama metodu
  private resetAllStates(): void {
    this.isRecording.set(false);
    this.isProcessing.set(false);
    this.isListening.set(false);
    this.audioLevel.set(0);
    
    // Timeout'ları temizle
    if (this.processingTimeoutId) {
      clearTimeout(this.processingTimeoutId);
      this.processingTimeoutId = null;
    }
    
    /* YORUM SATIRI:
    if (this.recognitionTimeoutId) {
      clearTimeout(this.recognitionTimeoutId);
      this.recognitionTimeoutId = null;
    }
    */
  }

  // YENİ: Chatbot mesajını işleme
  private processChatbotMessage(transcript: string): void {
    if (!transcript || transcript.trim().length === 0) return;

    // Kullanıcı mesajını chat geçmişine ekle
    const userMessage: ChatMessage = {
      id: this.generateMessageId(),
      text: transcript,
      isUser: true,
      timestamp: new Date(),
      audioUrl: this.recordedAudioUrl()
    };

    const currentMessages = this.chatMessages();
    this.chatMessages.set([...currentMessages, userMessage]);

    // ChatGPT'den yanıt al
    this.getChatGPTResponse(transcript);
  }

  // YENİ: ChatGPT API çağrısı
// getChatGPTResponse method'unu OpenAIService kullanacak şekilde değiştirin:
// getChatGPTResponse method'unu OpenAIService kullanacak şekilde değiştirin:
private getChatGPTResponse(userMessage: string): void {
  this.isChatbotThinking.set(true);
  this.feedback.set('🤖 AI is thinking...');

  this.openAIService.sendMessage(userMessage, 'en-US', 'beginner')
    .subscribe({
      next: (aiMessage) => {
        // Gelen veriyi ChatMessage tipine dönüştür
        const botMessage: ChatMessage = {
          id: this.generateMessageId(),
          text: aiMessage.content, // content → text
          isUser: false,
          timestamp: new Date()
        };

        // Bot yanıtını ekle
        const currentMessages = this.chatMessages();
        this.chatMessages.set([...currentMessages, botMessage]);

        this.isChatbotThinking.set(false);
        this.feedback.set('✅ Response received! Playing audio...');

        // Yanıtı sesli oku
        this.speakChatbotResponse(botMessage.text);
      },
      error: (error) => {
        console.error('OpenAI Service hatası:', error);
        this.isChatbotThinking.set(false);
        this.feedback.set('❌ Sorry, there was an error connecting to the AI service.');
        
        const errorMessage: ChatMessage = {
          id: this.generateMessageId(),
          text: 'Sorry, I\'m having trouble connecting right now. Please try again.',
          isUser: false,
          timestamp: new Date()
        };

        const currentMessages = this.chatMessages();
        this.chatMessages.set([...currentMessages, errorMessage]);
      }
    });
}

  // YENİ: Chatbot yanıtını sesli okuma
  private speakChatbotResponse(text: string): void {
    if (!text) return;

    this.isChatbotSpeaking.set(true);
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = this.speechConfig().language;
    utterance.rate = 0.9; // Biraz daha yavaş konuş
    utterance.pitch = 1.0;
    utterance.volume = 0.8;

    utterance.onstart = () => {
      this.feedback.set('🔊 AI is speaking...');
    };

    utterance.onend = () => {
      this.isChatbotSpeaking.set(false);
      this.feedback.set('✅ Ready for your next message!');
    };

    utterance.onerror = (event) => {
      console.error('TTS error:', event);
      this.isChatbotSpeaking.set(false);
      this.feedback.set('⚠️ Could not play audio response.');
    };

    speechSynthesis.speak(utterance);
  }

  // YENİ: Chatbot konuşmasını durdur
  stopChatbotSpeaking(): void {
    speechSynthesis.cancel();
    this.isChatbotSpeaking.set(false);
    this.feedback.set('🔇 Speech stopped.');
  }

  // YENİ: Chat geçmişini temizle
  clearChatHistory(): void {
    this.chatMessages.set([]);
    this.initializeChatbot(); // Başlangıç mesajını tekrar ekle
    this.feedback.set('🗑️ Chat history cleared.');
  }

  /* YORUM SATIRI - ESKİ handleSpeechError:
  private handleSpeechError(error: string): void {
    let errorMessage = '';
    let suggestion = '';

    switch(error) {
      case 'no-speech':
        errorMessage = this.practiceMode() === 'chatbot' ? 'No speech detected' : 'Ses algılanamadı';
        suggestion = this.practiceMode() === 'chatbot' ? 'Please speak louder and closer to the microphone' : 'Daha yüksek sesle ve mikrofonunuza yakın konuşun';
        break;
      case 'audio-capture':
        errorMessage = this.practiceMode() === 'chatbot' ? 'Microphone access issue' : 'Mikrofon erişimi sorunu';
        suggestion = this.practiceMode() === 'chatbot' ? 'Check your microphone connection or drivers' : 'Mikrofon bağlantınızı veya sürücülerinizi kontrol edin';
        break;
      case 'not-allowed':
        errorMessage = this.practiceMode() === 'chatbot' ? 'Microphone permission denied' : 'Mikrofon izni reddedildi';
        suggestion = this.practiceMode() === 'chatbot' ? 'Enable microphone access in browser settings' : 'Tarayıcı ayarlarından mikrofon erişimini etkinleştirin';
        break;
      case 'network':
        errorMessage = this.practiceMode() === 'chatbot' ? 'Network connection issue' : 'Ağ bağlantı sorunu';
        suggestion = this.practiceMode() === 'chatbot' ? 'Check your internet connection' : 'İnternet bağlantınızı kontrol edin';
        break;
      case 'aborted':
        errorMessage = this.practiceMode() === 'chatbot' ? 'Speech recognition was aborted' : 'Ses tanıma iptal edildi';
        suggestion = this.practiceMode() === 'chatbot' ? 'Please try again' : 'Tekrar deneyin';
        break;
      default:
        errorMessage = `${this.practiceMode() === 'chatbot' ? 'Unknown error' : 'Bilinmeyen hata'}: ${error}`;
        suggestion = this.practiceMode() === 'chatbot' ? 'Refresh the page and try again' : 'Sayfayı yenileyin ve tekrar deneyin';
    }

    this.feedback.set(`
      <div class="feedback-error">
        ⚠️ <strong>${errorMessage}</strong><br>
        <small>💡 ${suggestion}</small>
      </div>
    `);
  }
  */

  // GÜNCELLENDİ: Chatbot modunda farklı davranış
  speakText(): void {
    if (this.practiceMode() === 'chatbot') {
      // Chatbot modunda son bot mesajını tekrar oku
      const lastBotMessage = this.chatMessages().reverse().find(msg => !msg.isUser);
      if (lastBotMessage) {
        this.speakChatbotResponse(lastBotMessage.text);
      }
      return;
    }

    if (!this.word()) return;
    const utterance = new SpeechSynthesisUtterance(this.word());
    utterance.lang = this.speechConfig().language;
    speechSynthesis.speak(utterance);
  }

  private handleRecordingError(error: any): void {
    console.error('Kayıt hatası:', error);
    this.resetAllStates();
    
    let errorMessage = '';
    
    if (error.name === 'NotAllowedError') {
      errorMessage = 'Mikrofon izni reddedildi. Lütfen tarayıcı ayarlarından mikrofon erişimini etkinleştirin.';
    } else if (error.name === 'NotFoundError') {
      errorMessage = 'Mikrofon bulunamadı. Mikrofon bağlı olduğundan emin olun.';
    } else {
      errorMessage = 'Mikrofon erişimi hatası: ' + error.message;
    }
    
    this.feedback.set(`<div class="feedback-error">⚠️ ${errorMessage}</div>`);
  }

  startRecording(): void {
    if (this.isRecording()) return;

    // ✅ Önceki timeout'ları temizle
    if (this.processingTimeoutId) {
      clearTimeout(this.processingTimeoutId);
      this.processingTimeoutId = null;
    }

    // ✅ State'i sıfırla
    this.resetAllStates();
    
    this.recordedAudioUrl.set('');
    this.hasRecording.set(false);
    this.audioChunks = [];
    this.recognizedText.set('');
    if (this.practiceMode() !== 'chatbot') {
      this.feedback.set('');
    }
    this.audioLevel.set(0);

    this.isRecording.set(true);
    
    navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 44100
      } 
    })
    .then(stream => {
      this.currentStream = stream;
      this.setupAudioVisualization(stream);
      this.setupMediaRecorder(stream);

      this.mediaRecorder?.start();
      console.log('Kayıt başlatıldı');
      
      // ✅ YENİ: İşlem güvenliği için timeout
      this.processingTimeoutId = setTimeout(() => {
        console.warn('⚠️ İşlem timeout - zorla durdurma');
        this.forceStopAllProcesses();
      }, 30000); // 30 saniye timeout
      
    })
    .catch(this.handleRecordingError.bind(this));
  }

  stopRecording(): void {
  if (!this.isRecording()) return;
  
  console.log('🛑 Kayıt durduruluyor...');
  this.isRecording.set(false);
  this.isProcessing.set(true);
  
  // MediaRecorder'ı durdur
  if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
    this.mediaRecorder.stop();
  }
  
  // Stream'i kapat
  if (this.currentStream) {
    this.currentStream.getTracks().forEach(track => track.stop());
    this.currentStream = null;
  }
  
  this.stopVisualization();
  
  // ✅ DEĞİŞİKLİK: Direkt audioBlob'u Base64 metoduna gönder
  setTimeout(() => {
    if (this.isProcessing() && this.hasRecording()) {
      const audioBlob = new Blob(this.audioChunks, {
        type: this.mediaRecorder?.mimeType || 'audio/webm'
      });
      
      // ✅ Base64 metodunu direkt çağır
      this.audioService.sendToBackendBase64(audioBlob)
        .then(transcribedText => {
          console.log('✅ Transkripsiyon başarılı:', transcribedText);
          
          if (transcribedText && transcribedText.trim().length > 0) {
            this.recognizedText.set(transcribedText.trim());
            
            if (this.practiceMode() === 'chatbot') {
              this.processChatbotMessage(transcribedText.trim());
            } else {
              this.processRecognitionResult(transcribedText.trim(), 0);
            }
          } else {
            this.handleTranscriptionError('empty-transcript');
          }
          
          this.isProcessing.set(false);
        })
        .catch(error => {
          console.error('❌ Base64 Whisper API hatası:', error);
          this.handleTranscriptionError('api-error');
          this.isProcessing.set(false);
        });
    }
  }, 1000);
}

  // Zorla tüm işlemleri durdur
  private forceStopAllProcesses(): void {
    console.log('🚨 Zorla durduruluyor - tüm işlemler');
    
    // Tüm state'leri sıfırla
    this.resetAllStates();
    
    /* YORUM SATIRI - ESKİ Recognition durdurmak:
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (e) {
        console.error('Recognition abort hatası:', e);
      }
    }
    */
    
    // MediaRecorder'ı durdur
    if (this.mediaRecorder) {
      try {
        this.mediaRecorder.stop();
      } catch (e) {
        console.error('MediaRecorder stop hatası:', e);
      }
    }
    
    // Stream'i kapat
    if (this.currentStream) {
      this.currentStream.getTracks().forEach(track => track.stop());
      this.currentStream = null;
    }
    
    this.stopVisualization();
    
    this.feedback.set(`
      <div class="feedback-error">
        ⚠️ İşlem timeout nedeniyle durduruldu. Lütfen tekrar deneyin.
        <small>Mikrofon ve internet bağlantınızı kontrol edin.</small>
      </div>
    `);
  }

  private setupAudioVisualization(stream: MediaStream): void {
    try {
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.85;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

      this.source = this.audioContext.createMediaStreamSource(stream);
      this.source.connect(this.analyser);

      this.canvas = document.getElementById('waveform') as HTMLCanvasElement;
      if (this.canvas) {
        this.canvasCtx = this.canvas.getContext('2d')!;
        this.drawWaveform();
      }

      this.startVolumeMonitoring();

    } catch (error) {
      console.error('Audio visualization setup error:', error);
    }
  }

  private startVolumeMonitoring(): void {
    if (this.volumeCallback) {
        clearTimeout(this.volumeCallback as any);
    }

    const monitorVolume = () => {
      if (!this.analyser || !this.isRecording()) {
        return;
      }

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      this.analyser.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;

      const normalizedLevel = average / 255;

      this.audioLevel.set(normalizedLevel);

      this.volumeCallback = () => setTimeout(monitorVolume, 100);
      (this.volumeCallback as any)();
    };

    monitorVolume();
  }

  private setupMediaRecorder(stream: MediaStream): void {
    try {
      const options = this.getOptimalRecordingOptions();
      this.mediaRecorder = new MediaRecorder(stream, options);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
          console.log('Audio chunk kaydedildi:', event.data.size, 'bytes');
        }
      };

      this.mediaRecorder.onstop = () => {
        console.log('MediaRecorder durduruldu, ses işleniyor...');
        this.processRecordedAudio();
      };

      this.mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        this.feedback.set('⚠️ Kayıt hatası oluştu.');
        this.isRecording.set(false);
        this.isProcessing.set(false);
      };

    } catch (error) {
      console.error('MediaRecorder setup error:', error);
      this.isRecording.set(false);
    }
  }

  private getOptimalRecordingOptions(): MediaRecorderOptions {
    const options: MediaRecorderOptions = {};

    const mimeTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/wav'
    ];

    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        options.mimeType = mimeType;
        console.log('Kullanılan optimal MIME tipi:', mimeType);
        break;
      }
    }

    options.audioBitsPerSecond = 128000;

    return options;
  }

  private processRecordedAudio(): void {
    const audioBlob = new Blob(this.audioChunks, {
      type: this.mediaRecorder?.mimeType || 'audio/webm'
    });

    if (audioBlob.size > 0) {
      const audioUrl = URL.createObjectURL(audioBlob);
      this.recordedAudioUrl.set(audioUrl);
      this.hasRecording.set(true);
      console.log(`Ses kaydedildi: ${audioUrl} (${audioBlob.size} bytes)`);

      if (audioBlob.size < 1000 && this.isRecording()) {
        console.warn('Çok küçük ses dosyası, kalite düşük olabilir veya hiç ses kaydedilememiş olabilir.');
        if (this.practiceMode() === 'chatbot') {
          this.feedback.set(`
            <div class="feedback-warning">
              ⚠️ Recording was too short or unclear. Please try speaking longer and clearer.
            </div>
          `);
        } else {
          this.feedback.set(`
            <div class="feedback-warning">
              ⚠️ Ses kaydı çok kısa veya algılanamadı. Daha uzun ve net konuşmayı deneyin.
            </div>
          `);
        }
      }
    } else {
      console.log('Ses kaydedilemedi - boş blob');
      this.hasRecording.set(false);
      if (this.practiceMode() === 'chatbot') {
        this.feedback.set('⚠️ Could not record audio, please try again. Your microphone might be disabled.');
      } else {
        this.feedback.set('⚠️ Ses kaydedilemedi, lütfen tekrar deneyin. Mikrofonunuz kapalı olabilir.');
      }
      this.isProcessing.set(false);
    }
  }

  private stopVisualization(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(e => console.error('AudioContext close error:', e));
    }

    if (this.canvasCtx && this.canvas) {
      this.canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  private drawWaveform(): void {
    if (!this.analyser || !this.isRecording() || !this.canvasCtx) return;

    this.animationId = requestAnimationFrame(() => this.drawWaveform());

    const WIDTH = this.canvas.width;
    const HEIGHT = this.canvas.height;

    this.canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
    this.analyser.getByteTimeDomainData(this.dataArray);

    this.canvasCtx.lineWidth = 2;
    this.canvasCtx.strokeStyle = '#e74c3c';
    this.canvasCtx.beginPath();

    const sliceWidth = WIDTH * 1.0 / this.analyser.frequencyBinCount;
    let x = 0;

    for (let i = 0; i < this.analyser.frequencyBinCount; i++) {
      const v = this.dataArray[i] / 128.0;
      const y = v * HEIGHT / 2;

      if (i === 0) {
        this.canvasCtx.moveTo(x, y);
      } else {
        this.canvasCtx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    this.canvasCtx.lineTo(WIDTH, HEIGHT / 2);
    this.canvasCtx.stroke();
  }

  playRecordedAudio(): void {
    const audioUrl = this.recordedAudioUrl();
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play()
        .then(() => console.log('Ses oynatılıyor'))
        .catch(e => {
          console.error("Ses oynatma hatası:", e);
          this.feedback.set('⚠️ Ses oynatılamadı.');
        });
    } else {
      console.log("Oynatılacak ses kaydı yok.");
      if (this.practiceMode() === 'chatbot') {
        this.feedback.set('⚠️ No recorded audio available.');
      } else {
        this.feedback.set('⚠️ Henüz bir kayıt yapılmadı.');
      }
    }
  }

  // GÜNCELLENDİ: Chatbot modunda farklı davranış
  private processRecognitionResult(transcript: string, confidence: number = 0): void {
    if (this.practiceMode() === 'chatbot') {
      // Bu durumda zaten processChatbotMessage çağrılmış olmalı
      return;
    }

    console.log('İşlenen transcript:', transcript, 'Confidence:', confidence);

    const userSpoken = this.normalizeText(transcript);
    const targetContent = this.normalizeText(this.word());

    console.log('Normalize hedef:', targetContent);
    console.log('Normalize kullanıcı:', userSpoken);

    const similarity = this.calculateSimilarity(userSpoken, targetContent);
    const isExactMatch = userSpoken === targetContent;
    const isCloseMatch = similarity > 0.85;
    const isPartialMatch = similarity > 0.6;

    let feedbackHtml = '';
    let feedbackClass = '';

    if (isExactMatch) {
      feedbackClass = 'feedback-success';
      feedbackHtml = `
        <div class="feedback-content">
          ✅ <strong>Mükemmel!</strong> Doğru telaffuz.
          <div class="confidence-score">Güven skoru: ${(confidence * 100).toFixed(0)}%</div>
        </div>
      `;
    } else if (isCloseMatch) {
      feedbackClass = 'feedback-warning';
      feedbackHtml = `
        <div class="feedback-content">
          🟡 <strong>Çok yakın!</strong> Telaffuzunuz hedefe oldukça benziyor.
          <div class="word-comparison">
            <div>Hedef: <strong>${this.word()}</strong></div>
            <div>Sen: <em>${transcript}</em></div>
          </div>
          <div class="similarity-score">Benzerlik: ${(similarity * 100).toFixed(0)}%</div>
          ${confidence > 0 ? `<div class="confidence-score">Güven: ${(confidence * 100).toFixed(0)}%</div>` : ''}
        </div>
      `;
    } else if (isPartialMatch) {
      feedbackClass = 'feedback-partial';
      feedbackHtml = `
        <div class="feedback-content">
          🟠 <strong>Yaklaşık bir eşleşme!</strong>
          <div class="word-comparison">
            <div>Hedef: <strong>${this.word()}</strong></div>
            <div>Sen: <em>${transcript}</em></div>
          </div>
          <div class="suggestion">💡 Daha net telaffuz etmeyi deneyin.</div>
        </div>
      `;
    } else if (userSpoken.length === 0) {
      feedbackClass = 'feedback-error';
      feedbackHtml = `
        <div class="feedback-content">
          ⚠️ <strong>Ses algılanamadı veya çok kısaydı!</strong>
          <div class="suggestion">💡 Lütfen daha yüksek sesle ve net konuşun.</div>
        </div>
      `;
    } else {
      feedbackClass = 'feedback-error';
      feedbackHtml = `
        <div class="feedback-content">
          ❌ <strong>Tekrar deneyin!</strong>
          <div class="word-comparison">
            <div>Hedef: <strong>${this.word()}</strong></div>
            <div>Sen: <em>${transcript}</em></div>
          </div>
          ${confidence > 0 ? `<div class="confidence-score">Güven: ${(confidence * 100).toFixed(0)}%</div>` : ''}
          <div class="suggestion">💡 Hedef ${this.practiceMode() === 'word' ? 'kelimeye' : 'cümleye'} odaklanın.</div>
        </div>
      `;
    }

    this.feedback.set(`<div class="${feedbackClass}">${feedbackHtml}</div>`);
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ');
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;

    if (len1 === 0) return len2 === 0 ? 1 : 0;
    if (len2 === 0) return 0;

    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        const cost = (str2.charAt(i - 1) === str1.charAt(j - 1)) ? 0 : 1;

        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + cost,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }

    const distance = matrix[len2][len1];
    const maxLen = Math.max(len1, len2);
    return (maxLen - distance) / maxLen;
  }

  calibrateMicrophone(): void {
    this.feedback.set('🎤 Mikrofon kalibrasyonu başlıyor... Lütfen birkaç saniye konuşun.');

    navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 44100
      }
    })
    .then(stream => {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let maxVolume = 0;
      let sampleCount = 0;
      const maxSamples = 100;

      const checkVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        const volume = dataArray.reduce((a, b) => a + b) / dataArray.length;
        maxVolume = Math.max(maxVolume, volume);
        sampleCount++;

        if (sampleCount < maxSamples) {
          setTimeout(checkVolume, 50);
        } else {
          stream.getTracks().forEach(track => track.stop());
          audioContext.close();

          if (maxVolume > 40) {
            this.feedback.set('✅ Mikrofon kalibrasyonu tamamlandı. Ses seviyesi uygun görünüyor.');
          } else {
            this.feedback.set(`
              <div class="feedback-warning">
                ⚠️ Düşük ses seviyesi tespit edildi. (Max Volume: ${maxVolume.toFixed(2)})<br>
                <small>• Mikrofona daha yakın konuşun<br>
                • Sistem ses seviyesini artırın<br>
                • Ortam gürültüsünü azaltın</small>
              </div>
            `);
          }
        }
      };

      checkVolume();
    })
    .catch(err => {
      console.error('Mikrofon kalibrasyon hatası:', err);
      this.feedback.set(`
        <div class="feedback-error">
          ⚠️ Mikrofon kalibrasyonu başarısız oldu. İzin reddedilmiş veya mikrofon bulunamadı.
          <small>Tarayıcı ayarlarınızı kontrol edin.</small>
        </div>
      `);
    });
  }

  manualTest(): void {
    if (!this.isDebugMode()) {
      this.feedback.set('Debug modu kapalı.');
      return;
    }

    if (this.practiceMode() === 'chatbot') {
      const userInput = prompt('Chatbot test - Ne söylemek istiyorsunuz?');
      if (userInput !== null) {
        this.recognizedText.set(userInput);
        this.processChatbotMessage(userInput);
      }
    } else {
      const userInput = prompt(`Hedef ${this.practiceMode() === 'word' ? 'kelime' : 'cümle'}: "${this.word()}"\nNe söylediğinizi yazın (manuel test):`);
      if (userInput !== null) {
        this.recognizedText.set(userInput);
        this.processRecognitionResult(userInput);
      }
    }
  }

  ngOnDestroy(): void {
    this.stopVisualization();
    if (this.currentStream) {
      this.currentStream.getTracks().forEach(track => track.stop());
    }

    if (this.recordedAudioUrl()) {
      URL.revokeObjectURL(this.recordedAudioUrl());
    }
    
    /* YORUM SATIRI - ESKİ Recognition temizlik:
    if (this.recognition && this.isListening()) {
        this.recognition.abort();
    }
    */
    
    if (this.volumeCallback) {
        clearTimeout(this.volumeCallback as any);
    }
    
    // YENİ: Chatbot konuşmasını durdur
    speechSynthesis.cancel();
  }
}
    