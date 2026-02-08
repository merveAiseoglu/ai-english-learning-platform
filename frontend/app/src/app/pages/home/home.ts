/**
 * Home Page Component
 * Landing page with feature overview and navigation
 * 
 * Features:
 * - Hero section with call-to-action
 * - Feature cards for each learning module
 * - Statistics overview
 * - Navigation to vocabulary quiz mode
 */

import { Component } from '@angular/core';
import { RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  constructor(private router: Router) {}

  /**
   * Navigate to vocabulary page with specific tab selected
   * Used by hero section "Quiz" button
   * @param tab - The tab to activate ('test' for quiz mode)
   */
  setTabFromHome(tab: string): void {
    this.router.navigate(['/vocabulary'], { state: { tab } });
  }
}