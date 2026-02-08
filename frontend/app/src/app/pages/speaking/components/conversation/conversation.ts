/**
 * Conversation Component
 * AI-powered conversation practice for speaking
 * 
 * Features:
 * - Real-time chat with AI assistant
 * - Language and difficulty selection
 * - Connection status monitoring
 * - Message history management
 * - Markdown formatting support
 */

import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OpenAIService, ChatMessage } from 'src/app/pages/speaking/openai.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-conversation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [OpenAIService],
  templateUrl: './conversation.html',
  styleUrls: ['./conversation.css']
})
export class ConversationComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;

  messages: ChatMessage[] = [];
  currentMessage = '';
  isLoading = false;
  selectedLanguage: 'tr' | 'en' = 'tr';
  selectedDifficulty: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
  connectionStatus: 'connected' | 'disconnected' | 'checking' = 'checking';

  private destroy$ = new Subject<void>();
  private shouldScrollToBottom = false;

  languageOptions = [
    { value: 'tr', label: 'Türkçe' },
    { value: 'en', label: 'English' }
  ];

  difficultyOptions = [
    { value: 'beginner', label: 'Başlangıç' },
    { value: 'intermediate', label: 'Orta' },
    { value: 'advanced', label: 'İleri' }
  ];

  constructor(public aiChatService: OpenAIService) {}

  ngOnInit(): void {
    this.initializeChat();
    this.checkServerConnection();

    this.aiChatService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => (this.isLoading = loading));
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Initialize chat with welcome message */
  private initializeChat(): void {
    const welcomeMessage: ChatMessage = {
      id: 'welcome_' + Date.now(),
      content: this.getWelcomeMessage(),
      role: 'assistant',
      timestamp: new Date()
    };
    this.messages = [welcomeMessage];
    this.shouldScrollToBottom = true;
  }

  /** Check backend server connection */
  private checkServerConnection(): void {
    this.connectionStatus = 'checking';
    this.aiChatService
      .checkHealth()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => (this.connectionStatus = 'connected'),
        error: err => {
          this.connectionStatus = 'disconnected';
          console.error('Server connection failed:', err);
        }
      });
  }

  /** Send user message to AI */
  sendMessage(): void {
    if (!this.currentMessage.trim() || this.isLoading) return;

    if (this.connectionStatus === 'disconnected') {
      this.showErrorMessage(
        'Cannot connect to server. Please make sure the backend is running.'
      );
      return;
    }

    const userMessage = this.aiChatService.createUserMessage(this.currentMessage);
    this.messages.push(userMessage);

    const messageToSend = this.currentMessage;
    this.currentMessage = '';
    this.shouldScrollToBottom = true;

    this.aiChatService
      .sendMessage(messageToSend, this.selectedLanguage, this.selectedDifficulty)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: aiMessage => {
          this.messages.push(aiMessage);
          this.shouldScrollToBottom = true;
        },
        error: err => {
          this.showErrorMessage(err.message);
          console.error('AI Chat Error:', err);
        }
      });
  }

  /** Handle Enter key press */
  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  /** Clear all chat messages */
  clearChat(): void {
    if (this.isLoading) return;

    this.aiChatService
      .clearConversation()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.messages = [];
          this.initializeChat();
        },
        error: err => {
          console.error('Clear chat error:', err);
          this.messages = [];
          this.initializeChat();
        }
      });
  }

  /** Start a new conversation */
  startNewConversation(): void {
    this.aiChatService.startNewConversation();
    this.clearChat();
  }

  /** Handle language change */
  onLanguageChange(): void {
    this.startNewConversation();
  }

  /** Handle difficulty change */
  onDifficultyChange(): void {
    const infoMessage: ChatMessage = {
      id: 'info_' + Date.now(),
      content: `Difficulty level changed to "${this.getDifficultyLabel()}". You can continue the conversation.`,
      role: 'assistant',
      timestamp: new Date()
    };
    this.messages.push(infoMessage);
    this.shouldScrollToBottom = true;
  }

  /** Retry server connection */
  retryConnection(): void {
    this.checkServerConnection();
  }

  /** Show error message in chat */
  private showErrorMessage(errorText: string): void {
    const errorMessage: ChatMessage = {
      id: 'error_' + Date.now(),
      content: `❌ Error: ${errorText}`,
      role: 'assistant',
      timestamp: new Date()
    };
    this.messages.push(errorMessage);
    this.shouldScrollToBottom = true;
  }

  /** Get welcome message based on language */
  private getWelcomeMessage(): string {
    const messages = {
      tr: `Merhaba! 👋 AI konuşma pratiği yapmaya hazır mısın? 
      
Benimle ${this.getDifficultyLabel().toLowerCase()} seviyesinde Türkçe pratik yapabilirsin. İstediğin konuda konuşabiliriz!`,
      en: `Hello! 👋 Ready for AI conversation practice?
      
We can practice English at ${this.selectedDifficulty} level. We can talk about any topic you'd like!`
    };
    return messages[this.selectedLanguage];
  }

  /** Get difficulty label in Turkish */
  private getDifficultyLabel(): string {
    const option = this.difficultyOptions.find(opt => opt.value === this.selectedDifficulty);
    return option ? option.label : 'Başlangıç';
  }

  /** Scroll chat to bottom */
  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        const element = this.messagesContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    } catch (err) {
      console.error('Scroll error:', err);
    }
  }

  /** Format timestamp for display */
  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /** Format message text with markdown support */
  formatMessageText(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  /** TrackBy function for message list */
  trackByMessageId(index: number, message: ChatMessage): string {
    return message.id!;
  }

  /** Get current conversation ID */
  getCurrentConversationId(): string {
    return this.aiChatService.getCurrentConversationId();
  }
}