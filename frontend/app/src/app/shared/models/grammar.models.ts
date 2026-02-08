/**
 * Grammar Models
 * Type definitions for the grammar tutorial module
 * Covers levels, topics, quizzes, examples, and progress tracking
 */

/**
 * Represents a grammar level (e.g., A1, A2, B1)
 */
export interface GrammarLevel {
  id: string;
  name: string;
  description: string;
  order: number;  // Display order within the level list
}

/**
 * Represents a grammar topic within a level
 */
export interface GrammarTopic {
  id: string;
  levelId: string;          // Reference to parent GrammarLevel
  title: string;
  description: string;
  order: number;            // Display order within the level
  estimatedTime: number;    // Estimated completion time in minutes
  isLocked?: boolean;       // Whether topic is locked for the user
}

/**
 * Detailed information for a grammar topic
 * Contains lesson content, examples, rules, and quizzes
 */
export interface GrammarTopicDetail {
  id: string;
  topicId: string;          // Reference to parent GrammarTopic
  title: string;
  explanation: string;      // Main lesson explanation
  examples: GrammarExample[];
  rules: string[];          // List of grammar rules
  tips: string[];           // Learning tips
  quizzes?: GrammarQuiz[];  // Optional quiz questions
}

/**
 * Example sentence used in grammar lessons
 */
export interface GrammarExample {
  english: string;
  turkish: string;
  highlight?: string;       // Part of the sentence to highlight
  type: 'correct' | 'incorrect' | 'neutral';  // Example type for styling
}

/**
 * Quiz question with string-based answer matching
 */
export interface GrammarQuiz {
  question: string;
  options: string[];
  answer: string;           // Correct answer text
  explanation: string;      // Explanation of the answer
}

/**
 * Quiz question with index-based answer matching
 */
export interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;           // Index of the correct answer (0-based)
}

/**
 * Tracks user's progress on a grammar topic
 */
export interface GrammarProgress {
  userId: string;
  topicId: string;
  isCompleted: boolean;
  completedAt?: Date;       // Completion timestamp
  score?: number;           // Score achieved (0-100)
}