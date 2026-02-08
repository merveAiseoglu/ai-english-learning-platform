// level-selector.component.ts
import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { GrammarTopic, GrammarLevel } from '../../../shared/models/grammar.models';
import { GrammarService } from '../../../services/grammar.service';
import { CommonModule } from '@angular/common';



@Component({
  selector: 'app-level-selector',
   imports: [CommonModule],
    standalone: true,
  templateUrl: './level-selector.component.html',
  styleUrls: ['./level-selector.component.css']
})
export class LevelSelectorComponent implements OnInit {
  @Output() levelSelected = new EventEmitter<string>();
  
  levels: GrammarLevel[] = [];
  selectedLevelId: string | null = null;
  loading = true;

  constructor(private grammarService: GrammarService) {}

  ngOnInit(): void {
    this.loadLevels();
  }

  private loadLevels(): void {
    this.grammarService.getLevels().subscribe({
      next: (levels) => {
        this.levels = levels;
        this.loading = false;
      },
      error: (error) => {
        console.error('Seviyeler yüklenirken hata:', error);
        this.loading = false;
      }
    });
  }

  selectLevel(levelId: string): void {
    this.selectedLevelId = levelId;
    this.levelSelected.emit(levelId);
  }

  isSelected(levelId: string): boolean {
    return this.selectedLevelId === levelId;
  }
  
}