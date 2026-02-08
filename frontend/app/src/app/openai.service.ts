import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OpenAIService {
  // Backend sunucu adresin
  private baseUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  /**
   * Grammar Check
   * Backend'deki /api/grammar-check endpoint'ini çağırır.
   */
  correctGrammar(text: string): Observable<any> {
    // Backend bizden { text: "..." } bekliyor
    return this.http.post(`${this.baseUrl}/grammar-check`, { text: text });
  }

  /**
   * Translate
   * Backend'deki /api/translate endpoint'ini çağırır.
   * (İleride lazım olursa hazır olsun)
   */
  translateWord(word: string): Observable<any> {
    // Backend bizden { word: "..." } bekliyor
    return this.http.post(`${this.baseUrl}/translate`, { word: word });
  }
}