import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
export interface Exercise {
  id: string;
  type: 'multiple-choice' | 'fill-blank' | 'true-false' | 'matching';
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  lessonId: string;
}

export interface ExerciseResult {
  exerciseId: string;
  userAnswer: string | string[];
  isCorrect: boolean;
  timeSpent: number;
}

@Component({
  selector: 'app-exercise-container',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="exercise-container" *ngIf="currentExercise">
      <div class="exercise-header">
        <h3>Alıştırma {{ currentIndex + 1 }} / {{ exercises.length }}</h3>
        <div class="progress-bar">
          <div class="progress-fill" [style.width.%]="progressPercentage"></div>
        </div>
      </div>
      
      <div class="exercise-content">
        <div class="question-section">
          <h4>{{ currentExercise.question }}</h4>
        </div>
        
        <!-- Multiple Choice -->
        <div *ngIf="currentExercise.type === 'multiple-choice'" class="options-section">
          <div *ngFor="let option of currentExercise.options; let i = index" 
               class="option-item"
               [class.selected]="selectedAnswer === option"
               (click)="selectAnswer(option)">
            <span class="option-letter">{{ getOptionLetter(i) }}</span>
            <span class="option-text">{{ option }}</span>
          </div>
        </div>
        
        <!-- Fill in the Blank -->
        <div *ngIf="currentExercise.type === 'fill-blank'" class="input-section">
          <input type="text" 
                 class="answer-input"
                 [(ngModel)]="userInput"
                 placeholder="Cevabınızı yazın...">
        </div>
        
        <!-- True/False -->
        <div *ngIf="currentExercise.type === 'true-false'" class="true-false-section">
          <button class="tf-btn" 
                  [class.selected]="selectedAnswer === 'true'"
                  (click)="selectAnswer('true')">
            Doğru
          </button>
          <button class="tf-btn" 
                  [class.selected]="selectedAnswer === 'false'"
                  (click)="selectAnswer('false')">
            Yanlış
          </button>
        </div>
        
        <!-- Result Display -->
        <div *ngIf="showResult" class="result-section">
          <div class="result-message" [class.correct]="isLastAnswerCorrect" [class.incorrect]="!isLastAnswerCorrect">
            <span class="result-icon">{{ isLastAnswerCorrect ? '✓' : '✗' }}</span>
            <span class="result-text">
              {{ isLastAnswerCorrect ? 'Doğru!' : 'Yanlış!' }}
            </span>
          </div>
          <div class="explanation">
            <strong>Açıklama:</strong> {{ currentExercise.explanation }}
          </div>
        </div>
      </div>
      
      <div class="exercise-actions">
        <button class="btn btn-secondary" (click)="goBack()">
          ← Geri Dön
        </button>
        <button *ngIf="!showResult" 
                class="btn btn-primary" 
                [disabled]="!hasAnswer"
                (click)="checkAnswer()">
          Kontrol Et
        </button>
        <button *ngIf="showResult && hasNextExercise" 
                class="btn btn-primary"
                (click)="nextExercise()">
          Sonraki Soru →
        </button>
        <button *ngIf="showResult && !hasNextExercise" 
                class="btn btn-success"
                (click)="finishExercises()">
          Bitir
        </button>
      </div>
    </div>
  `,
  styles: [`
    .exercise-container {
      max-width: 700px;
      margin: 0 auto;
      padding: 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    .exercise-header {
      margin-bottom: 25px;
    }
    
    .exercise-header h3 {
      margin: 0 0 10px 0;
      color: #333;
    }
    
    .progress-bar {
      width: 100%;
      height: 8px;
      background: #e9ecef;
      border-radius: 4px;
      overflow: hidden;
    }
    
    .progress-fill {
      height: 100%;
      background: #007bff;
      transition: width 0.3s ease;
    }
    
    .question-section h4 {
      margin-bottom: 20px;
      color: #333;
      font-size: 18px;
      line-height: 1.5;
    }
    
    .options-section {
      margin-bottom: 20px;
    }
    
    .option-item {
      display: flex;
      align-items: center;
      padding: 12px 15px;
      margin-bottom: 10px;
      border: 2px solid #e9ecef;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .option-item:hover {
      border-color: #007bff;
      background: #f8f9ff;
    }
    
    .option-item.selected {
      border-color: #007bff;
      background: #e3f2fd;
    }
    
    .option-letter {
      width: 25px;
      height: 25px;
      border-radius: 50%;
      background: #6c757d;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      margin-right: 12px;
      font-size: 14px;
    }
    
    .option-item.selected .option-letter {
      background: #007bff;
    }
    
    .input-section {
      margin-bottom: 20px;
    }
    
    .answer-input {
      width: 100%;
      padding: 12px;
      border: 2px solid #e9ecef;
      border-radius: 6px;
      font-size: 16px;
    }
    
    .answer-input:focus {
      outline: none;
      border-color: #007bff;
    }
    
    .true-false-section {
      display: flex;
      gap: 15px;
      margin-bottom: 20px;
    }
    
    .tf-btn {
      flex: 1;
      padding: 15px;
      border: 2px solid #e9ecef;
      border-radius: 6px;
      background: white;
      cursor: pointer;
      font-size: 16px;
      font-weight: 500;
      transition: all 0.3s ease;
    }
    
    .tf-btn:hover {
      border-color: #007bff;
      background: #f8f9ff;
    }
    
    .tf-btn.selected {
      border-color: #007bff;
      background: #007bff;
      color: white;
    }
    
    .result-section {
      margin: 20px 0;
      padding: 15px;
      border-radius: 6px;
    }
    
    .result-message {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
      font-weight: bold;
      font-size: 18px;
    }
    
    .result-message.correct {
      color: #28a745;
    }
    
    .result-message.incorrect {
      color: #dc3545;
    }
    
    .result-icon {
      margin-right: 8px;
      font-size: 20px;
    }
    
    .explanation {
      color: #666;
      line-height: 1.5;
    }
    
    .exercise-actions {
      display: flex;
      justify-content: space-between;
      padding-top: 20px;
      border-top: 1px solid #e9ecef;
    }
    
    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.3s ease;
    }
    
    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .btn-primary {
      background: #007bff;
      color: white;
    }
    
    .btn-primary:hover:not(:disabled) {
      background: #0056b3;
    }
    
    .btn-secondary {
      background: #6c757d;
      color: white;
    }
    
    .btn-secondary:hover {
      background: #545b62;
    }
    
    .btn-success {
      background: #28a745;
      color: white;
    }
    
    .btn-success:hover {
      background: #218838;
    }
  `]
})
export class ExerciseContainerComponent {
  @Input() exercises: Exercise[] = [];
  @Input() lessonId: string = '';

  @Output() exerciseCompleted = new EventEmitter<ExerciseResult[]>();
  @Output() exerciseClosed = new EventEmitter<void>();

  currentIndex: number = 0;
  selectedAnswer: string = '';
  userInput: string = '';
  showResult: boolean = false;
  isLastAnswerCorrect: boolean = false;
  results: ExerciseResult[] = [];
  startTime: number = Date.now();

  get currentExercise(): Exercise | null {
    return this.exercises[this.currentIndex] || null;
  }

  get hasNextExercise(): boolean {
    return this.currentIndex < this.exercises.length - 1;
  }

  get hasAnswer(): boolean {
    if (this.currentExercise?.type === 'fill-blank') {
      return this.userInput.trim().length > 0;
    }
    return this.selectedAnswer.length > 0;
  }

  get progressPercentage(): number {
    return ((this.currentIndex + 1) / this.exercises.length) * 100;
  }

  selectAnswer(answer: string): void {
    this.selectedAnswer = answer;
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index); // A, B, C, D...
  }

  checkAnswer(): void {
    const currentAnswer = this.getCurrentAnswer();
    const correct = this.isAnswerCorrect(currentAnswer);

    this.isLastAnswerCorrect = correct;
    this.showResult = true;

    const result: ExerciseResult = {
      exerciseId: this.currentExercise!.id,
      userAnswer: currentAnswer,
      isCorrect: correct,
      timeSpent: Date.now() - this.startTime
    };

    this.results.push(result);
  }

  getCurrentAnswer(): string {
    if (this.currentExercise?.type === 'fill-blank') {
      return this.userInput.trim();
    }
    return this.selectedAnswer;
  }

  isAnswerCorrect(userAnswer: string): boolean {
    const correctAnswer = this.currentExercise?.correctAnswer;
    if (Array.isArray(correctAnswer)) {
      return correctAnswer.includes(userAnswer.toLowerCase());
    }
    return userAnswer.toLowerCase() === correctAnswer?.toLowerCase();
  }

  nextExercise(): void {
    this.currentIndex++;
    this.resetAnswerState();
  }

  resetAnswerState(): void {
    this.selectedAnswer = '';
    this.userInput = '';
    this.showResult = false;
    this.startTime = Date.now();
  }

  finishExercises(): void {
    this.exerciseCompleted.emit(this.results);
  }

  goBack(): void {
    this.exerciseClosed.emit();
  }
}