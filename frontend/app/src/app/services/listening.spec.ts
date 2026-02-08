import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ListeningService } from './listening.service';

describe('ListeningService', () => {
  let service: ListeningService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(ListeningService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
