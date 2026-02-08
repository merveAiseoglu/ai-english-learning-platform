import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextViewer } from './text-viewer';

describe('TextViewer', () => {
  let component: TextViewer;
  let fixture: ComponentFixture<TextViewer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TextViewer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TextViewer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
