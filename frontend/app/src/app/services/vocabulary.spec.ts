import { TestBed } from '@angular/core/testing';
import { VocabularyService } from './vocabulary.service'; 
import { Vocabulary } from '../pages/vocabulary/vocabulary';

describe('Vocabulary', () => {
  let service: Vocabulary;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Vocabulary);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
