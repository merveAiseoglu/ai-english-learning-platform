import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Vocabulary } from './vocabulary';

describe('Vocabulary', () => {
  let component: Vocabulary;
  let fixture: ComponentFixture<Vocabulary>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Vocabulary]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Vocabulary);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});