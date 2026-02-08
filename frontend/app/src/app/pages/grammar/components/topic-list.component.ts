// topic-list.component.ts
import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { GrammarTopic, GrammarLevel } from '../../../shared/models/grammar.models';
import { GrammarService } from '../../../services/grammar.service';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-topic-list',
   standalone: true,
  templateUrl: './topic-list.component.html',
  imports: [CommonModule], 
  styleUrls: ['./topic-list.component.css']
})
export class TopicListComponent implements OnChanges {
  @Input() selectedLevelId: string | null = null;
  @Output() topicSelected = new EventEmitter<string>();

  topics: GrammarTopic[] = [];
  selectedLevel: GrammarLevel | null = null;
  selectedTopicId: string | null = null;
  loading = false;

  constructor(private grammarService: GrammarService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedLevelId'] && this.selectedLevelId) {
      this.loadTopics();
      this.loadLevelInfo();
      this.selectedTopicId = null; // Reset topic selection
    }
  }

  private loadTopics(): void {
    if (!this.selectedLevelId) return;
    
    this.loading = true;
    this.grammarService.getTopicsByLevel(this.selectedLevelId).subscribe({
      next: (topics) => {
        this.topics = topics;
        this.loading = false;
      },
      error: (error) => {
        console.error('Konular yüklenirken hata:', error);
        this.loading = false;
      }
    });
  }

  private loadLevelInfo(): void {
    if (!this.selectedLevelId) return;
    
    this.grammarService.getLevelById(this.selectedLevelId).subscribe({
      next: (level) => {
        this.selectedLevel = level;
      },
      error: (error) => {
        console.error('Seviye bilgisi yüklenirken hata:', error);
      }
    });
  }

  selectTopic(topicId: string): void {
    this.selectedTopicId = topicId;
    this.topicSelected.emit(topicId);
  }

  isSelected(topicId: string): boolean {
    return this.selectedTopicId === topicId;
  }

  formatTime(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} dk`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}s ${mins}dk` : `${hours}s`;
  }
}