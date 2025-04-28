export interface OpenRouterResponse {
  choices: {
    message: {
      content: string;
      role: string;
    };
  }[];
}

export interface AnalysisResponse {
  analysis: string;
  error?: string;
}