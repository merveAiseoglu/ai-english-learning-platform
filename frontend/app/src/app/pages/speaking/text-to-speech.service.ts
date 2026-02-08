/**
 * Text-to-Speech Service
 * Wrapper around Web Speech API for text-to-speech functionality
 * 
 * Features:
 * - Convert text to speech with customizable voice settings
 * - Multiple language support
 * - Voice selection by language
 * - Playback control (play, pause, resume, stop)
 * - Rate, pitch, and volume adjustment
 */

import { Injectable } from '@angular/core';

export interface TTSOptions {
  language?: string;
  rate?: number;      // Speed of speech (0.1 - 10)
  pitch?: number;     // Voice pitch (0 - 2)
  volume?: number;    // Volume level (0 - 1)
  voice?: SpeechSynthesisVoice;
}

@Injectable({
  providedIn: 'root'
})
export class TextToSpeechService {
  private synth = window.speechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];
  private defaultOptions: TTSOptions = {
    language: 'en-US',
    rate: 1,
    pitch: 1,
    volume: 1
  };

  constructor() {
    this.loadVoices();
    
    // Wait for voices to be loaded
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = () => this.loadVoices();
    }
  }

  /**
   * Load available voices from browser
   */
  private loadVoices(): void {
    this.voices = this.synth.getVoices();
  }

  /**
   * Get all available voices
   */
  getVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  /**
   * Get voices filtered by language
   * @param language Language code (e.g., 'en', 'tr')
   */
  getVoicesByLanguage(language: string): SpeechSynthesisVoice[] {
    return this.voices.filter(voice => voice.lang.startsWith(language));
  }

  /**
   * Speak the given text with optional customization
   * @param text Text to be spoken
   * @param options Voice options (language, rate, pitch, volume, voice)
   */
  speak(text: string, options?: TTSOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!text.trim()) {
        resolve();
        return;
      }

      // Stop any ongoing speech
      this.stop();

      const utterance = new SpeechSynthesisUtterance(text);
      const opts = { ...this.defaultOptions, ...options };

      // Apply options
      utterance.lang = opts.language || 'en-US';
      utterance.rate = opts.rate || 1;
      utterance.pitch = opts.pitch || 1;
      utterance.volume = opts.volume || 1;

      // Set voice
      if (opts.voice) {
        utterance.voice = opts.voice;
      } else {
        // Select default voice for language
        const defaultVoice = this.voices.find(voice => 
          voice.lang === opts.language && voice.default
        ) || this.voices.find(voice => 
          voice.lang.startsWith(opts.language!.split('-')[0])
        );
        
        if (defaultVoice) {
          utterance.voice = defaultVoice;
        }
      }

      // Event handlers
      utterance.onend = () => resolve();
      utterance.onerror = (error) => reject(error);

      // Start speaking
      this.synth.speak(utterance);
    });
  }

  /**
   * Stop any ongoing speech
   */
  stop(): void {
    if (this.synth.speaking) {
      this.synth.cancel();
    }
  }

  /**
   * Check if currently speaking
   */
  isSpeaking(): boolean {
    return this.synth.speaking;
  }

  /**
   * Pause ongoing speech
   */
  pause(): void {
    if (this.synth.speaking) {
      this.synth.pause();
    }
  }

  /**
   * Resume paused speech
   */
  resume(): void {
    if (this.synth.paused) {
      this.synth.resume();
    }
  }
}