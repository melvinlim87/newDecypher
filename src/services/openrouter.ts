// Market Analysis API Key
const MARKET_ANALYSIS_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

// Define base costs per 1,000 tokens for each model
export const MODEL_BASE_COSTS: Record<string, { input: number; output: number }> = {
  'openai/gpt-4o-mini': { input: 0.005, output: 0.015 }, // GPT-4o Mini
  'google/gemini-2.0-flash-001': { input: 0.0025, output: 0.0075 }, // Gemini 2.0 Flash
  'anthropic/claude-3.7-sonnet': { input: 0.008, output: 0.024 }, // Claude 3.7 Sonnet
  'qwen/qwen2.5-vl-72b-instruct:free': { input: 0.002, output: 0.006 }, // Qwen 2.5 VL-72B
  'google/gemini-2.0-pro-exp-02-05:free': { input: 0.003, output: 0.009 }, // Gemini 2.0 Pro
  'qwen/qwen-vl-plus:free': { input: 0.002, output: 0.006 }, // Qwen VL Plus
  'deepseek/deepseek-chat:free': { input: 0.002, output: 0.006 } // DeepSeek V3
};

// Function to get the base costs for a specific model
export function getModelCosts(modelId: string): { input: number; output: number } {
  return MODEL_BASE_COSTS[modelId] || MODEL_BASE_COSTS['openai/gpt-4o-mini']; // Default to GPT-4o Mini if model not found
}

// Estimated token counts (these can be refined based on real usage data)
const ESTIMATED_ANALYSIS_TOKENS = { input: 1000, output: 2000 }; // Base token usage for analysis
const ESTIMATED_CHAT_TOKENS = { input: 500, output: 1000 }; // Base token usage for chat

// Function to calculate the cost of a request using the input and output tokens
export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  // Get the base costs for the selected model
  const costs = getModelCosts(model);
  
  // Calculate the base cost for input and output tokens
  const inputCost = (inputTokens / 1000) * costs.input;
  const outputCost = (outputTokens / 1000) * costs.output;
  
  // Calculate the total cost - no profit multiplier needed here
  // since we already built profit into the token purchase price
  const totalCost = inputCost + outputCost;
  
  // 1 USD dollar buys 667 tokens (profit is built into token purchases)
  const TOKENS_PER_DOLLAR = 667;
  
  // Calculate how many dollars this request costs
  const costInUSD = totalCost;
  
  // Calculate how many app tokens to deduct
  const appTokenCost = Math.ceil(costInUSD * TOKENS_PER_DOLLAR);
  
  // Record detailed cost information for logging
  const costInfo = {
    model,
    inputTokens,
    outputTokens,
    inputCost,
    outputCost,
    totalCost, // No "baseCost" vs "totalCost" distinction anymore
    costInUSD,
    appTokenCost
  };
  
  console.log('Cost Info:', costInfo);
  
  return appTokenCost;
}

// Calculate token costs dynamically
export const calculateTokenCost = (modelId: string, isAnalysis: boolean = false) => {
  const baseCosts = MODEL_BASE_COSTS[modelId] || MODEL_BASE_COSTS['openai/gpt-4o-mini']; // Default if model not found
  const tokenEstimate = isAnalysis ? ESTIMATED_ANALYSIS_TOKENS : ESTIMATED_CHAT_TOKENS;
  
  // Calculate cost in USD cents (input + output tokens)
  const inputCost = (tokenEstimate.input / 1000) * baseCosts.input;
  const outputCost = (tokenEstimate.output / 1000) * baseCosts.output;
  const totalCost = inputCost + outputCost;
  
  // Convert to tokens (1 USD cent = 1 token for simplicity)
  // Round up to nearest whole number
  const tokenCost = calculateCost(modelId, tokenEstimate.input, tokenEstimate.output);
  return Math.ceil(tokenCost);
};

/* DO NOT REPLACE MODELS */
export const AVAILABLE_MODELS = [
  { id: 'openai/gpt-4o-2024-11-20', name: 'GPT-4o', description: 'Fast and efficient analysis', premium: true, creditCost: 1.25, beta: false },
  { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', description: 'Rapid data processing capabilities', premium: true, creditCost: 0.5, beta: false },
  { id: 'anthropic/claude-3.7-sonnet', name: 'Claude 3.7 Sonnet', description: 'Advanced reasoning and analysis', premium: true, creditCost: 1.5, beta: false },
  { id: 'qwen/qwen2.5-vl-72b-instruct:free', name: 'Qwen 2.5 VL-72B', description: 'Advanced pattern recognition', premium: false, creditCost: 0.3, beta: false },
  { id: 'google/gemini-2.0-pro-exp-02-05:free', name: 'Gemini 2.0 Pro', description: 'Comprehensive market insights', premium: false, creditCost: 0.3, beta: false },
  { id: 'qwen/qwen-vl-plus:free', name: 'Qwen VL Plus', description: 'Enhanced visual and linguistic processing', premium: false, creditCost: 0.3, beta: false },
  { id: 'deepseek/deepseek-chat:free', name: 'DeepSeek V3', description: 'Advanced reasoning and analysis', premium: false, creditCost: 0.3, beta: false }
] as const;

export type ModelId = typeof AVAILABLE_MODELS[number]['id'];
import { auth, database, recordTokenUsage } from '../lib/firebase';
import { ref, get, set, update } from 'firebase/database';
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

export async function analyzeImage(imageUrl: string, modelId: ModelId, customPrompt?: string): Promise<string> {
  const startTime = Date.now();
  const selectedModel = AVAILABLE_MODELS.find(m => m.id === modelId);
  const ANALYSIS_COST = calculateTokenCost(modelId, true);

  try {
    // Check if user is authenticated
    if (!auth.currentUser) {
      throw new Error('You must be logged in to analyze charts');
    }

    // Check tokens
    const uid = auth.currentUser.uid;
    const userRef = ref(database, `users/${uid}`);
  
    try {
      const snapshot = await get(userRef);
      if (!snapshot.exists()) {
        throw new Error('User data not found');
      }

      const userData = snapshot.val();
      const currentTokens = typeof userData.tokens === 'number' ? userData.tokens : 0;

      if (currentTokens < ANALYSIS_COST) {
        throw new Error(`Insufficient tokens. You need ${ANALYSIS_COST} tokens to analyze a chart.`);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to process tokens');
    }

    // For blob URLs, we need to convert to base64
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error('Failed to load image. Please try again with a different image.');
    }
    
    const blob = await imageResponse.blob();
    if (blob.size === 0) {
      throw new Error('The image appears to be empty. Please try a different image.');
    }

    console.log('📊 Processing Image:', {
      modelId,
      imageSize: blob.size,
      imageType: blob.type,
      timestamp: new Date().toISOString()
    });

    const imageData = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result as string;
        if (base64Data && base64Data.startsWith('data:image/')) {
          resolve(base64Data);
        } else {
          reject(new Error('Invalid image format'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(blob);
    });

    // Add timeout to fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    // Use custom prompt if provided, otherwise use the default system prompt
    const systemPrompt = customPrompt || `You are an expert financial analyst and trading advisor specializing in technical analysis, market psychology, and risk management. Your analysis must be clear, decisive, and consistent across timeframes.

Your analysis should be thorough and consider the relationships between different timeframes:


1. TIMEFRAME ANALYSIS RULES
- Higher timeframe (4H/1D/1W):
  • Establish primary market structure and trend
  • Identify major support/resistance zones
  • Determine overall market bias
  • Look for key reversal patterns

- Medium timeframe (H1/M30):
  • Confirm trend continuation/reversal
  • Find potential entry zones
  • Validate support/resistance levels
  • Monitor momentum shifts

- Lower timeframe (M1/M5/M15):
  • Precise entry/exit timing
  • Stop loss placement
  • Local price action patterns
  • Volume confirmation

2. CORRELATION ANALYSIS
- Compare price action across timeframes:
  • Higher highs/lower lows alignment
  • Trend direction consistency
  • Support/resistance overlap
  • Volume profile correlation

- Momentum alignment:
  • RSI trends across timeframes
  • MACD signal convergence
  • Moving average relationships
  • Volume trend confirmation

3. MOVEMENT ANALYSIS RULES
For each timeframe:
- Exact price range with numbers
- Specific trend characteristics
- Key level interactions
- Pattern formations
- Volume behavior
- Momentum indicators

4. SIGNAL GENERATION
- Primary trend from higher timeframe
- Entry confirmation from medium timeframe
- Timing from lower timeframe
- Multiple timeframe momentum alignment
- Volume confirmation across scales

4. RISK ASSESSMENT
- Position sizing based on timeframe
- Stop loss placement strategy
- Take profit target selection
- Maximum spread considerations
- Correlation-based exposure limits

Extract the following information from the provided chart image:

If the result indicates N/A or not clear or something or No clear patterns or No divergence signals are present or similar do not include it in the final result.

1. MARKET CONTEXT
- Symbol/Asset (exact pair)
- Timeframe (specific format)
- Current price (exact number)
- Key price levels (specific numbers)
- Market structure (clear definition)
- Volatility conditions (quantified)

2. ANALYSIS CONFIDENCE
Calculate and display confidence level (0-100%) based on:
- Pattern Clarity (0-25%): How clear and well-defined are the chart patterns
- Technical Alignment (0-25%): How well do different indicators align
- Volume Confirmation (0-25%): Does volume support the analysis
- Market Context (0-25%): How clear is the overall market structure

Sum all factors and output exactly as: "Confidence Level: X%" where X is the total percentage.
Example: "Confidence Level: 75%"

3. TECHNICAL ANALYSIS
- Exact price movements with numbers
- Specific trend direction and strength
- Precise support/resistance levels
- Volume analysis with context
- Clear pattern identification
- Candlestick formations

4. TECHNICAL INDICATORS ANALYSIS

**TECHNICAL INDICATORS RULES**
   - ONLY list indicators that are explicitly labeled in the chart
   - Common indicators to look for:
     • Volume SMA (if volume bars/histogram present)
     • Moving Averages (only if numbered, e.g., MA 7, MA 25, MA 99)
     • Bollinger Bands
     • Stochastic Oscillator
     • Average True Range (ATR)
     • Relative Strength Index (RSI)
     • MACD (Moving Average Convergence Divergence)
     • Ichimoku Cloud
     • Fibonacci Retracement/Extension
     • ADX (Average Directional Index)
     • OBV (On Balance Volume)
     • Williams %R
     • Parabolic SAR
     • CCI (Commodity Channel Index)
   - DO NOT mention or include:
     • RSI if not explicitly shown and labeled in the chart
     • MACD if not explicitly shown and labeled in the chart
     • Any indicators not clearly visible
   - If no technical indicators are visible in the chart:
     • COMPLETELY OMIT the entire "TECHNICAL INDICATORS" section
     • DO NOT include any text like "No technical indicators are visible" or similar
     • Skip directly to the Trading Signal section
   - Do not hallucinate indicator values - only report what is clearly visible in the image

3. SIGNAL GENERATION
- Primary trend from higher timeframe
- Entry confirmation from medium timeframe
- Timing from lower timeframe
- Multiple timeframe momentum alignment
- Volume confirmation across scales

4. RISK ASSESSMENT
- Position sizing based on timeframe
- Stop loss placement strategy
- Take profit target selection
- Maximum spread considerations
- Correlation-based exposure limits

Extract the following information from the provided chart image:

If the result indicates N/A or not clear or something or No clear patterns or No divergence signals are present or similar do not include it in the final result.

1. MARKET CONTEXT
- Symbol/Asset (exact pair)
- Timeframe (specific format)
- Current price (exact number)
- Key price levels (specific numbers)
- Market structure (clear definition)
- Volatility conditions (quantified)

2. ANALYSIS CONFIDENCE
Calculate and display confidence level (0-100%) based on:
- Pattern Clarity (0-25%): How clear and well-defined are the chart patterns
- Technical Alignment (0-25%): How well do different indicators align
- Volume Confirmation (0-25%): Does volume support the analysis
- Market Context (0-25%): How clear is the overall market structure

Sum all factors and output exactly as: "Confidence Level: X%" where X is the total percentage.
Example: "Confidence Level: 75%"

3. TECHNICAL ANALYSIS
- Exact price movements with numbers
- Specific trend direction and strength
- Precise support/resistance levels
- Volume analysis with context
- Clear pattern identification
- Candlestick formations

4. TECHNICAL INDICATORS ANALYSIS

**TECHNICAL INDICATORS**
[REMOVE THIS ENTIRE SECTION if no technical indicators are visible in the chart]
[Only include indicators that are explicitly labeled and visible in the chart image]
{{ ... }}

Format your response exactly like this:

🤖 **AI ANALYSIS**
Symbol: [Exact trading pair]
Timeframe: [Specific format: 1  1M/5M/15M/1H/4H/1D/1W/1M/6M/1Y]
---
📊 **MARKET SUMMARY**
- **  Current Price:** [Exact number]
- **Support Levels:** [Specific numbers]
- **Resistance Levels:** [Specific numbers]
- **Market Structure:** [Clear trend definition]
- **Volatility:** [Quantified condition]
---
📈 **TECHNICAL ANALYSIS**
- **Price Movement:** [Detailed analysis including:]
- **Exact price range and direction**
- **Specific chart patterns**
- **Key breakout/breakdown levels**
- **Volume confirmation**
- **Trend strength assessment**
- **Market structure analysis**
---

[⚠️ IMPORTANT: IF NO TECHNICAL INDICATORS ARE VISIBLE IN THE CHART, COMPLETELY SKIP THE FOLLOWING SECTION INCLUDING THE HEADER AND GO DIRECTLY TO THE TRADING SIGNAL SECTION. DO NOT WRITE ANY TEXT ABOUT MISSING INDICATORS.]

**TECHNICAL INDICATORS**
[Only include indicators that are explicitly labeled and visible in the chart image]

- 🎯 **RSI INDICATOR** [ONLY if RSI is explicitly shown and labeled in the chart]
- **Current Values:** [Exact numbers]
- **Signal:** [Clear direction]
- **Analysis:** [Detailed interpretation]

- 📊 **MACD INDICATOR** [ONLY if MACD is explicitly shown and labeled in the chart]
- **Current Values:** [Exact numbers]
- **Signal:** [Clear direction]
- **Analysis:** [Detailed interpretation]

- 📈 **BOLLINGER BANDS** [ONLY if Bollinger Bands are explicitly shown in the chart]
- **Current Values:** [Width/Volatility assessment]
- **Signal:** [Clear direction]
- **Analysis:** [Detailed interpretation]

- 📉 **STOCHASTIC OSCILLATOR** [ONLY if Stochastic is explicitly shown in the chart]
- **Current Values:** [K and D line values]
- **Signal:** [Clear direction]
- **Analysis:** [Detailed interpretation]

- 📊 **OTHER INDICATOR** [ONLY if other technical indicators are explicitly shown]
- **Indicator:** [Type of indicator]
- **Current Values:** [Exact numbers]
- **Signal:** [Clear direction]
- **Analysis:** [Detailed interpretation]
---
💡 **TRADING SIGNAL**
- **Action:** [BUY/SELL/HOLD]
- **Entry Price:** [Exact level if BUY/SELL]
- **Stop Loss:** [Specific price]
- **Take Profit:** [Specific target]
---
📈**Signal Reasoning:**
- **Technical justification**
- **Multiple timeframe context**
- **Risk/reward analysis**
- **Market structure alignment**
- **Volume confirmation**
---
⚠️**Risk Assessment:**
- **Position size calculation**
- **Volatility consideration**
- **Invalidation scenarios**
- **Key risk levels**
---
Confidence Level: [Only for BUY/SELL]`;

    const userPrompt = `Please analyze this forex chart image and provide a detailed technical analysis following the specified format. Focus on identifying key support and resistance levels, trend direction, and potential trading opportunities. If multiple timeframes are visible, analyze the relationships between them.`;

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

    console.log('🚀 OpenRouter Image Analysis Request:', {
      model: modelId,
      imageDataLength: imageData.length,
      systemPromptLength: systemPrompt.length,
      timestamp: new Date().toISOString()
    });

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
      let errorMessage = `API error: ${apiResponse.status} ${apiResponse.statusText}`;
      let errorData;
      try {
        errorData = await apiResponse.json().catch(() => ({}));
        errorMessage = errorData?.error?.message || errorMessage;
      } catch (e) {
        // Ignore JSON parse error
      }

      const debugInfo = {
        status: apiResponse.status,
        statusText: apiResponse.statusText,
        errorData,
        apiKey: MARKET_ANALYSIS_API_KEY ? 'Present (length: ' + MARKET_ANALYSIS_API_KEY.length + ')' : 'Missing',
        model: modelId,
        processingTime: Date.now() - startTime
      };

      console.error('❌ OpenRouter Image Analysis Error:', debugInfo);
      throw new Error(errorMessage);
    }

    const data = await apiResponse.json();
    if (!apiResponse.ok) {
      const errorData = await apiResponse.json().catch(() => null);
      throw new Error(
        errorData?.error?.message || 
        `OpenRouter API error: ${apiResponse.status} ${apiResponse.statusText}`
      );
    }

    const content = data.choices[0].message.content;

    // Filter out unwanted phrases
    if (content.includes("No clear patterns are visible") || 
        content.includes("No clear reversal or continuation patterns observed")) {
      return "Analysis not available.";
    }

    // Ensure the response has the required sections
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

    console.log('✅ OpenRouter Image Analysis Response:', {
      model: modelId,
      analysisLength: content.length,
      tokensUsed: data.usage?.total_tokens,
      promptTokens: data.usage?.prompt_tokens,
      completionTokens: data.usage?.completion_tokens,
      processingTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    });

    // Deduct tokens only after successful analysis
    try {
      const snapshot = await get(userRef);
      if (!snapshot.exists()) {
        throw new Error('User data not found');
      }

      const userData = snapshot.val();
      const currentTokens = typeof userData.tokens === 'number' ? userData.tokens : 0;

      // Calculate actual token cost based on response token usage if available
      let actualCost = ANALYSIS_COST;
      let inputTokens = 0;
      let outputTokens = 0;
      
      if (data.usage?.total_tokens) {
        inputTokens = data.usage.prompt_tokens;
        outputTokens = data.usage.completion_tokens;
        const baseCosts = MODEL_BASE_COSTS[modelId] || MODEL_BASE_COSTS['openai/gpt-4o-mini'];
        
        // Calculate actual costs
        const actualInputCost = (inputTokens / 1000) * baseCosts.input;
        const actualOutputCost = (outputTokens / 1000) * baseCosts.output;
        const actualTotalCost = actualInputCost + actualOutputCost;
        
        // Convert to tokens (1 USD cent = 1 token for simplicity)
        actualCost = calculateCost(modelId, inputTokens, outputTokens);
        
        console.log('💰 Calculated token cost:', {
          model: modelId,
          inputTokens,
          outputTokens,
          baseCostInput: baseCosts.input,
          baseCostOutput: baseCosts.output,
          calculatedCost: actualCost,
          timestamp: new Date().toISOString()
        });
      }
      
      // Record token usage
      await recordTokenUsage(uid, {
        tokensUsed: actualCost,
        feature: 'analysis',
        model: modelId,
        inputTokens,
        outputTokens,
        metadata: {
          totalTokens: data.usage?.total_tokens || 0,
          imageAnalysis: true
        }
      });
      
      // Update tokens
      await update(userRef, {
        tokens: currentTokens - actualCost,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      // Don't throw here - analysis was successful, just log the error
      console.error('Error updating tokens:', error);
    }
    
    return content;

  } catch (error) {
    console.error('❌ OpenRouter Image Analysis Error:', error);
    throw error;
  } finally {
    // Cleanup code here if needed
  }
}

export async function sendChatMessage(
  messages: Array<{role: string, content: string}> | string, 
  modelId: ModelId, 
  chartAnalysis?: string | null,
  analysisType: string = 'Technical'
): Promise<string> {
  const CHAT_COST = calculateTokenCost(modelId, false);
  
  try {
    // Check if user is authenticated
    if (!auth.currentUser) {
      throw new Error('You must be logged in to use the chat');
    }

    // Check tokens
    const uid = auth.currentUser.uid;
    const userRef = ref(database, `users/${uid}`);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists()) {
      throw new Error('User data not found');
    }

    const userData = snapshot.val();
    const currentTokens = typeof userData.tokens === 'number' ? userData.tokens : 0;

    if (currentTokens < CHAT_COST) {
      throw new Error(`Insufficient tokens. You need ${CHAT_COST} tokens to continue the chat.`);
    }

    let requestMessages;
    
    // Handle both string message and array of messages
    if (typeof messages === 'string') {
      // Original implementation for backward compatibility
      const systemMessage = `You are an expert trading analyst and advisor. The user has requested a ${analysisType} analysis. 
  ${chartAnalysis ? 'Here is the current analysis:\n\n' + chartAnalysis : ''}
  
  Provide a detailed professional analysis formatted EXACTLY like this:
  # Summary
  - Current Price: [price]
  - Market Structure: [structure]
  - Key Levels: Support at [support1] and [support2]; Resistance at [resistance1] and [resistance2]
  - Overall Sentiment: [sentiment]
  - Volatility Status: [volatility]
  
  Use # for bold text and ensure consistent formatting. All values should be specific and precise.`;

      requestMessages = [
        { role: 'system', content: systemMessage },
        { role: 'user', content: messages }
      ];
    } else {
      // New implementation for array of messages
      // Add system message if not already present
      if (!messages.some(msg => msg.role === 'system')) {
        const systemMessage = `You are an expert trading analyst and advisor.
${chartAnalysis ? 'Here is the current analysis:\n\n' + chartAnalysis : ''}`;
        
        requestMessages = [
          { role: 'system', content: systemMessage },
          ...messages
        ];
      } else {
        requestMessages = messages;
      }
    }

    const requestBody = {
      model: modelId,
      max_tokens: 4000,
      temperature: 0.7,
      messages: requestMessages
    };

    console.log('🚀 OpenRouter API Request:', {
      model: modelId,
      messageCount: Array.isArray(messages) ? messages.length : 1,
      timestamp: new Date().toISOString()
    });

    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: getOpenRouterHeaders(),
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      let errorMessage = `API error: ${response.status} ${response.statusText}`;
      let errorData;
      try {
        errorData = await response.json();
        errorMessage = errorData.error?.message || errorMessage;
      } catch (e) {
        // Ignore JSON parse error
      }
      
      const debugInfo = {
        status: response.status,
        statusText: response.statusText,
        errorData,
        apiKey: MARKET_ANALYSIS_API_KEY ? 'Present (length: ' + MARKET_ANALYSIS_API_KEY.length + ')' : 'Missing',
        model: modelId
      };
      
      console.error('❌ OpenRouter API Error:', debugInfo);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('📄 OpenRouter API Response Data:', data);
    if (!data.choices?.[0]?.message?.content) {
      console.error('❌ Invalid API Response:', data);
      throw new Error('Invalid API response');
    }

    const reply = data.choices[0].message.content;

    console.log('✅ OpenRouter API Response:', {
      model: modelId,
      replyLength: reply.length,
      tokensUsed: data.usage?.total_tokens,
      promptTokens: data.usage?.prompt_tokens,
      completionTokens: data.usage?.completion_tokens,
      timestamp: new Date().toISOString()
    });

    // Calculate actual token cost based on response token usage if available
    let actualCost = CHAT_COST;
    let inputTokens = 0;
    let outputTokens = 0;
    
    if (data.usage?.total_tokens) {
      inputTokens = data.usage.prompt_tokens;
      outputTokens = data.usage.completion_tokens;
      const baseCosts = MODEL_BASE_COSTS[modelId] || MODEL_BASE_COSTS['openai/gpt-4o-mini'];
      
      const actualInputCost = (inputTokens / 1000) * baseCosts.input;
      const actualOutputCost = (outputTokens / 1000) * baseCosts.output;
      const actualTotalCost = actualInputCost + actualOutputCost;
      
      // Convert to tokens (1 USD cent = 1 token for simplicity)
      actualCost = calculateCost(modelId, inputTokens, outputTokens);
      
      // Log the calculated cost
      console.log('💰 Calculated token cost:', {
        model: modelId,
        inputTokens,
        outputTokens,
        baseCostInput: baseCosts.input,
        baseCostOutput: baseCosts.output,
        calculatedCost: actualCost,
        timestamp: new Date().toISOString()
      });
    }
    
    // Record token usage
    await recordTokenUsage(uid, {
      tokensUsed: actualCost,
      feature: 'chat',
      model: modelId,
      inputTokens,
      outputTokens,
      metadata: {
        totalTokens: data.usage?.total_tokens || 0,
        hasChartAnalysis: !!chartAnalysis,
        analysisType
      }
    });

    // Update tokens
    await update(userRef, {
      tokens: currentTokens - actualCost,
      updatedAt: new Date().toISOString()
    });

    return reply;

  } catch (error) {
    console.error('❌ OpenRouter API Error:', error);
    throw error;
  }
}