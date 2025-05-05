// src/services/backendApi.ts
import axios from 'axios';

// Use production API URL directly for deployment
const API_BASE_URL = 'https://ai.decyphers.com/api';

export async function getAvailableModels() {
  const response = await axios.get(`${API_BASE_URL}/models`);
  return response.data;
}

export async function calculateModelTokenCost(modelId: string, isAnalysis: boolean = false) {
  const response = await axios.post(`${API_BASE_URL}/model-cost`, { modelId, isAnalysis });
  return response.data;
}

export async function analyzeImageBackend(imageUrl: string, modelId: string) {
  const token = localStorage.getItem('sanctum_token');
  const response = await axios.post(`${API_BASE_URL}/openrouter/analyze-image`, {
    image: imageUrl,
    modelId
  }, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  // Ensure only the reply string is returned
  return typeof response.data === 'object' && response.data !== null && 'reply' in response.data
    ? response.data.reply
    : response.data;
}

export async function sendChatMessageBackend(messages: any[], modelId: string, chartAnalysis?: string) {
  const token = localStorage.getItem('sanctum_token');
   const response = await axios.post(`${API_BASE_URL}/openrouter/send-chat`, {
    messages,
    modelId,
    chartAnalysis
  }, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return response.data;
}
