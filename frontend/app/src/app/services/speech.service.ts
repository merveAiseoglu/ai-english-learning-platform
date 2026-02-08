/**
 * Speech Service
 * NOTE: This service may not be in use anymore (audio-recording.service.ts is used instead)
 * Handles audio file uploads for speech-to-text conversion
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SpeechService {
  private apiUrl = 'http://localhost:5000/speech-to-text';

  constructor(private http: HttpClient) {}

  /**
   * Upload audio file to backend for transcription
   */
  uploadAudio(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('audio', file);

    return this.http.post<any>(this.apiUrl, formData);
  }
}