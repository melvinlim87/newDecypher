// Global configuration file for API endpoints
// This file centralizes all API URLs to make deployment easier

// Set this to true for production builds
const IS_PRODUCTION = true;

// Base API URL
export const API_BASE_URL = IS_PRODUCTION 
  ? 'https://ai.decyphers.com/api'
  : 'http://localhost:8000/api';

// Chart API URL
export const CHART_API_URL = IS_PRODUCTION
  ? 'https://ai.decyphers.com/api/chart'
  : 'http://localhost:8888/.netlify/functions/chart-proxy';

// Yahoo Finance API URL
export const YAHOO_API_URL = IS_PRODUCTION
  ? 'https://ai.decyphers.com/api'
  : 'http://localhost:3005';

// OpenRouter API URL
export const OPENROUTER_API_URL = `${API_BASE_URL}/openrouter`;

// Firebase login URL
export const FIREBASE_LOGIN_URL = `${API_BASE_URL}/firebase-login`;

// Models API URL
export const MODELS_API_URL = `${API_BASE_URL}/models`;

// Model cost calculation URL
export const MODEL_COST_URL = `${API_BASE_URL}/model-cost`;
