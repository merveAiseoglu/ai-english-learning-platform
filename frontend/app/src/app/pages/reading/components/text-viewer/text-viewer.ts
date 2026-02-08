/**
 * Text Viewer Component
 * Interactive text display with clickable words for translations
 * 
 * Features:
 * - Click any word to see Turkish translation
 * - Dictionary integration with OpenAI
 * - Popup display for word meanings
 */

import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ReadingText } from '../../services/reading.service';
import { DictionaryService } from '../../../../shared/services/dictionary.service';

@Component({
  selector: 'app-text-viewer',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './text-viewer.html',
  styleUrls: ['./text-viewer.css'],
})
export class TextViewerComponent implements OnInit {
  @Input() texts: ReadingText[] = [];
  selectedWord: string = '';
  wordMeanings: string[] = [];
  showMeanings: boolean = false;
  clickPosition = { x: 0, y: 0 };
  isLoading: boolean = false;

  constructor(
    private dictionaryService: DictionaryService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {}

  /** Process text to make words clickable */
  processTextForClickableWords(content: string): SafeHtml {
    // Split text into words and wrap each in clickable span
    const words = content.split(/(\s+|[^\w\s]+)/);
    
    const processedText = words.map(word => {
      // Only make letter-only words clickable
      if (/^[a-zA-Z]+$/.test(word.trim())) {
        return `<span class="clickable-word" data-word="${word.toLowerCase()}">${word}</span>`;
      }
      return word;
    }).join('');

    return this.sanitizer.bypassSecurityTrustHtml(processedText);
  }

  /** Handle word click event */
  onTextClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    console.log('Clicked element:', target);
    console.log('Class list:', target.classList);
    
    if (target.classList.contains('clickable-word')) {
      event.preventDefault();
      
      const word = target.getAttribute('data-word');
      console.log('Selected word:', word);
      
      if (word) {
        this.selectedWord = word;
        this.clickPosition = { x: event.clientX, y: event.clientY };
        
        // Show loading state
        this.isLoading = true;
        this.showMeanings = true;
        this.wordMeanings = [];

        // Fetch translation from API
        this.dictionaryService.translateAsync(word).subscribe({
          next: (meanings) => {
            console.log('Found meanings:', meanings);
            this.wordMeanings = meanings;
            this.isLoading = false;
            
            if (meanings.length === 0) {
              this.wordMeanings = [`Translation for "${word}" not found`];
            }
          },
          error: (error) => {
            console.error('Translation error:', error);
            this.wordMeanings = [`Could not fetch translation for "${word}"`];
            this.isLoading = false;
          }
        });

        console.log('Popup position:', this.clickPosition);
      }
    } else {
      // Close popup if clicked elsewhere
      this.showMeanings = false;
    }
  }

  /** Close meanings popup */
  closeMeanings(): void {
    this.showMeanings = false;
    this.isLoading = false;
  }
}