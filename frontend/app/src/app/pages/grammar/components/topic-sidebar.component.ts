/**
 * Topic Sidebar Component
 * Displays grammar levels and topics in a navigable sidebar
 * 
 * Features:
 * - Hierarchical display: levels → topics
 * - Click to select level/topic
 * - Visual indication of selected items
 * - Locked topics support
 */

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GrammarLevel, GrammarTopic, GrammarProgress } from '../../../shared/models/grammar.models';

/**
 * Extended GrammarLevel with topics array
 * Used for sidebar display
 */
interface GrammarLevelWithTopics extends GrammarLevel {
  topics: GrammarTopic[];
}

@Component({
  selector: 'app-topic-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="topic-sidebar">
      <h3>Levels</h3>
      <div *ngFor="let level of levels" class="level-section">
        <h4 
          (click)="selectLevel(level)" 
          [class.selected]="level.id === selectedLevel?.id"
          class="level-title"
        >
          {{ level.name }}{{ level.description ? ' - ' + level.description : '' }}
        </h4>
        <ul *ngIf="level.id === selectedLevel?.id">
          <li 
            *ngFor="let topic of level.topics" 
            (click)="selectTopic($event, topic)" 
            [class.selected]="topic.id === selectedTopic?.id"
            [class.locked]="topic.isLocked"
            class="topic-item"
          >
            {{ topic.title }}
          </li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .topic-sidebar { 
      padding: 1rem; 
      background: #f5f5f5; 
      height: 100%;
      overflow-y: auto;
    }

    .level-title { 
      cursor: pointer; 
      padding: 0.5rem; 
      margin: 0;
      border-radius: 4px;
      transition: background-color 0.2s;
    }

    .level-title:hover {
      background: #e0e0e0;
    }

    .level-title.selected { 
      background: #007bff; 
      color: white; 
    }

    ul { 
      list-style: none; 
      padding: 0; 
      margin-left: 1rem; 
    }

    .topic-item { 
      cursor: pointer; 
      padding: 0.5rem;
      border-radius: 4px;
      transition: background-color 0.2s;
    }

    .topic-item:hover:not(.locked) {
      background: #f0f0f0;
    }

    .topic-item.selected { 
      font-weight: bold; 
      background: #e3f2fd; 
    }

    .topic-item.locked { 
      color: gray; 
      cursor: not-allowed;
      opacity: 0.6;
    }

    .level-section {
      margin-bottom: 1rem;
    }
  `]
})
export class TopicSidebarComponent {
  @Input() levels: GrammarLevelWithTopics[] = [];
  @Input() selectedLevel: GrammarLevelWithTopics | null = null;
  @Input() selectedTopic: GrammarTopic | null = null;
  @Input() grammarProgress: GrammarProgress | null = null;

  @Output() levelSelect = new EventEmitter<GrammarLevelWithTopics>();
  @Output() topicSelect = new EventEmitter<GrammarTopic>();

  /** Handle level selection */
  selectLevel(level: GrammarLevelWithTopics): void {
    this.levelSelect.emit(level);
  }

  /** Handle topic selection - ignore if locked */
  selectTopic(event: MouseEvent, topic: GrammarTopic): void {
    event.stopPropagation();
    if (!topic.isLocked) {
      this.topicSelect.emit(topic);
    }
  }
}