/**
 * Level Select Component
 * Simple dropdown for selecting language proficiency level
 */

import { Component, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-level-select',
  standalone: true,
  imports: [FormsModule],
  template: `
    <h2>Lütfen Seviyenizi Seçin</h2>
    <select [(ngModel)]="selectedLevel">
      <option value="" disabled>Seviye Seçiniz</option>
      <option value="A1">A1</option>
      <option value="A2">A2</option>
      <option value="B1">B1</option>
      <option value="B2">B2</option>
    </select>
    <button [disabled]="!selectedLevel" (click)="start()">Başla</button>
  `,
})
export class LevelSelectComponent {
  selectedLevel: string = '';
  @Output() levelChosen = new EventEmitter<string>();

  start(): void {
    this.levelChosen.emit(this.selectedLevel);
  }
}