/**
 * Review Component
 * Practice unknown/difficult words with flashcards and quiz
 * 
 * Features:
 * - Flashcard view with flip animation
 * - Multiple choice quiz
 * - Track correct/incorrect answers
 * - Score tracking
 * - Mark words as known/unknown
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { VocabularyService } from '../../services/vocabulary.service';
import { Word } from '../../shared/interfaces';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-review',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './review.html',
  styleUrls: ['./review.css']
})
export class Review implements OnInit, OnDestroy {
  questions: Word[] = [];
  unknownWords: Word[] = [];
  currentIndex = 0;
  showBack = false;
  isFlipped = false;
  selectedOption: string | null = null;
  showAnswer = false;
  score = 0;
  quizFinished = false;

  options: string[] = [];

  private destroy$ = new Subject<void>();

  constructor(private vocabularyService: VocabularyService) {}

  ngOnInit(): void {
    this.vocabularyService.unknownWords$
      .pipe(takeUntil(this.destroy$))
      .subscribe(words => {
        this.questions = [...words];
        this.unknownWords = [...words];
        this.currentIndex = 0;
        this.selectedOption = null;
        this.showAnswer = false;
        this.score = 0;
        this.quizFinished = false;
        this.showBack = false;
        this.generateOptions();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Get current question word */
  get currentQuestion(): Word | undefined {
    return this.questions[this.currentIndex];
  }

  /** Get current word (alias for backward compatibility) */
  get currentWord(): Word {
    return this.currentQuestion;
  }

  /** Generate 3 multiple choice options (1 correct + 2 random) */
  generateOptions(): void {
    if (this.questions.length === 0) {
      this.options = [];
      return;
    }
    
    const correct = this.currentQuestion.meaning_tr;
    const others = this.questions
      .filter((_, i) => i !== this.currentIndex)
      .map(w => w.meaning_tr)
      .sort(() => 0.5 - Math.random())
      .slice(0, 2);

    this.options = [correct, ...others].sort(() => 0.5 - Math.random());
  }

  /** Handle option selection */
  selectOption(option: string): void {
    if (this.showAnswer) return;

    this.selectedOption = option;
    this.showAnswer = true;

    if (option === this.currentQuestion.meaning_tr) {
      this.score++;
    }
  }

  /** Move to next question */
  nextQuestion(): void {
    this.selectedOption = null;
    this.showAnswer = false;

    if (this.currentIndex < this.questions.length - 1) {
      this.currentIndex++;
      this.generateOptions();
    } else {
      this.quizFinished = true;
    }
  }

  /** Restart quiz from beginning */
  restartQuiz(): void {
    this.currentIndex = 0;
    this.score = 0;
    this.quizFinished = false;
    this.selectedOption = null;
    this.showAnswer = false;
    this.generateOptions();
  }

  /** Flip flashcard to show back */
  flipCard(): void {
    this.showBack = !this.showBack;
  }

  /** Mark current word as known and remove from review list */
  markKnown(): void {
    const currentWord = this.currentQuestion;
    this.vocabularyService.updateWordLevel(currentWord, true);
    this.vocabularyService.removeUnknownWord(currentWord);
    this.nextQuestion();
  }

  /** Mark current word as unknown and keep in review list */
  markUnknown(): void {
    const currentWord = this.currentQuestion;
    this.vocabularyService.updateWordLevel(currentWord, false);
    this.vocabularyService.addToUnknownWords(currentWord);
    this.nextQuestion();
  }
}