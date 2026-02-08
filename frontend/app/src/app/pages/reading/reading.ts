/**
 * Reading Page Component
 * Reading comprehension with level selection and questions
 * 
 * Features:
 * - Level-based text selection (A1, A2, B1, B2)
 * - Interactive text viewer with word translations
 * - Comprehension questions with scoring
 */

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReadingService, ReadingText } from './services/reading.service';
import { LevelSelectComponent } from './components/level-select/level-select';
import { TextViewerComponent } from './components/text-viewer/text-viewer';

@Component({
  selector: 'app-reading',
  standalone: true,
  imports: [CommonModule, LevelSelectComponent, TextViewerComponent],
  templateUrl: './reading.html',
  styleUrls: ['./reading.css'],
})
export class ReadingPage implements OnInit {
  // Text data
  allTexts: ReadingText[] = [];
  filteredTexts: ReadingText[] = [];
  selectedLevel: string = '';
  showLevelSelect: boolean = true;

  // Current reading session
  currentText: ReadingText | null = null;
  currentQuestions: any[] = [];
  showQuestions = false;
  selectedAnswers: string[] = [];
  checked = false;
  totalScore = 0;

  constructor(private readingService: ReadingService) {}

  ngOnInit(): void {
    this.loadTexts();
  }

  /** Load all reading texts from JSON */
  loadTexts(): void {
    this.readingService.getTexts().subscribe({
      next: (texts) => {
        this.allTexts = texts;
      },
      error: (error) => {
        console.error('Error loading texts:', error);
      }
    });
  }

  /** Handle level selection */
  onLevelChosen(level: string): void {
    this.selectedLevel = level;
    this.filteredTexts = this.allTexts.filter(text => text.level === level);
    this.showLevelSelect = false;

    // Show first text from selected level
    if (this.filteredTexts.length > 0) {
      this.loadTextAndQuestions(this.filteredTexts[0].id);
    }
  }

  /** Reset to level selection screen */
  resetLevelSelection(): void {
    this.showLevelSelect = true;
    this.selectedLevel = '';
    this.filteredTexts = [];
    this.currentText = null;
    this.showQuestions = false;
    this.checked = false;
  }

  /** Load text and associated questions */
  loadTextAndQuestions(textId: number): void {
    this.currentText = this.filteredTexts.find(t => t.id === textId) || null;

    // Load questions from JSON (should be from service in production)
    import('../../../assets/reading-questions.json').then(module => {
      const questions = module.default as any[];
      const questionBlock = questions.find(q => q.textId === textId);
      this.currentQuestions = questionBlock ? this.shuffleArray(questionBlock.questions) : [];
      this.selectedAnswers = [];
      this.checked = false;
      this.totalScore = 0;
      this.showQuestions = false;
    }).catch(error => {
      console.log('Could not load questions:', error);
      this.currentQuestions = [];
    });
  }

  /** Shuffle array (for randomizing questions) */
  shuffleArray(arr: any[]): any[] {
    return arr.sort(() => Math.random() - 0.5);
  }

  /** Handle answer selection */
  selectAnswer(questionIndex: number, selected: string): void {
    this.selectedAnswers[questionIndex] = selected;
  }

  /** Check all answers and calculate score */
  checkAnswers(): void {
    let score = 0;
    this.currentQuestions.forEach((q, i) => {
      if (this.selectedAnswers[i] === q.correctAnswer) score++;
    });
    this.checked = true;
    this.totalScore = score;
  }
}