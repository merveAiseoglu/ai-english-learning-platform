import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Grammar } from './grammar';

describe('Grammar', () => {
  let component: Grammar;
  let fixture: ComponentFixture<Grammar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Grammar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Grammar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
