/**
 * Flashcard Component
 * Handles vocabulary learning through interactive flashcards
 * 
 * Features:
 * - 3D card flip animation
 * - Mark words as known/unknown with SRS integration
 * - Quiz mode with multiple choice
 * - Text-to-speech for word pronunciation
 * - Daily streak tracking
 */

import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { VocabularyService } from '../../services/vocabulary.service';
import { Word } from '../../shared/interfaces';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-flashcard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './flashcard.html',
  styleUrls: ['./flashcard.css']
})
export class Flashcard implements OnInit, OnDestroy {
  @Input() word!: Word;

  // Word lists
  words: Word[] = [];
  unknownWords: Word[] = [];

  // Current view mode
  currentView: 'flashcard' | 'quiz' | 'unknown' = 'flashcard';

  // Flashcard state
  private _currentIndex = 0;
  showBack = false;

  // Quiz state
  currentQuestionIndex = 0;
  currentOptions: string[] = [];
  selectedOption = '';
  showResult = false;
  isCorrect = false;
  correctAnswers = 0;
  totalAnswered = 0;

  // Streak tracking
  streak = 0;

  // Cleanup subject for subscriptions
  private destroy$ = new Subject<void>();

  constructor(private vocabularyService: VocabularyService) {}

  /** Current card index getter */
  get currentIndex(): number {
    return this._currentIndex;
  }

  /** Current card index setter */
  set currentIndex(value: number) {
    this._currentIndex = value;
  }

  /** Get word object at the current index */
  get currentWord(): Word | undefined {
    return this.words[this._currentIndex];
  }

  // ========================
  // LIFECYCLE HOOKS
  // ========================

  ngOnInit(): void {
    // Subscribe to vocabulary word list
    this.vocabularyService.vocabulary$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.words = data || [];
        if (this.currentView === 'quiz') {
          this.generateQuizOptions();
        }
        this.updateStreak();
      });

    // Subscribe to unknown words list
    this.vocabularyService.unknownWords$
      .pipe(takeUntil(this.destroy$))
      .subscribe(u => {
        this.unknownWords = Array.isArray(u) ? u : [];
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========================
  // FLASHCARD ACTIONS
  // ========================

  /** Flip the card to show/hide back face */
  flipCard(): void {
    this.showBack = !this.showBack;
  }

  /** Mark current word as known - advances SRS level */
  markKnown(): void {
    if (this.currentWord) {
      this.vocabularyService.updateWordLevel(this.currentWord, true);
      this.currentWord.status = 'learned';
      this.vocabularyService.updateWordStatus(this.currentWord);
      this.vocabularyService.updateDailyStats();
    }
    this.nextCard();
  }

  /** Mark current word as unknown - resets SRS, adds to review list */
  markUnknown(): void {
    if (this.currentWord) {
      this.vocabularyService.updateWordLevel(this.currentWord, false);
      this.vocabularyService.addToUnknownWords(this.currentWord);
      this.currentWord.status = 'review';
      this.vocabularyService.updateWordStatus(this.currentWord);
    }
    this.nextCard();
  }

  /** Move to next card, loops back to start at the end */
  nextCard(): void {
    if (this._currentIndex < this.words.length - 1) {
      this._currentIndex++;
    } else {
      this._currentIndex = 0;
    }
    this.showBack = false;
  }

  /** Play pronunciation of current word */
  playCurrentWord(): void {
    if (this.currentWord) {
      this.playWord(this.currentWord.word);
    }
  }

  // ========================
  // QUIZ ACTIONS
  // ========================

  /** Switch between flashcard / quiz / unknown views */
  setView(view: 'flashcard' | 'quiz' | 'unknown'): void {
    this.currentView = view;
    if (view === 'quiz') {
      this.resetQuiz();
    }
  }

  /** Generate 4 options: 1 correct + 3 random incorrect answers */
  generateQuizOptions(): void {
    if (!this.currentWord) return;

    const correctAnswer = this.currentWord.meaning_tr;

    const incorrectAnswers = this.words
      .filter(w => w.meaning_tr !== correctAnswer)
      .map(w => w.meaning_tr)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    // Shuffle all options randomly
    this.currentOptions = [correctAnswer, ...incorrectAnswers]
      .sort(() => Math.random() - 0.5);
  }

  /** Handle user's answer selection */
  selectOption(option: string): void {
    if (this.showResult) return; // Ignore clicks after answer shown

    this.selectedOption = option;
    this.isCorrect = option === this.currentWord?.meaning_tr;
    this.showResult = true;
    this.totalAnswered++;

    if (this.isCorrect) {
      this.correctAnswers++;
    } else if (this.currentWord) {
      this.vocabularyService.addToUnknownWords(this.currentWord);
    }
  }

  /** Advance to next quiz question */
  nextQuestion(): void {
    this.currentQuestionIndex++;

    // All questions answered - show results
    if (this.currentQuestionIndex >= this.words.length) {
      alert(`Quiz completed! ${this.correctAnswers}/${this.totalAnswered} correct answers.`);
      this.resetQuiz();
      return;
    }

    this.showResult = false;
    this.selectedOption = '';
    this.generateQuizOptions();
  }

  /** Reset quiz back to beginning */
  resetQuiz(): void {
    this.currentQuestionIndex = 0;
    this.correctAnswers = 0;
    this.totalAnswered = 0;
    this.showResult = false;
    this.selectedOption = '';
    this.generateQuizOptions();
  }

  // ========================
  // AUDIO & UTILITIES
  // ========================

  /** Speak word using Web Speech API */
  playWord(word: string): void {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    speechSynthesis.speak(utterance);
  }

  /** Update daily streak based on last practice date in localStorage */
  updateStreak(): void {
    const today = new Date().toDateString();
    const storedDate = localStorage.getItem('lastPracticeDate');
    let streak = Number(localStorage.getItem('streak') || '0');

    if (storedDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      if (storedDate && new Date(storedDate).toDateString() === yesterday.toDateString()) {
        streak++; // Yesterday practiced - continue streak
      } else {
        streak = 1; // Gap detected - restart streak
      }

      localStorage.setItem('streak', streak.toString());
      localStorage.setItem('lastPracticeDate', today);
    }

    this.streak = streak;
  }
}