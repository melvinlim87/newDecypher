// src/services/backendApi.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000/api';

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
