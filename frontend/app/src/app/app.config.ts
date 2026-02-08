/**
 * Application Configuration
 * Provides core services and configurations for the Angular application
 */

import { 
  ApplicationConfig, 
  provideBrowserGlobalErrorListeners, 
  provideZoneChangeDetection 
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    // Enable global error listeners for better error handling
    provideBrowserGlobalErrorListeners(),
    
    // Optimize change detection with event coalescing
    provideZoneChangeDetection({ eventCoalescing: true }),
    
    // Configure application routes
    provideRouter(routes),
    
    // Enable HTTP client for API requests
    provideHttpClient()
  ]
};