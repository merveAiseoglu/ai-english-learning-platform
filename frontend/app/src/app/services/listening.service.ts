/**
 * Listening Service
 * Manages listening comprehension exercises
 * Loads audio texts with questions from JSON and provides fallback data
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, catchError, map } from 'rxjs';

export interface MultipleChoiceQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number; // Index of correct answer (0, 1, 2, 3)
  explanation?: string;
}

export interface TrueFalseQuestion {
  id: number;
  statement: string;
  correctAnswer: boolean;
  explanation?: string;
}

export interface ListeningText {
  id: number;
  title: string;
  audio: string;
  transcript: string;
  multipleChoiceQuestions?: MultipleChoiceQuestion[];
  trueFalseQuestions?: TrueFalseQuestion[];
}

interface ListeningTextFromJson {
  id: number;
  title: string;
  transcript: string;
  audioFile: string;
  multipleChoiceQuestions?: MultipleChoiceQuestion[];
  trueFalseQuestions?: TrueFalseQuestion[];
}

@Injectable({
  providedIn: 'root'
})
export class ListeningService {
  private dataUrl = 'assets/listening-texts.json';

  constructor(private http: HttpClient) {}

  /**
   * Load all listening texts from JSON file
   * Falls back to hardcoded data if JSON fails to load
   */
  getTexts(): Observable<ListeningText[]> {
    console.log('Loading listening texts from JSON...');
    
    return this.http.get<ListeningTextFromJson[]>(this.dataUrl).pipe(
      map(texts => {
        console.log('Raw data from JSON:', texts);
        
        // Add .mp3 extension to audio files
        const processedTexts = texts.map(text => ({
          ...text,
          audio: `${text.audioFile}.mp3`
        }));
        
        console.log('Processed listening texts:', processedTexts);
        return processedTexts;
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Failed to load listening texts JSON:', error);
        console.error('Attempted URL:', this.dataUrl);
        console.error('Error code:', error.status);
        console.error('Error message:', error.message);
        
        // Return fallback data
        console.warn('Using fallback data');
        return of(this.getFallbackData());
      })
    );
  }

  /**
   * Fallback data when JSON fails to load
   */
  private getFallbackData(): ListeningText[] {
    return [
      {
        id: 1,
        title: "A Day at the Park (Fallback)",
        audio: "a_day_at_the_park.mp3",
        transcript: "Today was a beautiful sunny day at the park. Children were playing on the swings and slides. Many families were having picnics on the grass. The birds were singing in the trees and the flowers were blooming everywhere."
      }
    ];
  }

  /**
   * Test if JSON file exists and is accessible
   */
  testJsonFile(): Observable<boolean> {
    console.log('Testing JSON file accessibility...');
    
    return this.http.get(this.dataUrl, { responseType: 'text' }).pipe(
      map(() => {
        console.log('✅ JSON file found');
        return true;
      }),
      catchError((error) => {
        console.error('❌ JSON file not found:', error);
        return of(false);
      })
    );
  }

  /**
   * Test audio file URLs accessibility
   * Useful for debugging audio loading issues
   */
  testAudioUrls(texts: ListeningText[]): void {
    console.log('=== AUDIO URL TEST STARTING ===');
    
    const testUrls = texts.map(text => `assets/audio/${text.audio}`);
    
    testUrls.forEach((url, index) => {
      fetch(url)
        .then(response => {
          if (response.ok) {
            console.log(`✅ File ${index + 1} exists:`, url);
          } else {
            console.error(`❌ File ${index + 1} not found:`, url, response.status);
          }
        })
        .catch(error => {
          console.error(`❌ File ${index + 1} fetch error:`, url, error);
        });
    });
  }
}