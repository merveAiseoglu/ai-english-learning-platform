/**
 * Audio Recording Service
 * Handles microphone recording, audio processing, and speech-to-text conversion
 * Supports WAV/WebM recording with optional MP3 conversion using lamejs
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// LameJS type declarations for MP3 encoding
declare const lamejs: {
  Mp3Encoder: new (channels: number, sampleRate: number, kbps: number) => {
    encodeBuffer(left: Int16Array, right?: Int16Array): Uint8Array;
    flush(): Uint8Array;
  };
  WavHeader: {
    readHeader(dataView: DataView): {
      channels: number;
      sampleRate: number;
      dataOffset: number;
      dataLen: number;
    };
  };
};

@Injectable({
  providedIn: 'root'
})
export class AudioRecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isRecording = false;
  private stream: MediaStream | null = null;

  constructor(private http: HttpClient) {}

  /**
   * Start recording audio from microphone
   * Requests microphone access and begins capturing audio
   */
  async startRecording(): Promise<void> {
    try {
      // Request microphone access with audio constraints
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      
      this.audioChunks = [];
      
      // Set recording format (prefer WAV, fallback to WebM)
      const options = { mimeType: 'audio/wav' };
      
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'audio/webm';
      }
      
      this.mediaRecorder = new MediaRecorder(this.stream, options);
      this.isRecording = true;

      // Collect audio data chunks
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
      };

      // Start recording, collect data every second
      this.mediaRecorder.start(1000);
    } catch (err) {
      console.error('🎤 Failed to start microphone:', err);
      throw err;
    }
  }

  /**
   * Stop recording and send audio to backend for transcription
   * Returns transcribed text
   */
  async stopRecording(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        return reject('Recording not started or already stopped.');
      }

      this.mediaRecorder.onstop = async () => {
        try {
          // Stop media stream
          if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
          }

          // Create blob from recorded chunks
          const originalBlob = new Blob(this.audioChunks, { 
            type: this.mediaRecorder?.mimeType || 'audio/wav' 
          });
          
          // Convert to MP3 if lamejs is available
          let audioBlob = originalBlob;
          if (typeof lamejs !== 'undefined') {
            try {
              audioBlob = await this.convertToMp3(originalBlob);
            } catch (conversionError) {
              console.warn('MP3 conversion failed, using original format:', conversionError);
            }
          }
          
          // Send to backend for transcription
          const text = await this.sendToBackend(audioBlob);
          resolve(text);
        } catch (err) {
          reject(err);
        } finally {
          this.cleanup();
        }
      };

      this.isRecording = false;
      this.mediaRecorder.stop();
    });
  }

  /**
   * Send audio to backend as Base64 encoded string
   * Alternative method for sending audio data
   */
  async sendToBackendBase64(audioBlob: Blob): Promise<string> {
    try {
      const base64Audio = await this.blobToBase64(audioBlob);
      
      const response = await this.http.post<any>(
        'http://localhost:5000/api/speech-to-text',
        { audioBase64: base64Audio }
      ).toPromise();

      return response.text || '';
    } catch (error) {
      console.error('Base64 Speech-to-Text error:', error);
      throw new Error('Failed to process audio file.');
    }
  }

  /**
   * Convert Blob to Base64 string
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove "data:audio/wav;base64," prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Convert audio blob to MP3 format using lamejs
   */
  private async convertToMp3(audioBlob: Blob): Promise<Blob> {
    try {
      // Convert Blob to ArrayBuffer
      const arrayBuffer = await audioBlob.arrayBuffer();
      
      // Decode audio data using AudioContext
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Extract audio parameters
      const channels = audioBuffer.numberOfChannels;
      const sampleRate = audioBuffer.sampleRate;
      const length = audioBuffer.length;
      
      // Convert left channel to Int16Array
      const left = new Int16Array(length);
      const leftData = audioBuffer.getChannelData(0);
      
      for (let i = 0; i < length; i++) {
        left[i] = Math.max(-32768, Math.min(32767, leftData[i] * 32768));
      }
      
      // Convert right channel if stereo
      let right: Int16Array | undefined;
      if (channels > 1) {
        right = new Int16Array(length);
        const rightData = audioBuffer.getChannelData(1);
        for (let i = 0; i < length; i++) {
          right[i] = Math.max(-32768, Math.min(32767, rightData[i] * 32768));
        }
      }

      // Initialize MP3 encoder
      const mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate, 128);
      const mp3Data: Uint8Array[] = [];
      const sampleBlockSize = 1152;

      // Encode audio data in blocks
      for (let i = 0; i < length; i += sampleBlockSize) {
        const leftChunk = left.subarray(i, i + sampleBlockSize);
        const rightChunk = right ? right.subarray(i, i + sampleBlockSize) : undefined;
        
        const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
        if (mp3buf.length > 0) {
          mp3Data.push(mp3buf);
        }
      }

      // Flush remaining data
      const endBuf = mp3encoder.flush();
      if (endBuf.length > 0) {
        mp3Data.push(endBuf);
      }

      // Create MP3 Blob
      const mp3DataAsArrayBuffer = mp3Data.map(chunk => new Uint8Array(chunk));
      return new Blob(mp3DataAsArrayBuffer, { type: 'audio/mp3' });
      
    } catch (error) {
      console.error('MP3 conversion error:', error);
      throw error;
    }
  }

  /**
   * Send audio blob to backend for transcription
   */
  private async sendToBackend(audioBlob: Blob): Promise<string> {
    try {
      const formData = new FormData();
      const fileName = audioBlob.type.includes('mp3') ? 'recording.mp3' : 'recording.wav';
      formData.append('audio', audioBlob, fileName);

      const response = await this.http.post<any>(
        'http://localhost:5000/transcribe',
        formData
      ).toPromise();

      return response.text || response.transcription || '';
    } catch (error) {
      console.error('Backend request failed:', error);
      throw new Error('Failed to process audio file. Please try again.');
    }
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    this.audioChunks = [];
    this.mediaRecorder = null;
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  /**
   * Check if currently recording
   */
  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Cancel ongoing recording without processing
   */
  cancelRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.isRecording = false;
      this.mediaRecorder.stop();
      this.cleanup();
    }
  }
}