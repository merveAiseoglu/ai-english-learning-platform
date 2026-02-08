import { Component, OnInit, OnDestroy } from '@angular/core';
import { ListeningService, ListeningText, MultipleChoiceQuestion, TrueFalseQuestion } from '../../services/listening.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-listening',
  standalone: true,
  templateUrl: './listening.html',
  styleUrls: ['./listening.css'],
  imports: [CommonModule, FormsModule]
})
export class Listening implements OnInit, OnDestroy {
  texts: ListeningText[] = [];
  currentText: ListeningText | null = null;
  currentWords: string[] = [];
  blanksIndices: number[] = [];
  userInputs: { [key: number]: string } = {};
  checkResults: string[] | null = null;

  // Yeni özellikler için state'ler
  multipleChoiceAnswers: { [key: number]: number } = {}; // Soru ID -> Seçilen cevap index
  trueFalseAnswers: { [key: number]: boolean } = {}; // Soru ID -> True/False
  mcQuestionResults: { [key: number]: boolean } = {}; // Soru ID -> Doğru mu?
  tfQuestionResults: { [key: number]: boolean } = {}; // Soru ID -> Doğru mu?
  
  currentExerciseType: 'blanks' | 'multiple-choice' | 'true-false' = 'blanks';

  audioPlayer: HTMLAudioElement | null = null;
  isPlaying = false;
  isLoading = false;
  audioError: string | null = null;

  // Yeni özellikler için state'ler
  currentTime = 0;
  duration = 0;
  playbackRate = 1;
  availableRates = [0.5, 0.75, 1, 1.25, 1.5];

  constructor(private listeningService: ListeningService) {}

  ngOnInit(): void {
    console.log('Component: Initializing...');
    
    this.listeningService.getTexts().subscribe({
      next: (data) => {
        this.texts = data;
        console.log('Component: Loaded texts:', this.texts);
        
        if (this.texts.length > 0) {
          this.loadText(0);
        }
      },
      error: (error) => {
        console.error('Component: Service error:', error);
        this.audioError = 'Texts could not be loaded';
      }
    });
  }

  ngOnDestroy(): void {
    this.destroyAudio();
  }

  loadText(index: number): void {
    if (index >= this.texts.length) return;
    
    console.log(`Component: Loading text...`);
    
    // Previous audio'yu tamamen yok et
    this.destroyAudio();
    
    // Reset state
    this.isLoading = false;
    this.audioError = null;
    this.checkResults = null;
    this.userInputs = {};
    // Yeni state'leri de sıfırla
    this.multipleChoiceAnswers = {};
    this.trueFalseAnswers = {};
    this.mcQuestionResults = {};
    this.tfQuestionResults = {};
    this.currentExerciseType = 'blanks';

    this.currentText = this.texts[index];
    console.log('Component: Selected text:', this.currentText);
    this.prepareText();

    // Setup audio file ama henüz yükleme
    if (this.currentText?.audio) {
      const audioUrl = `assets/audio/${this.currentText.audio}`;
      console.log('Component: Audio URL hazırlandı:', audioUrl);
      // setupAudio'yu çağırmıyoruz, sadece hazırlıyoruz
    } else {
      this.audioError = 'Audio file not defined';
    }
  }

  // Tamamen yeni approach - audio'yu sadece play butonuna basıldığında oluştur
  async playAudio(): Promise<void> {
    if (!this.currentText?.audio) {
      this.audioError = 'Audio file not defined';
      return;
    }

    console.log('Component: Play button clicked');
    
    // Previous audio'yu yok et
    this.destroyAudio();
    
    const audioUrl = `assets/audio/${this.currentText.audio}`;
    console.log('Component: Creating new audio:', audioUrl);
    
    try {
      this.isLoading = true;
      this.audioError = null;
      
      // Yeni audio oluştur
      this.audioPlayer = new Audio(audioUrl);
      this.audioPlayer.playbackRate = this.playbackRate; // Hız ayarını uygula
      
      // Basit promise ile bekle
      await this.waitForAudioReady();
      
      // Progress tracking için event'leri ayarla
      this.setupProgressTracking();
      
      // Oynat
      await this.audioPlayer.play();
      this.isPlaying = true;
      
      console.log('Component: Audio successfully started');
      
    } catch (error) {
      console.error('Component: Audio error:', error);
      this.audioError = `Audio playback failed: ${audioUrl}`;
      this.destroyAudio();
    } finally {
      this.isLoading = false;
    }
  }

  private setupProgressTracking(): void {
    if (!this.audioPlayer) return;

    // Duration yüklendiğinde (tekrar kontrol et)
    this.audioPlayer.onloadedmetadata = () => {
      this.duration = this.audioPlayer?.duration || 0;
      console.log('Component: Metadata event - Audio duration:', this.duration);
    };

    // Duration verisi hazır olduğunda
    this.audioPlayer.ondurationchange = () => {
      this.duration = this.audioPlayer?.duration || 0;
      console.log('Component: Duration change - Audio duration:', this.duration);
    };

    // Progress tracking
    this.audioPlayer.ontimeupdate = () => {
      this.currentTime = this.audioPlayer?.currentTime || 0;
      
      // Duration hala 0 ise tekrar dene
      if (this.duration === 0 && this.audioPlayer?.duration) {
        this.duration = this.audioPlayer.duration;
        console.log('Component: Duration delayed update:', this.duration);
      }
    };

    // Audio bitince
    this.audioPlayer.onended = () => {
      this.isPlaying = false;
      this.currentTime = this.duration; // Son pozisyona git
      console.log('Component: Audio ended');
    };
  }

  private waitForAudioReady(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.audioPlayer) {
        reject(new Error('Audio player not found'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Audio loading timeout'));
      }, 10000); // 10 saniye timeout

      this.audioPlayer.oncanplaythrough = () => {
        clearTimeout(timeout);
        
        // Duration'ı hemen al
        this.duration = this.audioPlayer?.duration || 0;
        console.log('Component: Audio ready, duration:', this.duration);
        
        resolve();
      };

      this.audioPlayer.onloadedmetadata = () => {
        // Metadata loadedğinde duration'ı al
        this.duration = this.audioPlayer?.duration || 0;
        console.log('Component: Metadata loaded, duration:', this.duration);
      };

      this.audioPlayer.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Audio loading error'));
      };

      this.audioPlayer.load();
    });
  }

  pauseAudio(): void {
    if (this.audioPlayer && this.isPlaying) {
      this.audioPlayer.pause();
      this.isPlaying = false;
      console.log('Component: Audio paused');
    }
  }

  restartAudio(): void {
    if (this.audioPlayer) {
      this.audioPlayer.currentTime = 0;
      if (!this.isPlaying) {
        this.playAudio();
      }
    }
  }

  // Tamamen yok et
  private destroyAudio(): void {
    if (this.audioPlayer) {
      console.log('Component: Destroying audio...');
      
      this.audioPlayer.pause();
      this.audioPlayer.currentTime = 0;
      this.audioPlayer.src = '';
      
      // Tüm event handler'ları null yap
      this.audioPlayer.oncanplaythrough = null;
      this.audioPlayer.onerror = null;
      this.audioPlayer.onended = null;
      this.audioPlayer.onloadedmetadata = null;
      this.audioPlayer.ontimeupdate = null;
      this.audioPlayer.ondurationchange = null;
      
      this.audioPlayer = null;
      this.isPlaying = false;
      
      console.log('Component: Audio yok edildi');
    }
    
    // Progress state'lerini sıfırla
    this.currentTime = 0;
    this.duration = 0;
  }

  prepareText(): void {
    if (!this.currentText) return;

    this.currentWords = this.currentText.transcript.split(' ');
    this.blanksIndices = [];
    this.userInputs = {};

    // Her 7. kelimeyi boş bırak
    for (let i = 6; i < this.currentWords.length; i += 7) {
      this.blanksIndices.push(i);
      this.userInputs[i] = '';
    }
    
    console.log('Component: Boş alanlar:', this.blanksIndices);
  }

  onTextSelect(index: number): void {
    this.loadText(index);
  }

  checkAnswers(): string[] {
    const results: string[] = [];

    for (const idx of this.blanksIndices) {
      const userInput = (this.userInputs[idx] || '').trim().toLowerCase();
      const correctWord = this.currentWords[idx].toLowerCase();

      if (userInput === correctWord) {
        results.push('✔');
      } else {
        results.push(`✘ (Doğru: ${correctWord})`);
      }
    }

    this.checkResults = results;
    return results;
  }

  // Çoktan seçmeli soruları kontrol et
  checkMultipleChoiceAnswers(): void {
    if (!this.currentText?.multipleChoiceQuestions) return;

    this.mcQuestionResults = {};
    
    for (const question of this.currentText.multipleChoiceQuestions) {
      const userAnswer = this.multipleChoiceAnswers[question.id];
      const isCorrect = userAnswer === question.correctAnswer;
      this.mcQuestionResults[question.id] = isCorrect;
      
      console.log(`MC Soru ${question.id}: Kullanıcı ${userAnswer}, Doğru ${question.correctAnswer}, Sonuç: ${isCorrect}`);
    }
  }

  // Doğru/Yanlış sorularını kontrol et
  checkTrueFalseAnswers(): void {
    if (!this.currentText?.trueFalseQuestions) return;

    this.tfQuestionResults = {};
    
    for (const question of this.currentText.trueFalseQuestions) {
      const userAnswer = this.trueFalseAnswers[question.id];
      const isCorrect = userAnswer === question.correctAnswer;
      this.tfQuestionResults[question.id] = isCorrect;
      
      console.log(`TF Soru ${question.id}: Kullanıcı ${userAnswer}, Doğru ${question.correctAnswer}, Sonuç: ${isCorrect}`);
    }
  }

  // Egzersiz türünü değiştir
  switchExerciseType(type: 'blanks' | 'multiple-choice' | 'true-false'): void {
    this.currentExerciseType = type;
    console.log('Exercise type changed:', type);
  }

  // Genel skor hesaplaması
  getOverallScore(): { correct: number; total: number; percentage: number } {
    let correct = 0;
    let total = 0;

    // Boşluk doldurma skorları
    if (this.checkResults) {
      total += this.checkResults.length;
      correct += this.getCorrectAnswersCount();
    }

    // Çoktan seçmeli skorları
    if (this.currentText?.multipleChoiceQuestions) {
      total += this.currentText.multipleChoiceQuestions.length;
      for (const question of this.currentText.multipleChoiceQuestions) {
        if (this.mcQuestionResults[question.id]) {
          correct++;
        }
      }
    }

    // Doğru/Yanlış skorları
    if (this.currentText?.trueFalseQuestions) {
      total += this.currentText.trueFalseQuestions.length;
      for (const question of this.currentText.trueFalseQuestions) {
        if (this.tfQuestionResults[question.id]) {
          correct++;
        }
      }
    }

    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    return { correct, total, percentage };
  }

  // Template için getter'lar
  get canPlay(): boolean {
    return !!this.currentText?.audio && !this.isLoading && !this.audioError;
  }

  get showError(): boolean {
    return !!this.audioError;
  }

  get showLoading(): boolean {
    return this.isLoading;
  }

  // Skor hesaplamaları
  getCorrectAnswersCount(): number {
    if (!this.checkResults) return 0;
    
    let correctCount = 0;
    for (let i = 0; i < this.checkResults.length; i++) {
      if (this.checkResults[i].includes('✔')) {
        correctCount++;
      }
    }
    return correctCount;
  }

  getScorePercentage(): number {
    if (!this.checkResults || this.checkResults.length === 0) return 0;
    
    const correctCount = this.getCorrectAnswersCount();
    const percentage = (correctCount / this.checkResults.length) * 100;
    return Math.round(percentage);
  }

  // Çoktan seçmeli doğru cevap sayısı
  getMCCorrectCount(): number {
    let count = 0;
    for (const key in this.mcQuestionResults) {
      if (this.mcQuestionResults[key]) {
        count++;
      }
    }
    return count;
  }

  // Doğru/Yanlış doğru cevap sayısı
  getTFCorrectCount(): number {
    let count = 0;
    for (const key in this.tfQuestionResults) {
      if (this.tfQuestionResults[key]) {
        count++;
      }
    }
    return count;
  }

  // Debug metodları
  debugAudio(): void {
    console.log('=== AUDIO DEBUG ===');
    console.log('Current Text:', this.currentText);
    console.log('Audio Player:', this.audioPlayer);
    console.log('Audio URL:', this.audioPlayer?.src);
    console.log('Ready State:', this.audioPlayer?.readyState);
    console.log('Duration (component):', this.duration);
    console.log('Duration (audio element):', this.audioPlayer?.duration);
    console.log('Current Time:', this.currentTime);
    console.log('Playback Rate:', this.playbackRate);
    console.log('Is Loading:', this.isLoading);
    console.log('Audio Error:', this.audioError);
    
    // SORU DEBUG'I EKLEDİM
    console.log('=== QUESTIONS DEBUG ===');
    console.log('Multiple Choice Questions:', this.currentText?.multipleChoiceQuestions);
    console.log('True/False Questions:', this.currentText?.trueFalseQuestions);
    console.log('MC Questions Length:', this.currentText?.multipleChoiceQuestions?.length || 0);
    console.log('TF Questions Length:', this.currentText?.trueFalseQuestions?.length || 0);
    console.log('==================');
  }

  // Yeni metodlar - hız kontrolü
  changePlaybackRate(rate: number): void {
    this.playbackRate = rate;
    if (this.audioPlayer) {
      this.audioPlayer.playbackRate = rate;
      console.log('Component: Playback rate changed:', rate);
    }
  }

  // Progress bar kontrolü
  seekTo(percentage: number): void {
    if (this.audioPlayer && this.duration > 0) {
      const newTime = (percentage / 100) * this.duration;
      this.audioPlayer.currentTime = newTime;
      this.currentTime = newTime;
      console.log('Component: Audio position changed:', newTime);
    }
  }

  // Progress bar click event handler
  onProgressBarClick(event: MouseEvent): void {
    const target = event.currentTarget as HTMLElement;
    if (target) {
      const rect = target.getBoundingClientRect();
      const offsetX = event.clientX - rect.left;
      const percentage = (offsetX / target.offsetWidth) * 100;
      this.seekTo(percentage);
    }
  }

  // Progress bar için yüzde hesaplama
  getProgressPercentage(): number {
    if (this.duration === 0) return 0;
    return (this.currentTime / this.duration) * 100;
  }

  // Zaman formatı
  formatTime(seconds: number): string {
    if (isNaN(seconds)) return '0:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  // Harf dönüştürme helper'ı (A, B, C, D için)
  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  // Object.keys helper metodları
  hasMCResults(): boolean {
    return Object.keys(this.mcQuestionResults).length > 0;
  }

  hasTFResults(): boolean {
    return Object.keys(this.tfQuestionResults).length > 0;
  }

  hasAnyResults(): boolean {
    return this.checkResults !== null || this.hasMCResults() || this.hasTFResults();
  }

  testFiles(): void {
    console.log('=== COMPONENT FILE TEST ===');
    if (this.texts.length > 0) {
      this.listeningService.testAudioUrls(this.texts);
    } else {
      console.warn('Component: No text loaded yet');
    }
  }

  forceCleanup(): void {
    console.log('Component: Running force cleanup...');
    this.destroyAudio();
    console.log('Component: Force cleanup completed');
  }

  // Soru debug metodu
  debugQuestions(): void {
    console.log('=== QUESTIONS DEBUG ===');
    console.log('All Texts:', this.texts);
    console.log('Current Text:', this.currentText);
    console.log('Current Exercise Type:', this.currentExerciseType);
    
    if (this.currentText) {
      console.log('MC Questions:', this.currentText.multipleChoiceQuestions);
      console.log('TF Questions:', this.currentText.trueFalseQuestions);
      console.log('MC Count:', this.currentText.multipleChoiceQuestions?.length || 0);
      console.log('TF Count:', this.currentText.trueFalseQuestions?.length || 0);
      
      // Button disabled durumlarını kontrol et
      const mcDisabled = !this.currentText?.multipleChoiceQuestions || this.currentText.multipleChoiceQuestions.length === 0;
      const tfDisabled = !this.currentText?.trueFalseQuestions || this.currentText.trueFalseQuestions.length === 0;
      
      console.log('MC Button Disabled:', mcDisabled);
      console.log('TF Button Disabled:', tfDisabled);
      
      // JSON'dan gelen ham veriyi kontrol et
      console.log('Raw currentText object:', JSON.stringify(this.currentText, null, 2));
    }
    console.log('==================');
  }

  // Test: Zorla egzersiz türünü değiştir
  testSwitchExercise(): void {
    console.log('Test: Switching to multiple choice...');
    this.switchExerciseType('multiple-choice');
    
    setTimeout(() => {
      console.log('Test: Switching to true/false...');
      this.switchExerciseType('true-false');
    }, 2000);
    
    setTimeout(() => {
      console.log('Test: Returning to fill-in-the-blanks...');
      this.switchExerciseType('blanks');
    }, 4000);
  }
}