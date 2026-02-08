/**
 * Writing Service
 * Manages writing prompts, exercises, and learning resources
 * 
 * Features:
 * - Writing prompts for all CEFR levels (A1-C2)
 * - Linking words and transitional phrases
 * - Structure templates for different text types
 * - Vocabulary suggestions by level and category
 * - Sentence patterns for various writing styles
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

// ========================
// INTERFACES
// ========================

export interface WritingPrompt {
  id: number;
  level: string;
  type: string;
  title: string;
  description: string;
  targetWords: number;
  tips?: string[];
}

export interface WritingFilter {
  level?: string;
  type?: string;
}

export interface WritingTips {
  linkingWords: LinkingWordsCategory[];
  structureTemplates: StructureTemplate[];
  vocabularySuggestions: VocabularySuggestion[];
  sentencePatterns: SentencePattern[];
}

export interface LinkingWordsCategory {
  category: string;
  words: LinkingWord[];
}

export interface LinkingWord {
  word: string;
  meaning: string;
  example: string;
  level: string;
}

export interface StructureTemplate {
  type: string;
  name: string;
  structure: string[];
  example: string;
  level: string;
}

export interface VocabularySuggestion {
  category: string;
  level: string;
  words: VocabularyWord[];
}

export interface VocabularyWord {
  word: string;
  meaning: string;
  example: string;
  synonyms?: string[];
}

export interface SentencePattern {
  pattern: string;
  description: string;
  examples: string[];
  level: string;
  type: string;
}

@Injectable({
  providedIn: 'root'
})
export class WritingService {
  
  // ========================
  // WRITING PROMPTS DATA
  // ========================
  
  private prompts: WritingPrompt[] = [
    // A1-A2 Level Prompts
    {
      id: 1,
      level: 'A1',
      type: 'Descriptive',
      title: 'Describe Your Daily Routine',
      description: 'Write about what you do every day from morning to evening. Use simple present tense.',
      targetWords: 80,
      tips: [
        'Use time expressions: first, then, after that',
        'Use simple present tense (I wake up, I eat, I go)',
        'Describe actions clearly and simply'
      ]
    },
    {
      id: 2,
      level: 'A2',
      type: 'Descriptive',
      title: 'My Favorite Food',
      description: 'Write a short paragraph about your favorite food. Explain why you like it and when you eat it.',
      targetWords: 100,
      tips: [
        'Use adjectives to describe taste (delicious, spicy, sweet)',
        'Explain reasons with "because"',
        'Mention when and where you eat it'
      ]
    },
    {
      id: 3,
      level: 'A2',
      type: 'Email',
      title: 'Email to a Friend',
      description: 'Write an email to your friend about your weekend plans. Use informal language.',
      targetWords: 120,
      tips: [
        'Start with: Hi/Hello + name',
        'Use going to for future plans',
        'End with: See you soon, Love, etc.'
      ]
    },
    
    // B1-B2 Level Prompts
    {
      id: 4,
      level: 'B1',
      type: 'Opinion',
      title: 'Social Media: Advantages and Disadvantages',
      description: 'What are the advantages and disadvantages of social media? Give your opinion with examples.',
      targetWords: 150,
      tips: [
        'Start with your main opinion',
        'Use linking words: However, On the other hand, Moreover',
        'Give specific examples for each point'
      ]
    },
    {
      id: 5,
      level: 'B2',
      type: 'Narrative',
      title: 'A Memorable Trip',
      description: 'Describe a memorable trip you took. Explain why it was special and what you learned from it.',
      targetWords: 200,
      tips: [
        'Use past tenses to tell the story',
        'Include emotions and feelings',
        'Explain what made it memorable'
      ]
    },
    {
      id: 6,
      level: 'B2',
      type: 'Formal Letter',
      title: 'Job Application Letter',
      description: 'Write a formal letter applying for a job. Include your qualifications and experience.',
      targetWords: 180,
      tips: [
        'Use formal language and structure',
        'Start with: Dear Sir/Madam',
        'End with: Yours faithfully/sincerely'
      ]
    },
    
    // C1-C2 Level Prompts
    {
      id: 7,
      level: 'C1',
      type: 'Essay',
      title: 'Exams as Knowledge Measurement',
      description: 'Some people think exams are a good way to measure knowledge. Do you agree? Why or why not? Support your argument with examples.',
      targetWords: 300,
      tips: [
        'Present both sides of the argument',
        'Use advanced linking words: Nevertheless, Furthermore, Consequently',
        'Support arguments with concrete examples'
      ]
    },
    {
      id: 8,
      level: 'C2',
      type: 'Essay',
      title: 'AI Impact on Employment',
      description: 'Write an essay discussing the impact of artificial intelligence on human jobs. Consider both positive and negative aspects.',
      targetWords: 400,
      tips: [
        'Analyze the topic from multiple perspectives',
        'Use sophisticated vocabulary and structures',
        'Draw logical conclusions based on evidence'
      ]
    },
    {
      id: 9,
      level: 'C1',
      type: 'Report',
      title: 'Environmental Report',
      description: 'Write a report on environmental issues in your city and suggest solutions.',
      targetWords: 350,
      tips: [
        'Use report structure: Introduction, Findings, Recommendations',
        'Present information objectively',
        'Use formal, impersonal language'
      ]
    }
  ];

  // ========================
  // WRITING TIPS DATA
  // ========================

  private writingTipsData: WritingTips = {
    linkingWords: [
      {
        category: 'Addition',
        words: [
          { word: 'And', meaning: 've, ile birlikte', example: 'I like reading and writing.', level: 'A1' },
          { word: 'Also', meaning: 'ayrıca, de/da', example: 'I also enjoy music.', level: 'A2' },
          { word: 'Moreover', meaning: 'dahası, üstelik', example: 'Moreover, this method is more efficient.', level: 'B2' },
          { word: 'Furthermore', meaning: 'bunun yanı sıra', example: 'Furthermore, the results were promising.', level: 'C1' },
          { word: 'In addition', meaning: 'bunlara ek olarak', example: 'In addition, we need more resources.', level: 'B2' }
        ]
      },
      {
        category: 'Contrast',
        words: [
          { word: 'But', meaning: 'ama, fakat', example: 'I wanted to go, but it was raining.', level: 'A1' },
          { word: 'However', meaning: 'ancak, bununla birlikte', example: 'However, the situation changed.', level: 'B1' },
          { word: 'Nevertheless', meaning: 'yine de, buna rağmen', example: 'Nevertheless, we continued with the plan.', level: 'C1' },
          { word: 'On the other hand', meaning: 'öte yandan', example: 'On the other hand, this approach has benefits.', level: 'B2' },
          { word: 'In contrast', meaning: 'aksine, karşıt olarak', example: 'In contrast, the second method is faster.', level: 'C1' }
        ]
      },
      {
        category: 'Cause & Effect',
        words: [
          { word: 'Because', meaning: 'çünkü', example: 'I stayed home because I was sick.', level: 'A2' },
          { word: 'Therefore', meaning: 'bu nedenle', example: 'Therefore, we need to reconsider.', level: 'B2' },
          { word: 'Consequently', meaning: 'sonuç olarak', example: 'Consequently, sales increased.', level: 'C1' },
          { word: 'As a result', meaning: 'sonuç olarak', example: 'As a result, the project was delayed.', level: 'B2' },
          { word: 'Due to', meaning: 'nedeniyle', example: 'Due to bad weather, the flight was cancelled.', level: 'B2' }
        ]
      },
      {
        category: 'Sequence',
        words: [
          { word: 'First', meaning: 'önce, ilk olarak', example: 'First, we need to prepare.', level: 'A1' },
          { word: 'Then', meaning: 'sonra, daha sonra', example: 'Then, we can start working.', level: 'A1' },
          { word: 'Finally', meaning: 'sonunda, nihayet', example: 'Finally, we finished the project.', level: 'A2' }
        ]
      }
    ],
    structureTemplates: [
      {
        type: 'Essay',
        name: 'Five-Paragraph Essay',
        structure: [
          '1. Introduction: Hook + Background + Thesis statement',
          '2. Body Paragraph 1: First main point + Evidence + Analysis',
          '3. Body Paragraph 2: Second main point + Evidence + Analysis',
          '4. Body Paragraph 3: Third main point + Evidence + Analysis',
          '5. Conclusion: Restate thesis + Summarize + Final thought'
        ],
        example: 'Perfect for academic essays and opinion pieces',
        level: 'B2'
      },
      {
        type: 'Email',
        name: 'Formal Email',
        structure: [
          '1. Subject: Clear and specific',
          '2. Greeting: Dear Mr./Ms. [Name]',
          '3. Introduction: State purpose',
          '4. Body: Main content (2-3 paragraphs)',
          '5. Closing: Thank you + Next steps',
          '6. Sign-off: Yours sincerely/faithfully'
        ],
        example: 'For business communication and formal requests',
        level: 'B1'
      },
      {
        type: 'Report',
        name: 'Business Report',
        structure: [
          '1. Executive Summary',
          '2. Introduction: Background + Objectives',
          '3. Methodology: How data was collected',
          '4. Findings: Present data and analysis',
          '5. Recommendations: Action points',
          '6. Conclusion: Summary of key points'
        ],
        example: 'For workplace reports and academic research',
        level: 'C1'
      }
    ],
    vocabularySuggestions: [
      {
        category: 'Descriptive Writing',
        level: 'A2',
        words: [
          { word: 'Beautiful', meaning: 'güzel', example: 'The sunset was beautiful.', synonyms: ['Pretty', 'Lovely'] },
          { word: 'Interesting', meaning: 'ilginç', example: 'The book was very interesting.', synonyms: ['Fascinating', 'Engaging'] },
          { word: 'Delicious', meaning: 'lezzetli', example: 'The food was delicious.', synonyms: ['Tasty', 'Yummy'] }
        ]
      },
      {
        category: 'Opinion Writing',
        level: 'B2',
        words: [
          { word: 'Significant', meaning: 'önemli', example: 'This is a significant issue.', synonyms: ['Important', 'Major'] },
          { word: 'Beneficial', meaning: 'yararlı', example: 'Exercise is beneficial for health.', synonyms: ['Helpful', 'Advantageous'] },
          { word: 'Controversial', meaning: 'tartışmalı', example: 'This is a controversial topic.', synonyms: ['Debatable', 'Disputed'] }
        ]
      }
    ],
    sentencePatterns: [
      {
        pattern: 'I think that...',
        description: 'Expressing personal opinion',
        examples: ['I think that technology has changed our lives.', 'I think that education is very important.'],
        level: 'A2',
        type: 'Opinion'
      },
      {
        pattern: 'Not only... but also...',
        description: 'Adding emphasis to two related points',
        examples: ['Not only is it expensive, but also time-consuming.', 'She is not only smart but also hardworking.'],
        level: 'B2',
        type: 'Emphasis'
      },
      {
        pattern: 'It is worth noting that...',
        description: 'Introducing an important point',
        examples: ['It is worth noting that the results may vary.', 'It is worth noting that this approach is new.'],
        level: 'C1',
        type: 'Academic'
      }
    ]
  };

  // ========================
  // STATE MANAGEMENT
  // ========================

  private currentPromptSubject = new BehaviorSubject<WritingPrompt | null>(null);
  public currentPrompt$ = this.currentPromptSubject.asObservable();

  constructor() {
    // Initialize with a random prompt
    this.setRandomPrompt();
  }

  // ========================
  // PROMPT MANAGEMENT
  // ========================

  /**
   * Get all available CEFR levels
   */
  getAvailableLevels(): string[] {
    const levels = [...new Set(this.prompts.map(p => p.level))];
    return levels.sort();
  }

  /**
   * Get all available writing types
   */
  getAvailableTypes(): string[] {
    const types = [...new Set(this.prompts.map(p => p.type))];
    return types.sort();
  }

  /**
   * Get prompts filtered by level and/or type
   */
  getFilteredPrompts(filter: WritingFilter = {}): WritingPrompt[] {
    let filtered = this.prompts;

    if (filter.level) {
      filtered = filtered.filter(p => p.level === filter.level);
    }

    if (filter.type) {
      filtered = filtered.filter(p => p.type === filter.type);
    }

    return filtered;
  }

  /**
   * Set a random prompt based on filter
   */
  setRandomPrompt(filter: WritingFilter = {}): void {
    const filteredPrompts = this.getFilteredPrompts(filter);
    
    if (filteredPrompts.length > 0) {
      const randomIndex = Math.floor(Math.random() * filteredPrompts.length);
      const selectedPrompt = filteredPrompts[randomIndex];
      this.currentPromptSubject.next(selectedPrompt);
    }
  }

  /**
   * Get specific prompt by ID
   */
  getPromptById(id: number): WritingPrompt | undefined {
    return this.prompts.find(p => p.id === id);
  }

  /**
   * Get current active prompt
   */
  getCurrentPrompt(): WritingPrompt | null {
    return this.currentPromptSubject.value;
  }

  /**
   * Set specific prompt as current
   */
  setCurrentPrompt(prompt: WritingPrompt): void {
    this.currentPromptSubject.next(prompt);
  }

  // ========================
  // WRITING TIPS METHODS
  // ========================

  /**
   * Get all writing tips data
   */
  getWritingTips(): WritingTips {
    return this.writingTipsData;
  }

  /**
   * Get linking words by category (Addition, Contrast, etc.)
   */
  getLinkingWordsByCategory(category: string): LinkingWord[] {
    const categoryData = this.writingTipsData.linkingWords.find(c => c.category === category);
    return categoryData ? categoryData.words : [];
  }

  /**
   * Get linking words filtered by CEFR level
   */
  getLinkingWordsByLevel(level: string): LinkingWord[] {
    const allWords: LinkingWord[] = [];
    this.writingTipsData.linkingWords.forEach(category => {
      const levelWords = category.words.filter(word => word.level === level);
      allWords.push(...levelWords);
    });
    return allWords;
  }

  /**
   * Get structure templates by writing type
   */
  getStructureTemplatesByType(type: string): StructureTemplate[] {
    return this.writingTipsData.structureTemplates.filter(template => 
      template.type.toLowerCase() === type.toLowerCase()
    );
  }

  /**
   * Get vocabulary suggestions by level and category
   */
  getVocabularyByLevelAndCategory(level: string, category?: string): VocabularyWord[] {
    let filtered = this.writingTipsData.vocabularySuggestions.filter(vs => vs.level === level);
    
    if (category) {
      filtered = filtered.filter(vs => vs.category.toLowerCase().includes(category.toLowerCase()));
    }

    const allWords: VocabularyWord[] = [];
    filtered.forEach(vs => allWords.push(...vs.words));
    return allWords;
  }

  /**
   * Get sentence patterns by level and type
   */
  getSentencePatternsByLevelAndType(level: string, type?: string): SentencePattern[] {
    let filtered = this.writingTipsData.sentencePatterns.filter(sp => sp.level === level);
    
    if (type) {
      filtered = filtered.filter(sp => sp.type.toLowerCase() === type.toLowerCase());
    }

    return filtered;
  }

  /**
   * Get comprehensive tips for current active prompt
   * Returns all relevant learning resources
   */
  getTipsForCurrentPrompt(): {
    linkingWords: LinkingWord[];
    structureTemplates: StructureTemplate[];
    vocabularySuggestions: VocabularyWord[];
    sentencePatterns: SentencePattern[];
  } {
    const currentPrompt = this.getCurrentPrompt();
    
    if (!currentPrompt) {
      return {
        linkingWords: [],
        structureTemplates: [],
        vocabularySuggestions: [],
        sentencePatterns: []
      };
    }

    return {
      linkingWords: this.getLinkingWordsByLevel(currentPrompt.level),
      structureTemplates: this.getStructureTemplatesByType(currentPrompt.type),
      vocabularySuggestions: this.getVocabularyByLevelAndCategory(currentPrompt.level),
      sentencePatterns: this.getSentencePatternsByLevelAndType(currentPrompt.level, currentPrompt.type)
    };
  }

  /**
   * Get all linking word categories
   */
  getLinkingWordCategories(): string[] {
    return this.writingTipsData.linkingWords.map(category => category.category);
  }

  /**
   * Get all structure template types
   */
  getStructureTemplateTypes(): string[] {
    const types = [...new Set(this.writingTipsData.structureTemplates.map(template => template.type))];
    return types.sort();
  }

  /**
   * Get all vocabulary categories
   */
  getVocabularyCategories(): string[] {
    const categories = [...new Set(this.writingTipsData.vocabularySuggestions.map(vs => vs.category))];
    return categories.sort();
  }
}