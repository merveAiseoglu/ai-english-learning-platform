/**
 * Stats Service
 * Tracks user statistics and progress
 * Manages learned words, completed quizzes, study days, and user level
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ 
  providedIn: 'root' 
})
export class StatsService {
  // Observable state for statistics
  private learnedWordsSubject = new BehaviorSubject<number>(this.getNumber('learnedWords', 0));
  private completedQuizzesSubject = new BehaviorSubject<number>(this.getNumber('completedQuizzes', 0));
  private studyDaysSubject = new BehaviorSubject<number>(this.getNumber('studyDays', 0));
  private currentLevelSubject = new BehaviorSubject<string>(this.getString('currentLevel', 'Beginner'));

  // Public observables for components to subscribe
  learnedWords$ = this.learnedWordsSubject.asObservable();
  completedQuizzes$ = this.completedQuizzesSubject.asObservable();
  studyDays$ = this.studyDaysSubject.asObservable();
  currentLevel$ = this.currentLevelSubject.asObservable();

  constructor() {}

  /**
   * Increment learned words counter
   */
  incrementLearnedWords(by = 1): void {
    this.updateStudyDayIfNeeded();
    const next = this.learnedWordsSubject.value + by;
    this.learnedWordsSubject.next(next);
    this.setNumber('learnedWords', next);
  }

  /**
   * Increment completed quizzes counter
   */
  incrementCompletedQuizzes(by = 1): void {
    this.updateStudyDayIfNeeded();
    const next = this.completedQuizzesSubject.value + by;
    this.completedQuizzesSubject.next(next);
    this.setNumber('completedQuizzes', next);
  }

  /**
   * Set user's current level
   */
  setLevel(level: 'Beginner' | 'Intermediate' | 'Advanced'): void {
    this.updateStudyDayIfNeeded();
    this.currentLevelSubject.next(level);
    this.setString('currentLevel', level);
  }

  /**
   * Update study day counter if it's a new day
   * Prevents counting the same day multiple times
   */
  private updateStudyDayIfNeeded(): void {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD format
    const lastStudyDate = this.getString('lastStudyDate', '');

    if (lastStudyDate !== today) {
      // New study day, increment counter and update date
      const next = this.studyDaysSubject.value + 1;
      this.studyDaysSubject.next(next);
      this.setNumber('studyDays', next);
      this.setString('lastStudyDate', today);
    }
  }

  /**
   * Helper: Get number from localStorage with fallback
   */
  private getNumber(key: string, fallback: number): number {
    try {
      const value = localStorage.getItem(key);
      if (value === null) {
        return fallback;
      }
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? fallback : parsed;
    } catch {
      return fallback;
    }
  }

  /**
   * Helper: Save number to localStorage
   */
  private setNumber(key: string, value: number): void {
    try {
      localStorage.setItem(key, String(value));
    } catch (error) {
      console.error('Failed to save number to localStorage:', error);
    }
  }

  /**
   * Helper: Get string from localStorage with fallback
   */
  private getString(key: string, fallback: string): string {
    try {
      return localStorage.getItem(key) ?? fallback;
    } catch {
      return fallback;
    }
  }

  /**
   * Helper: Save string to localStorage
   */
  private setString(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Failed to save string to localStorage:', error);
    }
  }
}