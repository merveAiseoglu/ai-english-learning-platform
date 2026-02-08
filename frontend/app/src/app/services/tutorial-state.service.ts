/**
 * Tutorial State Service
 * Manages the current state of grammar tutorial navigation
 * Tracks current level and topic progression
 */

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TutorialStateService {
  private currentLevel = 'A1';
  private currentTopicIndex = 0;

  /**
   * Get current grammar level
   */
  getCurrentLevel(): string {
    return this.currentLevel;
  }

  /**
   * Set current grammar level
   */
  setCurrentLevel(level: string): void {
    this.currentLevel = level;
  }

  /**
   * Get current topic index
   */
  getCurrentTopicIndex(): number {
    return this.currentTopicIndex;
  }

  /**
   * Advance to next topic
   */
  advanceTopic(): void {
    this.currentTopicIndex += 1;
  }

  /**
   * Reset tutorial state to beginning
   */
  reset(): void {
    this.currentTopicIndex = 0;
    this.currentLevel = 'A1';
  }
}