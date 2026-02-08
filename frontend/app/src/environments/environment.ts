/**
 * Development Environment Configuration
 * This file contains configuration for development environment
 * 
 * SECURITY: API keys moved to backend for security
 */
export const environment = {
  production: false,
  
  // Backend API URL (all API calls go through backend proxy)
  apiUrl: 'http://localhost:5000/api'
};