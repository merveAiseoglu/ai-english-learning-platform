/**
 * Reading Service
 * Provides reading comprehension texts from JSON
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ReadingText {
  id: number;
  level: string;
  title: string;
  content: string;
}

@Injectable({
  providedIn: 'root',
})
export class ReadingService {
  private jsonUrl = 'assets/reading-texts.json';

  constructor(private http: HttpClient) {}

  getTexts(): Observable<ReadingText[]> {
    return this.http.get<ReadingText[]>(this.jsonUrl);
  }
}