/**
 * Text Viewer Component
 * Displays text with interactive word lookup
 * 
 * Features:
 * - Split text into clickable words
 * - Click a word to show its meaning from local dictionary
 * - Popup display for word meanings
 * 
 * Data Source: assets/dictionary.json
 */

import { Component, Input, OnInit, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

/** Single dictionary entry structure */
interface DictionaryEntry {
  word: string;
  meaning: string;
}

@Component({
  selector: 'app-text-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './text-viewer.html',
  styleUrls: ['./text-viewer.css'],
})
export class TextViewer implements OnInit {
  /** The full text to be displayed as clickable words */
  @Input() text: string = '';

  /** Local dictionary loaded from assets */
  dictionary: DictionaryEntry[] = [];

  /** Currently selected word (signal for reactivity) */
  selectedWord: WritableSignal<string | null> = signal(null);

  /** Meaning of the selected word (signal for reactivity) */
  meaning: WritableSignal<string | null> = signal(null);

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    // Load local dictionary from assets
    this.http.get<DictionaryEntry[]>('assets/dictionary.json').subscribe({
      next: (data) => {
        this.dictionary = data;
      },
      error: (err) => {
        console.error('Failed to load dictionary:', err);
      },
    });
  }

  /**
   * Look up and display meaning for the clicked word
   * @param word The word to look up
   */
  showMeaning(word: string): void {
    this.selectedWord.set(word);

    const found = this.dictionary.find(
      (entry) => entry.word.toLowerCase() === word.toLowerCase()
    );

    if (found) {
      this.meaning.set(found.meaning);
    } else {
      this.meaning.set('Meaning not found.');
    }
  }

  /** Close the meaning popup */
  closePopup(): void {
    this.selectedWord.set(null);
    this.meaning.set(null);
  }
}