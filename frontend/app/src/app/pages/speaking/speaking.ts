/**
 * Speaking Page Component
 * Main speaking practice interface
 */

import { Component } from '@angular/core';
import { SpeakingPracticeComponent } from './components/speaking-practice/speaking-practice';

@Component({
  standalone: true,
  selector: 'app-speaking',
  templateUrl: './speaking.html',
  styleUrls: ['./speaking.css'],
  template: `<speaking-practice></speaking-practice>`,
  imports: [SpeakingPracticeComponent]
})
export class SpeakingPage {}