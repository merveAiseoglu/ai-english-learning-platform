/**
 * AI Chat Service
 * NOTE: This service is currently not in use
 * Kept for future reference or potential reactivation
 * 
 * Original Purpose:
 * - Manage AI-powered chat conversations
 * - Handle message sending/receiving with backend
 * - Track conversation state and history
 * - Support multiple languages and difficulty levels
 */

/* COMMENTED OUT - NOT CURRENTLY IN USE

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  conversationId?: string;
}

export interface ChatResponse {
  message: string;
  conversationId: string;
  timestamp: string;
}

export interface ChatRequest {
  message: string;
  conversationId: string;
  language?: 'tr' | 'en';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

@Injectable({
  providedIn: 'root'
})
export class AiChatService {
  private readonly API_URL = 'http://localhost:4000/api';
  private conversationId: string = '';
  
  // Loading state management
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {
    this.generateConversationId();
  }

  // Generate new conversation ID
  private generateConversationId(): void {
    this.conversationId = 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Send message to AI
  sendMessage(
    message: string, 
    language: 'tr' | 'en' = 'tr', 
    difficulty: 'beginner' | 'intermediate' | 'advanced' = 'beginner'
  ): Observable<ChatMessage> {
    this.loadingSubject.next(true);

    const request: ChatRequest = {
      message: message.trim(),
      conversationId: this.conversationId,
      language,
      difficulty
    };

    return this.http.post<ChatResponse>(`${this.API_URL}/chat`, request)
      .pipe(
        map(response => ({
          id: 'ai_' + Date.now(),
          text: response.message,
          sender: 'ai' as const,
          timestamp: new Date(response.timestamp),
          conversationId: response.conversationId
        })),
        catchError(this.handleError.bind(this)),
        map(result => {
          this.loadingSubject.next(false);
          return result;
        })
      );
  }

  // Clear conversation history
  clearConversation(): Observable<any> {
    return this.http.delete(`${this.API_URL}/chat/${this.conversationId}`)
      .pipe(
        map(() => {
          this.generateConversationId();
          return { success: true };
        }),
        catchError(this.handleError.bind(this))
      );
  }

  // Check server health
  checkHealth(): Observable<any> {
    return this.http.get(`${this.API_URL}/health`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  // Get current conversation ID
  getCurrentConversationId(): string {
    return this.conversationId;
  }

  // Start new conversation
  startNewConversation(): void {
    this.generateConversationId();
  }

  // Manually set loading state
  setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  // Error handling
  private handleError(error: HttpErrorResponse): Observable<never> {
    this.loadingSubject.next(false);
    
    let errorMessage = 'An unexpected error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Connection error: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 0:
          errorMessage = 'Cannot connect to server. Please ensure backend is running.';
          break;
        case 400:
          errorMessage = error.error?.error || 'Invalid request';
          break;
        case 429:
          errorMessage = 'Too many requests. Please wait.';
          break;
        case 500:
          errorMessage = error.error?.error || 'Server error occurred';
          break;
        default:
          errorMessage = `Error code ${error.status}: ${error.error?.error || error.message}`;
      }
    }

    console.error('AI Chat Service Error:', error);
    return throwError(() => new Error(errorMessage));
  }

  // Create user message object
  createUserMessage(text: string): ChatMessage {
    return {
      id: 'user_' + Date.now(),
      text: text.trim(),
      sender: 'user',
      timestamp: new Date(),
      conversationId: this.conversationId
    };
  }
}

END OF COMMENTED CODE */