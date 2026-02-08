/**
 * Shared Interfaces
 * Global type definitions used across the application
 */

/**
 * Word interface - represents a vocabulary word
 * Used throughout vocabulary, review, and flashcard modules
 */
export interface Word {
  id?: number | string;
  word: string;
  pos?: string;             // Part of speech (noun, verb, etc.)
  meaning_tr?: string;      // Turkish translation
  example_en?: string;      // English example sentence
  example_tr?: string;      // Turkish example sentence
  synonyms?: string[];      // List of synonyms
  antonyms?: string[];      // List of antonyms
  other_forms?: any;        // Other forms of the word (e.g., plural, past tense)
  isKnown?: boolean;        // Whether user has learned the word
  status?: 'learned' | 'mastered' | 'review'; // Current learning status

  // SRS (Spaced Repetition System) fields
  level?: number;                          // SRS level (0 = new, higher = mastered)
  nextReviewDate?: string | Date | null;   // Scheduled next review date
  lastReviewDate?: string | Date | null;   // Last review date
}