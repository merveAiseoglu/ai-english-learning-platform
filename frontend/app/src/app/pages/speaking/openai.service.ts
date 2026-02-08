/**
 * OpenAI Service (Speaking Module)
 * Manages AI-powered conversation features for speaking practice
 * 
 * Features:
 * - Chat conversation with AI assistant
 * - Context-aware responses (language, difficulty)
 * - Conversation history management
 * - Health check for backend availability
 * - Loading state management
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
  success?: boolean; 
  error?: string;
}

export interface ChatResponse {
  reply: string;
  success: boolean;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OpenAIService {
  private readonly API_URL = 'http://localhost:5000/api/chat';
  private conversationHistory: ChatMessage[] = [];
  private conversationId: string = 'conv_' + Date.now();

  // Loading state observable for UI feedback
  loading$ = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) {}

  /**
   * Check if backend server is healthy and available
   */
  checkHealth(): Observable<boolean> {
    return this.http.get(`${this.API_URL}/health`).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  /**
   * Create a user message object
   */
  createUserMessage(text: string): ChatMessage {
    return {
      id: 'user_' + Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };
  }

  /**
   * Send message to AI and get response
   * @param message User's message text
   * @param language Language context (optional)
   * @param difficulty Difficulty level (optional)
   */
  sendMessage(message: string, language?: string, difficulty?: string): Observable<ChatMessage> {
    this.loading$.next(true);

    // Add user message to history
    this.conversationHistory.push(this.createUserMessage(message));

    // Build context string
    let context = '';
    if (language || difficulty) {
      context = `Language: ${language}, Difficulty: ${difficulty}`;
    }

    return this.http.post<ChatResponse>(this.API_URL, {
      message,
      conversation: this.conversationHistory.slice(-10), // Send last 10 messages for context
      context
    }).pipe(
      map(res => {
        const aiMessage: ChatMessage = {
          id: 'ai_' + Date.now(),
          role: 'assistant',
          content: res.reply,
          timestamp: new Date()
        };
        this.addAssistantMessage(aiMessage.content);
        this.loading$.next(false);
        return aiMessage;
      }),
      catchError(err => {
        this.loading$.next(false);
        throw err;
      })
    );
  }

  /**
   * Add assistant's response to conversation history
   */
  addAssistantMessage(message: string): void {
    this.conversationHistory.push({
      id: 'ai_' + Date.now(),
      role: 'assistant',
      content: message,
      timestamp: new Date()
    });
  }

  /**
   * Clear all conversation history
   */
  clearConversation(): Observable<void> {
    this.conversationHistory = [];
    return of(void 0);
  }

  /**
   * Start a new conversation with fresh ID
   */
  startNewConversation(): void {
    this.conversationHistory = [];
    this.conversationId = 'conv_' + Date.now();
  }

  /**
   * Get current conversation ID
   */
  getCurrentConversationId(): string {
    return this.conversationId;
  }

  /**
   * Get copy of conversation history
   */
  getConversationHistory(): ChatMessage[] {
    return [...this.conversationHistory];
  }
}