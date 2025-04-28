// Market Analysis API Key
const MARKET_ANALYSIS_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

const ANALYSIS_COST = 10; // Cost for analyzing a chart
const CHAT_COST = 5; // Cost for each chat message
/* DO NOT REPLACE MODELS */
export const AVAILABLE_MODELS = [
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', description: 'Fast and efficient analysis' },
  { id: 'qwen/qwen2.5-vl-72b-instruct:free', name: 'Qwen 2.5 VL-72B', description: 'Advanced pattern recognition' },
  { id: 'google/gemini-2.0-pro-exp-02-05:free', name: 'Gemini 2.0 Pro', description: 'Comprehensive market insights' }
] as const;

export type ModelId = typeof AVAILABLE_MODELS[number]['id'];

import { auth, database } from '../lib/firebase';
import { ref, get, set } from 'firebase/database';
import { fetchWithRetry } from '../utils/api';

const getOpenRouterHeaders = () => {
  if (!MARKET_ANALYSIS_API_KEY) {
    throw new Error('OpenRouter API key is not configured');
  }

  return {
    'Authorization': `Bearer ${MARKET_ANALYSIS_API_KEY}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': window.location.origin,
    'X-Title': 'AI Market Analyst'
  };
};

export async function analyzeImage(imageUrl: string, modelId: ModelId): Promise<string> {
  try {
    if (!auth.currentUser) {
      throw new Error('You must be logged in to analyze charts');
    }

    const uid = auth.currentUser.uid;
    const userRef = ref(database, `users/${uid}`);
  
    const snapshot = await get(userRef);
    if (!snapshot.exists()) {
      throw new Error('User data not found');
    }

    const userData = snapshot.val();
    const currentTokens = userData.tokens || 0;

    if (currentTokens < ANALYSIS_COST) {
      throw new Error(`Insufficient tokens. You need ${ANALYSIS_COST} tokens to analyze a chart.`);
    }

    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error('Failed to load image. Please try again with a different image.');
    }
    
    const blob = await imageResponse.blob();
    if (blob.size === 0) {
      throw new Error('The image appears to be empty. Please try a different image.');
    }

    const imageData = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(blob);
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    const systemPrompt = `You are an expert financial analyst and trading advisor specializing in technical analysis.

Extract the following information from the provided chart image:

1. **Support/Resistance Levels** (if visible):
   - Clearly defined price points.

2. **Technical Indicators**:
   - Specifically include: Volume indicators (if present), MA indicators (e.g., MA 7, MA 25, MA 99). Omit RSI and MACD if not explicitly shown.

3. **Prioritize accurate data extraction.** Do not infer data. Omit sections if not applicable.

Format response as follows:

🤖 **AI ANALYSIS**
Symbol: [Exact trading pair]
Timeframe: [Specific format: 1M/5M/15M/1H/4H/1D/1W]
---
📊 **MARKET SUMMARY**
- **Current Price:** [Exact number]
- **Support Levels:** [Numbers if found]
- **Resistance Levels:** [Numbers if found]
---
📈 **TECHNICAL ANALYSIS**
- **Technical Indicators:** [List visible ones, e.g., Volume SMA, MA indicators]
---
💡 **TRADING SIGNAL**
- **Action:** [BUY/SELL/HOLD]`;

    const userPrompt = `Please analyze this forex chart image. Identify key support/resistance levels and visible indicators.`;

    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: userPrompt
          },
          {
            type: 'image_url',
            image_url: {
              url: imageData.startsWith('data:') ? imageData : `data:image/png;base64,${imageData}`
            }
          }
        ]
      }
    ];

    const apiResponse = await fetchWithRetry('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: getOpenRouterHeaders(),
      body: JSON.stringify({
        model: modelId,
        max_tokens: 4000,
        temperature: 0.7,
        messages
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json().catch(() => ({}));
      throw new Error(
        errorData?.error?.message || 
        `OpenRouter API error: ${apiResponse.status} ${apiResponse.statusText}`
      );
    }

    const data = await apiResponse.json();
    const content = data.choices[0].message.content;

    if (content.includes("No clear patterns") || 
        content.includes("No patterns observed")) {
      return "Analysis not available.";
    }

    const requiredSections = [
      'MARKET SUMMARY',
      'TECHNICAL ANALYSIS',
      'TRADING SIGNAL'
    ];

    const missingSections = requiredSections.filter(section => 
      !content.includes(section)
    );

    if (missingSections.length > 0) {
      throw new Error(
        `The analysis is missing required sections: ${missingSections.join(', ')}. ` +
        'Please try again with a different model or ensure the chart image is clear.'
      );
    }

    await set(userRef, {
      ...userData,
      tokens: currentTokens - ANALYSIS_COST
    });

    return content;
  } catch (error) {
    throw error;
  }
}

export async function sendChatMessage(
  message: string, 
  modelId: ModelId, 
  analysisType: string,
  chartAnalysis?: string | null
): Promise<string> {
  try {
    if (!auth.currentUser) {
      throw new Error('You must be logged in to use the chat');
    }

    const uid = auth.currentUser.uid;
    const userRef = ref(database, `users/${uid}`);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists()) {
      throw new Error('User data not found');
    }

    const userData = snapshot.val();
    const currentTokens = userData.tokens || 0;

    if (currentTokens < CHAT_COST) {
      throw new Error(`Insufficient tokens. You need ${CHAT_COST} tokens to continue the chat.`);
    }

    const systemMessage = `You are an expert trading analyst and advisor. The user has requested a ${analysisType} analysis. 
Current analysis details:\n\n${chartAnalysis || 'No prior analysis provided.'}\n
Provide a comprehensive response focusing on:
1. Technical aspects (price action, patterns, indicators)
2. Risk management and position sizing
3. Entry/exit strategies
4. Market context and sentiment`;

    const requestBody = {
      model: modelId,
      max_tokens: 4000,
      temperature: 0.7,
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: message }
      ]
    };

    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: getOpenRouterHeaders(),
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      let errorMessage = `API error: ${response.status} ${response.statusText}`;
      if (errorData?.error?.message) {
        errorMessage = errorData.error.message;
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid API response');
    }

    const reply = data.choices[0].message.content;

    await set(userRef, {
      ...userData,
      tokens: currentTokens - CHAT_COST
    });

    return reply;

  } catch (error) {
    throw error;
  }
}
