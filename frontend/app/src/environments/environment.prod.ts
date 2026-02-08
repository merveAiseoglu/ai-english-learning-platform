/**
 * Production Environment Configuration
 * This file is used when building for production
 * 
 * IMPORTANT: In production, API calls should go through your backend
 * Never expose API keys in frontend code in production
 */

export const environment = {
  production: true,
  
  // API URLs - use your backend endpoints
  backendUrl: 'https://your-backend-domain.com',
  
  // OpenAI Configuration
  // In production, these calls should go through your backend
  openai: {
    apiUrl: '/api/openai', // Proxy through your backend
    apiKey: '' // Empty - backend handles authentication
  }
};