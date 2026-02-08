/**
 * Reading Text Model
 * Type definition for reading comprehension exercises
 */

/**
 * Represents a reading text exercise
 * Used in the reading module to display passages
 */
export interface ReadingText {
  id: number;
  title: string;
  paragraphs: string[];    // Text split into paragraphs for display
}