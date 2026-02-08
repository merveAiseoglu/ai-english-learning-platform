import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DictionaryService {
  // Backend URL'in. (Localhost portunu kontrol etmeyi unutma, genelde 5000 veya 3000 olur)
  private apiUrl = 'http://localhost:5000/api/translate';
  
  // Simple in-memory cache for translations
  private translationCache: { [key: string]: string[] } = {};

  constructor(private http: HttpClient) {}

  /**
   * Translate word (synchronous - returns cached or empty initially)
   * Note: First call returns empty array, subsequent calls return cached result
   * @param word English word to translate
   * @returns Array of Turkish translations
   */
  translate(word: string): string[] {
    const cacheKey = word.toLowerCase();
    
    // Eğer cache'te varsa direkt döndür
    if (this.translationCache[cacheKey]) {
      console.log('Retrieved from cache:', word, this.translationCache[cacheKey]);
      return this.translationCache[cacheKey];
    }

    // Cache'te yoksa API'den iste (Sonraki çağrılar için cache'i doldurur)
    this.translateWithAPI(word).subscribe({
      next: (translations) => {
        this.translationCache[cacheKey] = translations;
        console.log('Retrieved from API and cached:', word, translations);
      },
      error: (error) => {
        console.error('Translation error:', error);
        this.translationCache[cacheKey] = [`Translation not found for "${word}"`];
      }
    });

    // İlk istekte boş döner, veri gelince cache dolar.
    return [];
  }

  /**
   * Translate word using backend proxy
   * @param word English word to translate
   * @returns Observable with array of Turkish translations
   */
  translateWithAPI(word: string): Observable<string[]> {
    // DÜZELTME: Backend { success: boolean, data: string } dönüyor.
    return this.http.post<{success: boolean, data: string}>(
      this.apiUrl,
      { word }
    ).pipe(
      map(response => {
        // DÜZELTME: response.data kontrolü yapıyoruz
        if (response.success && response.data) {
          // Backend metni "Translation: ... \n Example: ..." formatında yolluyor.
          // Bu yüzden split yapmadan direkt diziye atıyoruz.
          return [response.data];
        }
        return [`Translation not found for "${word}"`];
      }),
      catchError(error => {
        console.error('API translation error:', error);
        return of([`Translation not found for "${word}"`]);
      })
    );
  }

  /**
   * Translate word asynchronously (recommended method)
   * Returns cached result immediately if available, otherwise fetches from API
   * @param word English word to translate
   * @returns Observable with array of Turkish translations
   */
  translateAsync(word: string): Observable<string[]> {
    const cacheKey = word.toLowerCase();
    
    // Return cached result immediately if available
    if (this.translationCache[cacheKey]) {
      return of(this.translationCache[cacheKey]);
    }

    // Otherwise fetch from backend API
    return this.translateWithAPI(word).pipe(
      map(translations => {
        this.translationCache[cacheKey] = translations;
        return translations;
      })
    );
  }
}