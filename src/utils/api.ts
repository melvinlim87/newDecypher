// Retry configuration
interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
}

const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 5000,
};

export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retryConfig: RetryConfig = defaultRetryConfig
): Promise<Response> {
  let lastError: Error;
  let delay = retryConfig.initialDelay;

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // Only retry on specific status codes
      if (response.status === 429 || (response.status >= 500 && response.status < 600)) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt === retryConfig.maxRetries) {
        break;
      }

      // Exponential backoff with jitter
      await new Promise(resolve => 
        setTimeout(resolve, delay + Math.random() * 1000)
      );
      
      delay = Math.min(delay * 2, retryConfig.maxDelay);
    }
  }

  throw lastError;
}