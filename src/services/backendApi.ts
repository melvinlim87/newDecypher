// src/services/backendApi.ts
import axios from 'axios';
import { API_BASE_URL, MODELS_API_URL, MODEL_COST_URL, OPENROUTER_API_URL } from '../config';

export async function getAvailableModels() {
  const response = await axios.get(MODELS_API_URL);
  return response.data;
}

export async function calculateModelTokenCost(modelId: string, isAnalysis: boolean = false) {
  const response = await axios.post(MODEL_COST_URL, { modelId, isAnalysis });
  return response.data;
}

export async function analyzeImageBackend(imageUrl: string, modelId: string) {
  const token = localStorage.getItem('sanctum_token');
  const response = await axios.post(`${OPENROUTER_API_URL}/analyze-image`, {
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
   const response = await axios.post(`${OPENROUTER_API_URL}/send-chat`, {
    messages,
    modelId,
    chartAnalysis
  }, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return response.data;
}
