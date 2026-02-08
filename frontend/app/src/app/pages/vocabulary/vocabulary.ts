/**
 * Vocabulary Page Component
 * Main component for vocabulary learning with multiple modes
 * 
 * Features:
 * - Learn mode: Interactive flashcards
 * - Quiz mode: Multiple-choice vocabulary tests
 * - Search mode: Word filtering and lookup
 * - Review mode: Practice unknown/difficult words
 * - Statistics tracking and progress monitoring
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { VocabularyService } from '../../services/vocabulary.service';
import { Word } from '../../shared/interfaces';
import { Flashcard } from '../../components/flashcard/flashcard';

/** Quiz result feedback interface */
interface QuizResult {
  isCorrect: boolean;
  message: string;
  type: 'success' | 'error';
}

/** Quiz statistics tracking */
interface QuizStats {
  currentQuestion: number;
  totalQuestions: number;
  score: number;
  percentage: number;
  timeLeft?: number;
}

@Component({
  selector: 'app-vocabulary',
  standalone: true,
  imports: [CommonModule, FormsModule, Flashcard],
  templateUrl: './vocabulary.html',
  styleUrls: ['./vocabulary.css']
})
export class Vocabulary implements OnInit, OnDestroy {
  // ========================
  // DATA PROPERTIES
  // ========================
  
  /** All vocabulary words */
  words: Word[] = [];
  
  /** Filtered words based on search/filters */
  filteredWords: Word[] = [];
  
  /** Words marked for review */
  unknownWords: Word[] = [];

  // ========================
  // UI STATE
  // ========================
  
  loading = false;
  error: string | null = null;
  activeTab: string = 'learn';

  // ========================
  // SEARCH & FILTER
  // ========================
  
  searchTerm: string = '';
  selectedPos: string = 'all';
  posOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'noun', label: 'Nouns' },
    { value: 'verb', label: 'Verbs' },
    { value: 'adj', label: 'Adjectives' },
    { value: 'adv', label: 'Adverbs' }
  ];

  // ========================
  // QUIZ STATE
  // ========================
  
  /** Words selected for current quiz */
  quizWords: Word[] = [];
  
  /** Current quiz question word */
  currentWord: Word | null = null;
  
  /** Index of current question */
  currentWordIndex: number = 0;
  
  /** Answer options for current question */
  options: string[] = [];
  
  /** Correct answer for current question */
  correctAnswer: string = '';
  
  /** User's selected answer */
  selectedAnswer: string = '';
  
  /** Whether current question has been answered */
  isAnswered: boolean = false;
  
  /** Current quiz score */
  score: number = 0;
  
  /** Total questions in quiz */
  totalQuestions: number = 10;

  /** Quiz started flag */
  quizStarted: boolean = false;
  
  /** Quiz completed flag */
  quizCompleted: boolean = false;
  
  /** Current quiz feedback result */
  quizResult: QuizResult | null = null;
  
  /** Quiz statistics */
  quizStats: QuizStats = {
    currentQuestion: 0,
    totalQuestions: 10,
    score: 0,
    percentage: 0
  };
  
  /** Show feedback message flag */
  showFeedback: boolean = false;
  
  /** Question transition animation flag */
  questionAnimating: boolean = false;
  
  /** Results screen animation flag */
  resultAnimating: boolean = false;

  // ========================
  // STATISTICS
  // ========================
  
  /** Overall vocabulary statistics */
  statistics: {
    totalWords?: number;
    learnedWords?: number;
    masteredWords?: number;
    wordsToReview?: number;
  } = {};

  /** Daily study statistics */
  dailyStats = {
    dailyStreak: 0,
    totalPoints: 0,
    studiedToday: false
  };

  // ========================
  // OBSERVABLES & CLEANUP
  // ========================
  
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(private vocabularyService: VocabularyService) {}

  // ========================
  // LIFECYCLE HOOKS
  // ========================

  ngOnInit(): void {
    this.setupSubscriptions();
    this.loadInitialData();

    // Debounced search handling
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => {
      this.searchTerm = term.toLowerCase();
      this.performFilter();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========================
  // DATA SUBSCRIPTION SETUP
  // ========================

  private setupSubscriptions(): void {
    // Subscribe to vocabulary word list
    this.vocabularyService.vocabulary$
      .pipe(takeUntil(this.destroy$))
      .subscribe(words => {
        this.words = Array.isArray(words) ? words : [];
        this.performFilter();
        this.updateStatistics();
        this.loading = false;
        this.error = this.words.length === 0 ? 'No words found.' : null;

        // CRITICAL FIX: Only reinitialize quiz if not already started
        // This prevents quiz from resetting when word list updates
        if (this.activeTab === 'quiz' && this.words.length > 0 && !this.quizStarted) {
          this.initializeQuiz();
        }
      });

    // Subscribe to unknown words
    this.vocabularyService.unknownWords$
      .pipe(takeUntil(this.destroy$))
      .subscribe(unknowns => {
        this.unknownWords = Array.isArray(unknowns) ? unknowns : [];
      });

    // Subscribe to daily stats
    this.vocabularyService.dailyStats$
      .pipe(takeUntil(this.destroy$))
      .subscribe(stats => {
        this.dailyStats = stats;
      });
  }

  /** Load initial word data */
  private loadInitialData(): void {
    this.loading = true;
    this.error = null;
    this.vocabularyService.getAllWords()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (err) => {
          this.error = err?.message || 'Error loading words.';
          this.loading = false;
        }
      });
  }

  /** Retry loading data after error */
  retry(): void {
    this.loadInitialData();
  }

  // ========================
  // TAB NAVIGATION
  // ========================

  /** Switch between different tabs/modes */
  switchTab(tabName: string): void {
    // Clean up quiz state when leaving quiz tab
    if (this.activeTab === 'quiz' && tabName !== 'quiz') {
      this.quizStarted = false;
      this.quizCompleted = false;
    }

    this.activeTab = tabName;

    switch (tabName) {
      case 'quiz':
        // Quiz initialization happens on button click
        break;
      case 'search':
        this.performFilter();
        break;
      case 'review':
        this.filteredWords = [...this.unknownWords];
        break;
      case 'learn':
      default:
        this.performFilter();
        break;
    }
  }

  // ========================
  // SEARCH & FILTER
  // ========================

  /** Handle search input changes (debounced) */
  onSearchChange(term: string): void {
    this.searchSubject.next(term);
  }

  /** Handle part-of-speech filter changes */
  onPosFilterChange(): void {
    this.performFilter();
  }

  /** Apply current filters to word list */
  private performFilter(): void {
    let filtered = [...this.words];

    // Filter by review status if on review tab
    if (this.activeTab === 'review') {
      filtered = filtered.filter(w => this.isUnknown(w));
    }

    // Filter by search term
    if (this.searchTerm.trim()) {
      filtered = filtered.filter(w =>
        w.word.toLowerCase().includes(this.searchTerm) ||
        (w.meaning_tr && w.meaning_tr.toLowerCase().includes(this.searchTerm))
      );
    }

    // Filter by part of speech
    if (this.selectedPos !== 'all') {
      filtered = filtered.filter(w => 
        (w.pos || '').toLowerCase() === this.selectedPos
      );
    }

    this.filteredWords = filtered;
  }

  // ========================
  // WORD STATUS MANAGEMENT
  // ========================

  /** Mark word as known */
  markAsKnown(word: Word): void {
    word.status = 'learned';
    this.vocabularyService.updateWordStatus(word);
    this.updateStatistics();
    if (this.activeTab === 'review') {
      this.filteredWords = this.filteredWords.filter(w => w.id !== word.id);
    }
  }

  /** Mark word as mastered */
  markAsMastered(word: Word): void {
    word.status = 'mastered';
    this.vocabularyService.updateWordStatus(word);
    this.updateStatistics();
  }

  /** Mark word for review */
  markForReview(word: Word): void {
    word.status = 'review';
    this.vocabularyService.updateWordStatus(word);
    this.updateStatistics();
  }

  /** Mark word as unknown and add to review list */
  markAsUnknown(word: Word): void {
    this.vocabularyService.updateWordLevel(word, false);
    this.addToUnknown(word);
    this.updateStatistics();
  }

  /** Add word to unknown words list */
  addToUnknown(word: Word): void {
    this.vocabularyService.addToUnknownWords(word);
  }

  /** Remove word from unknown words list */
  removeFromUnknown(word: Word): void {
    this.vocabularyService.removeUnknownWord(word);
  }

  /** Check if word is in unknown list */
  isUnknown(word: Word): boolean {
    return this.unknownWords.some(w => w.id === word.id);
  }

  // Continued in next part...
  // ========================
  // QUIZ INITIALIZATION
  // ========================

  /** Initialize and start a new quiz */
  initializeQuiz(): void {
    // Filter words with valid meanings
    const validWords = this.words.filter(w => 
      w.meaning_tr && w.meaning_tr.trim() !== ''
    );

    if (validWords.length < 4) {
      console.warn('Not enough words for quiz (minimum 4 required)');
      this.error = 'At least 4 words with meanings are required to start the quiz.';
      return;
    }

    // Select random questions
    const questionCount = Math.min(this.totalQuestions, validWords.length);
    this.quizWords = this.shuffleArray([...validWords]).slice(0, questionCount);

    // Reset quiz state
    this.quizStarted = true;
    this.quizCompleted = false;
    this.currentWordIndex = 0;
    this.score = 0;
    this.isAnswered = false;
    this.selectedAnswer = '';
    this.quizResult = null;
    this.showFeedback = false;
    
    this.quizStats = {
      currentQuestion: 1,
      totalQuestions: this.quizWords.length,
      score: 0,
      percentage: 0
    };

    this.loadCurrentQuestion();
  }

  // ========================
  // QUIZ QUESTION MANAGEMENT
  // ========================

  /** Load current quiz question */
  private loadCurrentQuestion(): void {
    if (this.currentWordIndex >= this.quizWords.length) {
      this.finishQuiz();
      return;
    }

    this.questionAnimating = true;
    
    setTimeout(() => {
      this.currentWord = this.quizWords[this.currentWordIndex];
      
      // CRITICAL: Skip words without meanings to prevent getting stuck
      if (!this.currentWord?.meaning_tr) {
        console.warn('Invalid word encountered, skipping:', this.currentWord);
        this.currentWordIndex++; 
        this.loadCurrentQuestion(); 
        return; 
      }

      this.correctAnswer = this.currentWord.meaning_tr;
      this.selectedAnswer = '';
      this.isAnswered = false;
      this.showFeedback = false;
      this.quizResult = null;
      
      this.quizStats.currentQuestion = this.currentWordIndex + 1;
      
      this.generateOptions();
      
      this.questionAnimating = false;
    }, 300);
  }

  /** Generate 4 multiple choice options (1 correct + 3 wrong) */
  private generateOptions(): void {
    if (!this.currentWord?.meaning_tr) {
      this.options = [];
      return;
    }

    const correctAnswer = this.currentWord.meaning_tr;
    
    // Get other word meanings as incorrect options
    const otherMeanings = this.words
      .filter(w => 
        w.id !== this.currentWord?.id && 
        w.meaning_tr && 
        w.meaning_tr.trim() !== '' &&
        w.meaning_tr !== correctAnswer
      )
      .map(w => w.meaning_tr!);

    let wrongOptions: string[] = [];
    
    // Fallback if not enough other meanings available
    if (otherMeanings.length < 3) {
      const fallbackMeanings = this.words
        .map(w => w.meaning_tr!)
        .filter(m => m && m.trim() !== '' && m !== correctAnswer);
      
      const uniqueFallbacks = [...new Set(fallbackMeanings)];
      wrongOptions = this.shuffleArray(uniqueFallbacks).slice(0, 3);
    } else {
      wrongOptions = this.shuffleArray(otherMeanings).slice(0, 3);
    }
    
    // Shuffle correct answer with wrong options
    this.options = this.shuffleArray([correctAnswer, ...wrongOptions]);
  }

  // ========================
  // QUIZ ANSWER HANDLING
  // ========================

  /** Handle user's answer selection */
  selectAnswer(option: string): void {
    if (this.isAnswered || this.questionAnimating) return;

    this.isAnswered = true;
    this.selectedAnswer = option;

    const isCorrect = option === this.correctAnswer;
    
    // Update score and word status
    if (isCorrect) {
      this.score++;
      if (this.currentWord) {
        this.markAsKnown(this.currentWord);
      }
    } else if (this.currentWord) {
      this.markAsUnknown(this.currentWord);
    }

    // Update quiz statistics
    this.quizStats.score = this.score;
    this.quizStats.percentage = Math.round(
      (this.score / this.quizStats.totalQuestions) * 100
    );

    // Show feedback
    this.quizResult = {
      isCorrect: isCorrect,
      message: isCorrect 
        ? '🎉 Correct answer!' 
        : `❌ Wrong! Correct answer: ${this.correctAnswer}`,
      type: isCorrect ? 'success' : 'error'
    };

    this.showFeedback = true;
  }

  /** Move to next quiz question */
  nextQuestion(): void {
    if (!this.isAnswered) return;

    this.currentWordIndex++;
    this.loadCurrentQuestion();
  }

  // ========================
  // QUIZ COMPLETION
  // ========================

  /** Finish quiz and show results */
  private finishQuiz(): void {
    this.quizCompleted = true;
    this.quizStarted = false;
    this.resultAnimating = true;
    
    this.quizStats.percentage = Math.round(
      (this.score / this.quizWords.length) * 100
    );
    
    setTimeout(() => {
      this.resultAnimating = false;
    }, 500);
  }

  /** Restart quiz with new questions */
  restartQuiz(): void {
    this.quizCompleted = false;
    this.initializeQuiz();
  }

  /** Exit quiz and return to learn mode */
  exitQuiz(): void {
    this.quizStarted = false;
    this.quizCompleted = false;
    this.switchTab('learn');
  }

  // ========================
  // QUIZ HELPER METHODS
  // ========================

  /** Get current quiz progress percentage */
  getProgressPercentage(): number {
    if (!this.quizStats.totalQuestions) return 0;
    return (this.quizStats.currentQuestion / this.quizStats.totalQuestions) * 100;
  }

  /** Get result message based on score */
  getResultMessage(): string {
    const percentage = this.quizStats.percentage;
    if (percentage >= 80) return '🎉 Excellent! Amazing performance!';
    if (percentage >= 60) return '👍 Good! You can improve even more!';
    return '💪 Keep practicing! You can do it!';
  }

  /** Get CSS class for result screen based on score */
  getResultClass(): string {
    const percentage = this.quizStats.percentage;
    if (percentage >= 80) return 'excellent';
    if (percentage >= 60) return 'good';
    return 'needs-improvement';
  }

  /** Shuffle array using Fisher-Yates algorithm */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // ========================
  // STATISTICS & TRACKING
  // ========================

  /** Update vocabulary statistics */
  updateStatistics(): void {
    this.statistics = this.vocabularyService.getStatistics();
  }

  /** TrackBy function for word list performance */
  trackByWord(index: number, word: Word): any {
    return word?.id ?? index;
  }

  /** TrackBy function for quiz options */
  trackByOption(index: number, option: string): any {
    return option;
  }
}