/**
 * Grammar Tutorial Component
 * Main grammar learning interface with levels, topics, and exercises
 */

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LevelSelectorComponent } from './components/level-selector.component';
import { TopicListComponent } from './components/topic-list.component';
import { TopicDetailComponent } from './components/topic-detail.component';

@Component({
  selector: 'app-grammar-tutorial',
  standalone: true,
  imports: [
    CommonModule,
    LevelSelectorComponent,
    TopicListComponent,
    TopicDetailComponent
  ],
  templateUrl: './grammar-tutorial.html',
  styleUrls: ['./grammar-tutorial.css']
})
export class GrammarTutorialComponent {
  selectedLevelId: string | null = null;
  selectedTopicId: string | null = null;

  onLevelSelected(levelId: string): void {
    this.selectedLevelId = levelId;
    this.selectedTopicId = null;
  }

  onTopicSelected(topicId: string): void {
    this.selectedTopicId = topicId;
  }

  resetToLevelSelection(): void {
    this.selectedLevelId = null;
    this.selectedTopicId = null;
  }

  resetToTopicSelection(): void {
    this.selectedTopicId = null;
  }
}