/**
 * Dashboard Component
 * Displays user's learning progress and statistics
 * 
 * Features:
 * - Total words studied
 * - Last practice date
 * - Current streak counter
 * - Today's practice status
 * 
 * Data Source: localStorage
 */

import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  totalWords: number = 0;
  lastPracticeDate: string = '';
  currentStreak: number = 0;
  practicedToday: boolean = false;

  ngOnInit(): void {
    this.loadStats();
  }

  /**
   * Load statistics from localStorage
   * - learnedWords: Array of learned words
   * - lastPracticeDate: Date string of last practice
   * - streak: Current daily streak count
   */
  loadStats(): void {
    const storedWords = localStorage.getItem('learnedWords');
    const storedDate = localStorage.getItem('lastPracticeDate');
    const storedStreak = localStorage.getItem('streak');

    if (storedWords) {
      this.totalWords = JSON.parse(storedWords).length;
    }

    if (storedDate) {
      this.lastPracticeDate = storedDate;
    }

    if (storedStreak) {
      this.currentStreak = Number(storedStreak);
    }

    // Check if user practiced today
    const today = new Date().toDateString();
    this.practicedToday = storedDate === today;
  }
}