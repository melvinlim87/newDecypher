// src/services/backendApi.ts
import axios from 'axios';
import { API_BASE_URL } from '../config';

// Configure axios defaults
axios.defaults.withCredentials = true; // Always send cookies
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest'; // Required for Laravel to detect AJAX requests

// Create an axios instance with interceptors for auth
const api = axios.create({
  baseURL: API_BASE_URL
});

// Add a request interceptor to add the token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('sanctum_token');
  if (token && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Add a response interceptor to handle 401 errors
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      console.error('Authentication error - token might be invalid or expired');
      // Optionally redirect to login
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export async function getAvailableModels() {
  const response = await api.get('/models');
  return response.data;
}

export async function calculateModelTokenCost(modelId: string, isAnalysis: boolean = false) {
  const response = await api.post('/model-cost', { modelId, isAnalysis });
  return response.data;
}

export async function analyzeImageBackend(imageUrl: string, modelId: string) {
  const response = await api.post(
    '/openrouter/analyze-image',
    { image: imageUrl, modelId }
  );
  // Ensure only the reply string is returned
  return typeof response.data === 'object' && response.data !== null && 'reply' in response.data
    ? response.data.reply
    : response.data;
}

export async function sendChatMessageBackend(messages: any[], modelId: string, chartAnalysis?: string) {
  const response = await api.post(
    '/openrouter/send-chat',
    { messages, modelId, chartAnalysis }
  );
  return response.data;
}
