/**
 * Application Routes Configuration
 * Defines all navigation routes for the language learning app
 */

import { Routes } from '@angular/router';

export const routes: Routes = [
  // Home page - default route
  { 
    path: '', 
    loadComponent: () => import('./pages/home/home').then(m => m.Home) 
  },

  // Vocabulary learning module
  { 
    path: 'vocabulary', 
    loadComponent: () => import('./pages/vocabulary/vocabulary').then(m => m.Vocabulary) 
  },

  // Reading comprehension module
  { 
    path: 'reading', 
    loadComponent: () => import('./pages/reading/reading').then(m => m.ReadingPage) 
  },

  // Listening practice module
  { 
    path: 'listening', 
    loadComponent: () => import('./pages/listening/listening').then(m => m.Listening) 
  },

  // Speaking practice module
  { 
    path: 'speaking', 
    loadComponent: () => import('./pages/speaking/speaking').then(m => m.SpeakingPage) 
  },

  // Writing practice module
  { 
    path: 'writing', 
    loadComponent: () => import('./pages/writing/writing').then(m => m.Writing) 
  },

  // Grammar tutorial routes
  { 
    path: 'grammar', 
    redirectTo: 'grammar/level/a1', 
    pathMatch: 'full' 
  },
  { 
    path: 'grammar/level/:levelId', 
    loadComponent: () => import('./pages/grammar/grammar-tutorial').then(m => m.GrammarTutorialComponent) 
  },
  { 
    path: 'grammar/topic/:topicId', 
    loadComponent: () => import('./pages/grammar/grammar-tutorial').then(m => m.GrammarTutorialComponent) 
  },
  { 
    path: 'grammar/lesson/:lessonId', 
    loadComponent: () => import('./pages/grammar/grammar-tutorial').then(m => m.GrammarTutorialComponent) 
  },

  // Legacy quiz route redirects to vocabulary
  { 
    path: 'quiz', 
    redirectTo: 'vocabulary', 
    pathMatch: 'full' 
  },

  // User dashboard
  { 
    path: 'dashboard', 
    loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.Dashboard) 
  },

  // Review progress page
  { 
    path: 'review', 
    loadComponent: () => import('./pages/review/review').then(m => m.Review) 
  },

  // Wildcard route - redirect to home for unknown paths
  { 
    path: '**', 
    redirectTo: '' 
  }
];