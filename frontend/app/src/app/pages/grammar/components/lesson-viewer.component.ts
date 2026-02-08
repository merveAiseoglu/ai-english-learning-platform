import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common'; 
export interface Lesson {
  id: string;
  title: string;
  content: string;
  examples: string[];
  keyPoints: string[];
  topicId: string;
}

@Component({
  selector: 'app-lesson-viewer',
  imports: [CommonModule],
  template: `
    <div class="lesson-viewer" *ngIf="lesson">
      <div class="lesson-header">
        <h2>{{ lesson.title }}</h2>
        <button class="close-btn" (click)="closeLesson()">×</button>
      </div>
      
      <div class="lesson-content">
        <div class="content-section">
          <h3>Ders İçeriği</h3>
          <div class="lesson-text" [innerHTML]="lesson.content"></div>
        </div>
        
        <div class="examples-section" *ngIf="lesson.examples.length > 0">
          <h3>Örnekler</h3>
          <div class="examples-list">
            <div *ngFor="let example of lesson.examples" class="example-item">
              {{ example }}
            </div>
          </div>
        </div>
        
        <div class="key-points-section" *ngIf="lesson.keyPoints.length > 0">
          <h3>Önemli Noktalar</h3>
          <ul class="key-points-list">
            <li *ngFor="let point of lesson.keyPoints">{{ point }}</li>
          </ul>
        </div>
      </div>
      
      <div class="lesson-actions">
        <button class="btn btn-secondary" (click)="previousLesson()" [disabled]="!hasPrevious">
          ← Önceki Ders
        </button>
        <button class="btn btn-primary" (click)="startExercise()">
          Alıştırmaya Başla
        </button>
        <button class="btn btn-secondary" (click)="nextLesson()" [disabled]="!hasNext">
          Sonraki Ders →
        </button>
      </div>
    </div>
  `,
  styles: [`
    .lesson-viewer {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    .lesson-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #f0f0f0;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    
    .lesson-header h2 {
      margin: 0;
      color: #333;
    }
    
    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      padding: 5px 10px;
      border-radius: 4px;
      color: #666;
    }
    
    .close-btn:hover {
      background: #f0f0f0;
      color: #333;
    }
    
    .lesson-content {
      margin-bottom: 30px;
    }
    
    .content-section,
    .examples-section,
    .key-points-section {
      margin-bottom: 25px;
    }
    
    .content-section h3,
    .examples-section h3,
    .key-points-section h3 {
      color: #007bff;
      margin-bottom: 15px;
      font-size: 18px;
    }
    
    .lesson-text {
      line-height: 1.6;
      color: #333;
      font-size: 16px;
    }
    
    .examples-list {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 6px;
      border-left: 4px solid #007bff;
    }
    
    .example-item {
      margin-bottom: 10px;
      font-style: italic;
      color: #555;
    }
    
    .example-item:last-child {
      margin-bottom: 0;
    }
    
    .key-points-list {
      background: #fff3cd;
      padding: 15px 15px 15px 35px;
      border-radius: 6px;
      border-left: 4px solid #ffc107;
    }
    
    .key-points-list li {
      margin-bottom: 8px;
      color: #856404;
    }
    
    .lesson-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
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
    
    .btn-secondary:hover:not(:disabled) {
      background: #545b62;
    }
  `]
})
export class LessonViewerComponent {
  @Input() lesson: Lesson | null = null;
  @Input() hasPrevious: boolean = false;
  @Input() hasNext: boolean = false;
  
  @Output() lessonClosed = new EventEmitter<void>();
  @Output() exerciseStarted = new EventEmitter<Lesson>();
  @Output() previousLessonRequested = new EventEmitter<void>();
  @Output() nextLessonRequested = new EventEmitter<void>();
  
  closeLesson(): void {
    this.lessonClosed.emit();
  }
  
  startExercise(): void {
    if (this.lesson) {
      this.exerciseStarted.emit(this.lesson);
    }
  }
  
  previousLesson(): void {
    this.previousLessonRequested.emit();
  }
  
  nextLesson(): void {
    this.nextLessonRequested.emit();
  }
}