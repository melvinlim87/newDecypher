// src/services/modelUtils.ts

export const MODEL_BASE_COSTS: Record<string, { input: number; output: number }> = {
  'openai/gpt-4o-mini': { input: 0.005, output: 0.015 },
  'google/gemini-2.0-flash-001': { input: 0.0025, output: 0.0075 },
  'anthropic/claude-3.7-sonnet': { input: 0.008, output: 0.024 },
  'qwen/qwen2.5-vl-72b-instruct:free': { input: 0.002, output: 0.006 },
  'google/gemini-2.0-pro-exp-02-05:free': { input: 0.003, output: 0.009 },
  'qwen/qwen-vl-plus:free': { input: 0.002, output: 0.006 },
  'deepseek/deepseek-chat:free': { input: 0.002, output: 0.006 }
};

export function getModelCosts(modelId: string): { input: number; output: number } {
  return MODEL_BASE_COSTS[modelId] || MODEL_BASE_COSTS['openai/gpt-4o-mini'];
}

const ESTIMATED_ANALYSIS_TOKENS = { input: 1000, output: 2000 };
const ESTIMATED_CHAT_TOKENS = { input: 500, output: 1000 };

export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const costs = getModelCosts(model);
  const inputCost = (inputTokens / 1000) * costs.input;
  const outputCost = (outputTokens / 1000) * costs.output;
  const totalCost = inputCost + outputCost;
  const TOKENS_PER_DOLLAR = 667;
  const costInUSD = totalCost;
  const appTokenCost = Math.ceil(costInUSD * TOKENS_PER_DOLLAR);
  return appTokenCost;
}

export const calculateTokenCost = (modelId: string, isAnalysis: boolean = false) => {
  const baseCosts = MODEL_BASE_COSTS[modelId] || MODEL_BASE_COSTS['openai/gpt-4o-mini'];
  const tokenEstimate = isAnalysis ? ESTIMATED_ANALYSIS_TOKENS : ESTIMATED_CHAT_TOKENS;
  const tokenCost = calculateCost(modelId, tokenEstimate.input, tokenEstimate.output);
  return Math.ceil(tokenCost);
};

export const AVAILABLE_MODELS = [
  { id: 'openai/gpt-4o-2024-11-20', name: 'GPT-4o', description: 'Fast and efficient analysis', premium: true, creditCost: 1.25, beta: false },
  { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', description: 'Rapid data processing capabilities', premium: true, creditCost: 0.5, beta: false },
  { id: 'anthropic/claude-3.7-sonnet', name: 'Claude 3.7 Sonnet', description: 'Advanced reasoning and analysis', premium: true, creditCost: 1.5, beta: false },
  { id: 'qwen/qwen2.5-vl-72b-instruct:free', name: 'Qwen 2.5 VL-72B', description: 'Multimodal analysis', premium: false, creditCost: 0.35, beta: false },
  { id: 'google/gemini-2.0-pro-exp-02-05:free', name: 'Gemini 2.0 Pro', description: 'General analysis', premium: false, creditCost: 0.3, beta: false },
  { id: 'qwen/qwen-vl-plus:free', name: 'Qwen VL Plus', description: 'Multimodal analysis', premium: false, creditCost: 0.3, beta: false },
  { id: 'deepseek/deepseek-chat:free', name: 'DeepSeek V3', description: 'Advanced reasoning and analysis', premium: false, creditCost: 0.3, beta: false }
] as const;

export type ModelId = typeof AVAILABLE_MODELS[number]['id'];
