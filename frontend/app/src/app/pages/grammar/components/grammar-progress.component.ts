import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
export interface ProgressData {
  totalTopics: number;
  completedTopics: number;
  totalLessons: number;
  completedLessons: number;
  totalExercises: number;
  completedExercises: number;
  averageScore: number;
  timeSpent: number; // in minutes
  streakDays: number;
  level: 'beginner' | 'intermediate' | 'advanced';
}

export interface TopicProgress {
  topicId: string;
  topicName: string;
  progress: number; // 0-100
  lessonsCompleted: number;
  totalLessons: number;
  averageScore: number;
}

@Component({
  selector: 'app-grammar-progress',
  imports: [CommonModule],
  template: `
    <div class="progress-container">
      <div class="progress-header">
        <h3>İlerleme Durumu</h3>
        <div class="level-indicator">
          <span class="current-level">{{ getLevelText(progressData?.level) }}</span>
        </div>
      </div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number">{{ progressData?.completedTopics || 0 }}</div>
          <div class="stat-label">Tamamlanan Konu</div>
          <div class="stat-total">/ {{ progressData?.totalTopics || 0 }}</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-number">{{ progressData?.completedLessons || 0 }}</div>
          <div class="stat-label">Tamamlanan Ders</div>
          <div class="stat-total">/ {{ progressData?.totalLessons || 0 }}</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-number">{{ progressData?.averageScore || 0 }}%</div>
          <div class="stat-label">Ortalama Puan</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-number">{{ progressData?.streakDays || 0 }}</div>
          <div class="stat-label">Gün Serisi</div>
        </div>
      </div>
      
      <div class="overall-progress">
        <div class="progress-section">
          <div class="progress-header-small">
            <span>Genel İlerleme</span>
            <span>{{ getOverallProgressPercentage() }}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" [style.width.%]="getOverallProgressPercentage()"></div>
          </div>
        </div>
      </div>
      
      <div class="topics-progress" *ngIf="topicsProgress && topicsProgress.length > 0">
        <h4>Konu Bazlı İlerleme</h4>
        <div class="topic-progress-list">
          <div *ngFor="let topic of topicsProgress" class="topic-progress-item">
            <div class="topic-info">
              <span class="topic-name">{{ topic.topicName }}</span>
              <span class="topic-stats">
                {{ topic.lessonsCompleted }}/{{ topic.totalLessons }} ders
                <span *ngIf="topic.averageScore > 0" class="topic-score">
                  ({{ topic.averageScore }}%)
                </span>
              </span>
            </div>
            <div class="topic-progress-bar">
              <div class="topic-progress-fill" [style.width.%]="topic.progress"></div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="achievements" *ngIf="getAchievements().length > 0">
        <h4>Başarılar</h4>
        <div class="achievements-list">
          <div *ngFor="let achievement of getAchievements()" class="achievement-item">
            <span class="achievement-icon">{{ achievement.icon }}</span>
            <span class="achievement-text">{{ achievement.text }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .progress-container {
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
    }
    
    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 25px;
    }
    
    .progress-header h3 {
      margin: 0;
      color: #333;
    }
    
    .level-indicator {
      padding: 8px 16px;
      background: #007bff;
      color: white;
      border-radius: 20px;
      font-weight: 500;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      margin-bottom: 25px;
    }
    
    .stat-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .stat-number {
      font-size: 28px;
      font-weight: bold;
      color: #007bff;
      margin-bottom: 5px;
    }
    
    .stat-label {
      font-size: 14px;
      color: #666;
      margin-bottom: 3px;
    }
    
    .stat-total {
      font-size: 12px;
      color: #999;
    }
    
    .overall-progress {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 25px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .progress-section {
      margin-bottom: 15px;
    }
    
    .progress-header-small {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-weight: 500;
      color: #333;
    }
    
    .progress-bar {
      width: 100%;
      height: 12px;
      background: #e9ecef;
      border-radius: 6px;
      overflow: hidden;
    }
    
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #007bff, #0056b3);
      transition: width 0.5s ease;
      border-radius: 6px;
    }
    
    .topics-progress {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 25px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .topics-progress h4 {
      margin: 0 0 15px 0;
      color: #333;
    }
    
    .topic-progress-item {
      margin-bottom: 15px;
    }
    
    .topic-progress-item:last-child {
      margin-bottom: 0;
    }
    
    .topic-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 5px;
    }
    
    .topic-name {
      font-weight: 500;
      color: #333;
    }
    
    .topic-stats {
      font-size: 14px;
      color: #666;
    }
    
    .topic-score {
      color: #28a745;
      font-weight: 500;
    }
    
    .topic-progress-bar {
      width: 100%;
      height: 8px;
      background: #e9ecef;
      border-radius: 4px;
      overflow: hidden;
    }
    
    .topic-progress-fill {
      height: 100%;
      background: #28a745;
      transition: width 0.3s ease;
      border-radius: 4px;
    }
    
    .achievements {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .achievements h4 {
      margin: 0 0 15px 0;
      color: #333;
    }
    
    .achievements-list {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    
    .achievement-item {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      border-radius: 20px;
      font-size: 14px;
      color: #856404;
    }
    
    .achievement-icon {
      margin-right: 6px;
      font-size: 16px;
    }
  `]
})
export class GrammarProgressComponent {
  @Input() progressData: ProgressData | null = null;
  @Input() topicsProgress: TopicProgress[] = [];
  
  getLevelText(level: string | undefined): string {
    switch(level) {
      case 'beginner': return 'Başlangıç';
      case 'intermediate': return 'Orta';
      case 'advanced': return 'İleri';
      default: return 'Başlangıç';
    }
  }
  
  getOverallProgressPercentage(): number {
    if (!this.progressData) return 0;
    
    const topicProgress = this.progressData.totalTopics > 0 
      ? (this.progressData.completedTopics / this.progressData.totalTopics) * 100 
      : 0;
    
    const lessonProgress = this.progressData.totalLessons > 0 
      ? (this.progressData.completedLessons / this.progressData.totalLessons) * 100 
      : 0;
    
    return Math.round((topicProgress + lessonProgress) / 2);
  }
  
  getAchievements(): Array<{icon: string, text: string}> {
    const achievements = [];
    
    if (this.progressData) {
      if (this.progressData.completedTopics >= 1) {
        achievements.push({icon: '🎯', text: 'İlk konuyu tamamladın!'});
      }
      
      if (this.progressData.completedTopics >= 5) {
        achievements.push({icon: '🏆', text: '5 konu tamamlandı!'});
      }
      
      if (this.progressData.averageScore >= 80) {
        achievements.push({icon: '⭐', text: 'Yüksek başarı!'});
      }
      
      if (this.progressData.streakDays >= 7) {
        achievements.push({icon: '🔥', text: '7 gün üst üste!'});
      }
      
      if (this.progressData.completedLessons >= 10) {
        achievements.push({icon: '📚', text: '10 ders tamamlandı!'});
      }
    }
    
    return achievements;
  }
}