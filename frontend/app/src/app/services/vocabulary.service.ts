/**
 * Vocabulary Service
 * Comprehensive vocabulary management with SRS (Spaced Repetition System)
 * 
 * Features:
 * - CRUD operations for words via MockAPI
 * - Local storage fallback and caching
 * - Spaced repetition system for efficient learning
 * - Unknown words tracking
 * - Daily statistics and streak tracking
 * - Progress persistence
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, retry, map, tap } from 'rxjs/operators';
import { Word } from '../shared/interfaces';

@Injectable({
  providedIn: 'root'
})
export class VocabularyService {
  private apiUrl = 'https://68921434447ff4f11fbf1da2.mockapi.io/vocabulary/words';

  // Word state management
  private wordsSubject = new BehaviorSubject<Word[]>([]);
  public vocabulary$ = this.wordsSubject.asObservable();

  private unknownWordsSubject = new BehaviorSubject<Word[]>([]);
  public unknownWords$ = this.unknownWordsSubject.asObservable();

  // Daily statistics state
  private dailyStatsSubject = new BehaviorSubject<any>({
    dailyStreak: 0,
    totalPoints: 0,
    studiedToday: false
  });
  public dailyStats$ = this.dailyStatsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadUnknownWords();
    this.loadWords();
    this.loadDailyStats();
  }

  // ========================
  // NORMALIZATION HELPERS
  // ========================

  /**
   * Normalize fetched word data to match our Word interface
   * Handles different API response formats
   */
  private normalizeFetchedWord(raw: any): Word {
    const w: Word = {
      id: raw?.id ?? raw?.ID ?? undefined,
      word: raw?.word ?? raw?.word_en ?? '',
      pos: raw?.pos ?? '',
      meaning_tr: raw?.meaning_tr ?? raw?.definition_tr ?? '',
      example_en: raw?.example_en ?? raw?.example ?? '',
      example_tr: raw?.example_tr ?? '',
      synonyms: Array.isArray(raw?.synonyms) ? raw.synonyms : [],
      antonyms: Array.isArray(raw?.antonyms) ? raw.antonyms : [],
      other_forms: raw?.other_forms ?? raw?.otherForms ?? null,
      level: typeof raw?.level === 'number' ? raw.level : 0,
      status: raw?.status ?? 'new',
      isKnown: raw?.isKnown ?? false,
      nextReviewDate: raw?.nextReviewDate ? new Date(raw.nextReviewDate) : null,
      lastReviewDate: raw?.lastReviewDate ? new Date(raw.lastReviewDate) : null
    };
    
    // Set initial review date if not set
    if (!w.nextReviewDate) {
      w.nextReviewDate = new Date();
    }
    
    return w;
  }

  /**
   * Serialize words for localStorage storage
   * Converts Date objects to ISO strings
   */
  private serializeForStorage(words: Word[]): any[] {
    return words.map(w => ({
      ...w,
      nextReviewDate: w.nextReviewDate instanceof Date ? w.nextReviewDate.toISOString() : w.nextReviewDate,
      lastReviewDate: w.lastReviewDate instanceof Date ? w.lastReviewDate.toISOString() : w.lastReviewDate
    }));
  }

  /**
   * Deserialize words from localStorage
   * Converts ISO strings back to Date objects
   */
  private deserializeFromStorage(raw: any[]): Word[] {
    return (raw || []).map((w: any) => ({
      ...w,
      nextReviewDate: w?.nextReviewDate ? new Date(w.nextReviewDate) : null,
      lastReviewDate: w?.lastReviewDate ? new Date(w.lastReviewDate) : null
    }));
  }

  // ========================
  // API CRUD OPERATIONS
  // ========================

  /**
   * Fetch all words from API
   */
  getAllWords(): Observable<Word[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(arr => (arr || []).map(item => this.normalizeFetchedWord(item))),
      retry(2),
      tap(words => {
        this.wordsSubject.next(words);
        this.saveProgress();
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get single word by ID
   */
  getWordById(id: number | string): Observable<Word> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(item => this.normalizeFetchedWord(item)),
      retry(2),
      catchError(this.handleError)
    );
  }

  /**
   * Create new word in API
   */
  createWord(wordPartial: Partial<Word>): Observable<Word> {
    return this.http.post<any>(this.apiUrl, wordPartial).pipe(
      map(item => this.normalizeFetchedWord(item)),
      tap(newWord => {
        const current = this.wordsSubject.value || [];
        this.wordsSubject.next([...current, newWord]);
        this.saveProgress();
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Update existing word in API
   */
  updateWord(id: number | string, update: Partial<Word>): Observable<Word> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, update).pipe(
      map(item => this.normalizeFetchedWord(item)),
      tap(updatedWord => {
        const current = [...this.wordsSubject.value];
        const idx = current.findIndex(w => 
          (w.id !== undefined && updatedWord.id !== undefined && w.id === updatedWord.id) || 
          w.word === updatedWord.word
        );
        
        if (idx !== -1) {
          current[idx] = { ...current[idx], ...updatedWord };
        } else {
          current.push(updatedWord);
        }
        
        this.wordsSubject.next(current);
        this.saveProgress();
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Update word status (learned, mastered, review)
   * Uses optimistic update pattern for better UX
   */
  updateWordStatus(word: Word): void {
    if (!word || typeof word.id === 'undefined') {
      console.error('Invalid word or missing ID:', word);
      return;
    }

    // 1. Optimistic update - update UI immediately
    const currentWords = this.wordsSubject.value;
    const updatedWords = currentWords.map(w => 
      w.id === word.id 
        ? { ...w, status: word.status, isKnown: word.status === 'learned' || word.status === 'mastered' } 
        : w
    );
    this.wordsSubject.next(updatedWords);
    this.saveProgress();

    // 2. Send request to backend
    const payload = { status: word.status };
    this.http.put(`${this.apiUrl}/${word.id}`, payload).subscribe({
      next: () => console.log(`Word #${word.id} status updated on server: ${word.status}`),
      error: (err) => {
        console.error(`Failed to update word #${word.id} status on server:`, err);
        // Rollback on error
        this.wordsSubject.next(currentWords);
        this.saveProgress();
      }
    });
  }

  /**
   * Delete word from API
   */
  deleteWord(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const remaining = this.wordsSubject.value.filter(w => w.id !== id);
        this.wordsSubject.next(remaining);
        this.saveProgress();
      }),
      catchError(this.handleError)
    );
  }

  // ========================
  // LOADING & STORAGE
  // ========================

  /**
   * Load words from localStorage or API
   * Falls back to assets/kelimeler.json if all else fails
   */
  private loadWords(): void {
    const saved = localStorage.getItem('vocabularyProgress');
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const words = this.deserializeFromStorage(parsed);
        this.wordsSubject.next(words);
      } catch (e) {
        console.error('localStorage parse error, fetching from API...', e);
        this.getAllWords().subscribe({
          error: () => this.loadWordsFromAssets()
        });
      }
    } else {
      this.getAllWords().subscribe({
        error: () => this.loadWordsFromAssets()
      });
    }
  }
  
  /**
   * Load words from local JSON file as last resort
   */
  private loadWordsFromAssets(): void {
    this.http.get<any[]>('assets/kelimeler.json').pipe(
      map(arr => (arr || []).map(i => {
        const normalized = this.normalizeFetchedWord(i);
        normalized.level = 0;
        normalized.nextReviewDate = new Date();
        normalized.lastReviewDate = null;
        return normalized;
      }))
    ).subscribe({
      next: data => {
        this.wordsSubject.next(data);
        this.saveProgress();
      },
      error: err => console.error('Failed to load assets/kelimeler.json', err)
    });
  }

  /**
   * Save current progress to localStorage
   */
  private saveProgress(): void {
    try {
      const serialized = this.serializeForStorage(this.wordsSubject.value || []);
      localStorage.setItem('vocabularyProgress', JSON.stringify(serialized));
    } catch (e) {
      console.error('Failed to save progress:', e);
    }
  }

  /**
   * Reset all progress
   */
  resetProgress(): void {
    localStorage.removeItem('vocabularyProgress');
    this.loadWords();
  }

  // ========================
  // FILTERING
  // ========================

  /**
   * Filter words by search term
   * Searches in word, meaning, POS, synonyms, and antonyms
   */
  filterWords(words: Word[], searchTerm: string): Word[] {
    if (!searchTerm || !searchTerm.trim()) {
      return words || [];
    }
    
    const term = searchTerm.toLowerCase().trim();
    return (words || []).filter(word =>
      (word?.word || '').toLowerCase().includes(term) ||
      (word?.meaning_tr || '').toLowerCase().includes(term) ||
      (word?.pos || '').toLowerCase().includes(term) ||
      (word?.synonyms || []).some(s => (s || '').toLowerCase().includes(term)) ||
      (word?.antonyms || []).some(a => (a || '').toLowerCase().includes(term))
    );
  }

  // ========================
  // UNKNOWN WORDS MANAGEMENT
  // ========================

  /**
   * Load unknown words from localStorage
   */
  private loadUnknownWords(): void {
    const stored = localStorage.getItem('unknownWords');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const words = this.deserializeFromStorage(parsed);
        this.unknownWordsSubject.next(words);
      } catch (e) {
        console.error('Failed to parse unknownWords:', e);
        this.unknownWordsSubject.next([]);
      }
    }
  }

  /**
   * Save unknown words to localStorage
   */
  private saveUnknownWords(): void {
    try {
      const serialized = this.serializeForStorage(this.unknownWordsSubject.value || []);
      localStorage.setItem('unknownWords', JSON.stringify(serialized));
    } catch (e) {
      console.error('Failed to save unknownWords:', e);
    }
  }

  /**
   * Add word to unknown words list
   */
  addToUnknownWords(word: Word): void {
    const current = this.unknownWordsSubject.value || [];
    if (!current.some(w => w.word === word.word)) {
      const updated = [...current, word];
      this.unknownWordsSubject.next(updated);
      this.saveUnknownWords();
    }
  }

  /**
   * Remove word from unknown words list
   */
  removeUnknownWord(word: Word): void {
    const filtered = (this.unknownWordsSubject.value || []).filter(w => w.word !== word.word);
    this.unknownWordsSubject.next(filtered);
    this.saveUnknownWords();
  }

  // ========================
  // SPACED REPETITION SYSTEM (SRS)
  // ========================

  /**
   * Get words that are due for review based on nextReviewDate
   */
  getWordsToReview(): Word[] {
    const now = new Date();
    return (this.wordsSubject.value || []).filter(w => {
      if (!w.nextReviewDate) return true;
      const reviewDate = w.nextReviewDate instanceof Date 
        ? w.nextReviewDate 
        : new Date(w.nextReviewDate as any);
      return reviewDate <= now;
    });
  }

  /**
   * Update word level based on review performance
   * Implements spaced repetition algorithm
   */
  updateWordLevel(word: Word, isCorrect: boolean): void {
    const words = [...this.wordsSubject.value];
    const idx = words.findIndex(w => 
      (w.id !== undefined && word.id !== undefined && w.id === word.id) || 
      w.word === word.word
    );
    
    if (idx === -1) return;

    const updated: Word = { ...words[idx] };

    if (isCorrect) {
      // Increase level and schedule next review
      updated.level = (updated.level || 0) + 1;
      const daysToAdd = this.calculateNextReviewDays(updated.level || 0);
      const next = new Date();
      next.setDate(next.getDate() + daysToAdd);
      updated.nextReviewDate = next;
    } else {
      // Reset level and show immediately for review
      updated.level = 0;
      updated.nextReviewDate = new Date();
    }

    updated.lastReviewDate = new Date();

    words[idx] = updated;
    this.wordsSubject.next(words);
    this.saveProgress();

    // Sync with server if word has ID
    if (updated.id !== undefined) {
      const payload: Partial<Word> = {
        level: updated.level,
        nextReviewDate: updated.nextReviewDate instanceof Date 
          ? updated.nextReviewDate.toISOString() 
          : updated.nextReviewDate as any,
        lastReviewDate: updated.lastReviewDate instanceof Date 
          ? updated.lastReviewDate.toISOString() 
          : updated.lastReviewDate as any
      };
      
      this.updateWord(updated.id, payload).subscribe({
        error: err => console.error('Failed to sync word update with server:', err)
      });
    }
  }

  /**
   * Calculate next review interval based on SRS level
   * Level 0: same day, Level 1: 1 day, Level 2: 3 days, etc.
   */
  private calculateNextReviewDays(level: number): number {
    const intervals = [0, 1, 3, 7, 14, 30];
    return intervals[Math.min(level, intervals.length - 1)];
  }

  // ========================
  // STATISTICS
  // ========================

  /**
   * Get vocabulary statistics
   */
  getStatistics() {
    const words = this.wordsSubject.value || [];
    return {
      totalWords: words.length,
      learnedWords: words.filter(w => (w.level || 0) > 0).length,
      masteredWords: words.filter(w => (w.level || 0) >= 5).length,
      wordsToReview: this.getWordsToReview().length
    };
  }

  /**
   * Load daily statistics from localStorage
   */
  loadDailyStats(): void {
    const streak = parseInt(localStorage.getItem('dailyStreak') || '0');
    const points = parseInt(localStorage.getItem('totalPoints') || '0');
    const lastDate = localStorage.getItem('lastStudyDate');
    const today = new Date().toDateString();
    
    let currentStreak = streak;
    
    // Check if streak is broken
    if (lastDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastDate && new Date(lastDate).toDateString() !== yesterday.toDateString()) {
        currentStreak = 0; // Streak broken
      }
    }
    
    this.dailyStatsSubject.next({
      dailyStreak: currentStreak,
      totalPoints: points,
      studiedToday: lastDate === today
    });
  }

  /**
   * Update daily statistics (streak and points)
   * Called when user completes study activities
   */
  updateDailyStats(): void {
    const today = new Date().toDateString();
    const lastDate = localStorage.getItem('lastStudyDate');
    
    // Update points (+10 per correct answer)
    let currentPoints = parseInt(localStorage.getItem('totalPoints') || '0');
    currentPoints += 10;
    localStorage.setItem('totalPoints', currentPoints.toString());
    
    // Update streak (only on first study of the day)
    if (lastDate !== today) {
      let currentStreak = parseInt(localStorage.getItem('dailyStreak') || '0');
      
      if (lastDate) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (new Date(lastDate).toDateString() === yesterday.toDateString()) {
          currentStreak++; // Continue streak
        } else {
          currentStreak = 1; // Restart streak
        }
      } else {
        currentStreak = 1; // First day
      }
      
      localStorage.setItem('dailyStreak', currentStreak.toString());
      localStorage.setItem('lastStudyDate', today);
    }
    
    // Update observable
    this.dailyStatsSubject.next({
      dailyStreak: parseInt(localStorage.getItem('dailyStreak') || '0'),
      totalPoints: parseInt(localStorage.getItem('totalPoints') || '0'),
      studiedToday: true
    });
  }

  // ========================
  // ERROR HANDLING
  // ========================

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse) {
    console.error('API Error:', error);
    
    let errorMessage = 'An error occurred. Please try again.';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Server Error: ${error.status} - ${error.message}`;
    }
    
    return throwError(() => new Error(errorMessage));
  }
}