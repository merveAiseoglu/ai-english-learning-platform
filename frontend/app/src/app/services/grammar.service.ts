/**
 * Grammar Service
 * Manages grammar levels, topics, and lesson details
 * Loads data from JSON and provides filtered/sorted access
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';
import {
  GrammarLevel,
  GrammarTopic,
  GrammarTopicDetail
} from 'src/app/shared/models/grammar.models';

interface GrammarData {
  levels: GrammarLevel[];
  topics: GrammarTopic[];
  details: GrammarTopicDetail[];
}

@Injectable({
  providedIn: 'root'
})
export class GrammarService {
  private data$: Observable<GrammarData>;

  constructor(private http: HttpClient) {
    // Load and cache grammar data from JSON file
    this.data$ = this.http.get<GrammarData>('assets/data/grammar-data.json').pipe(
      shareReplay(1) // Cache the data to prevent multiple HTTP requests
    );
  }

  /**
   * Get all grammar levels sorted by order
   */
  getLevels(): Observable<GrammarLevel[]> {
    return this.data$.pipe(
      map(data => data.levels.sort((a, b) => a.order - b.order))
    );
  }

  /**
   * Get topics filtered by level ID and sorted by order
   */
  getTopicsByLevel(levelId: string): Observable<GrammarTopic[]> {
    return this.data$.pipe(
      map(data =>
        data.topics
          .filter(topic => topic.levelId === levelId)
          .sort((a, b) => a.order - b.order)
      )
    );
  }

  /**
   * Get detailed information for a specific topic
   */
  getTopicDetail(topicId: string): Observable<GrammarTopicDetail | null> {
    return this.data$.pipe(
      map(data =>
        data.details.find(detail => detail.topicId === topicId) || null
      )
    );
  }

  /**
   * Get level information by ID
   */
  getLevelById(levelId: string): Observable<GrammarLevel | null> {
    return this.data$.pipe(
      map(data => data.levels.find(level => level.id === levelId) || null)
    );
  }
}