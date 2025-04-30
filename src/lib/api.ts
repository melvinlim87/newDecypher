import { auth, database, recordTokenUsage } from './firebase';
import { ref, push, get, set, update } from 'firebase/database';
import { getAuthHeader } from '../utils/auth';
import { calculateCost, calculateTokenCost, MODEL_BASE_COSTS } from '../services/modelUtils';

interface GenerateEACodeParams {
  message: string;
  imageData?: string;
  previousMessages: Array<{ role: 'user' | 'assistant'; content: string }>;
  signal: AbortSignal;
  modelId?: string;
}
interface GenerateEACodeResponse {
  success: boolean;
  content?: string;
  error?: string;
}

export async function generateEACode({
  message,
  imageData,
  previousMessages,
  signal,
  modelId = 'anthropic/claude-3-haiku'
}: GenerateEACodeParams): Promise<GenerateEACodeResponse> {
  try {
    // Check if user is authenticated
    if (!auth.currentUser) {
      return {
        success: false,
        error: 'You must be logged in to generate EA code.'
      };
    }

    // Check for sufficient tokens
    const EA_COST = calculateTokenCost(modelId, true); // Use analysis cost since EA generation is more intensive
    const uid = auth.currentUser.uid;
    const userRef = ref(database, `users/${uid}`);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists()) {
      return {
        success: false,
        error: 'User data not found. Please refresh and try again.'
      };
    }

    const userData = snapshot.val();
    const currentTokens = typeof userData.tokens === 'number' ? userData.tokens : 0;

    if (currentTokens < EA_COST) {
      return {
        success: false,
        error: `Insufficient tokens. You need ${EA_COST} tokens to generate EA code. Please purchase more tokens.`
      };
    }

    const messages = [
      {
        role: 'system',
        content: `You are an expert trading strategy analyst and friendly AI assistant. Your goal is to help traders develop complete and robust trading strategies through natural conversation. Engage with users in a helpful and conversational way, while guiding them to provide all necessary strategy details.

You are an expert trading strategy analyst and MQL/PineScript developer with years of experience implementing algorithmic trading systems. Your goal is to help traders develop complete, robust, and properly coded trading strategies through natural conversation.

When users share their trading ideas or code snippets:

1. INITIAL ASSESSMENT
   - Acknowledge their input in a friendly, conversational manner
   - Identify what strategy components are present or missing
   - Note any technical issues or potential improvements in their approach

2. STRATEGY DEVELOPMENT GUIDANCE
   - Help users refine their entry/exit logic with specific market examples
   - Suggest complementary indicators or filters that could improve their system
   - Guide them to consider market conditions where their strategy might underperform

3. CODE QUALITY STANDARDS
   When generating or reviewing code, ensure:
   - Proper error handling and defensive programming
   - Clear variable naming and consistent formatting
   - Efficient execution (avoid unnecessary calculations in loops)
   - Comprehensive comments explaining the strategy logic
   - Proper risk management implementation

4. LANGUAGE-SPECIFIC REQUIREMENTS
   - ALWAYS ask which language they prefer (PineScript, MQL4, MQL5) before generating code
   - For MQL4/5: Include proper function headers, risk calculation, and order management
   - For PineScript: Use appropriate version syntax and built-in functions

5. COMPLETE STRATEGY COMPONENTS
   Ensure these elements are addressed through conversation:

   a) INDICATOR CONFIGURATION
      - Parameter optimization guidelines
      - Appropriate timeframes for each indicator
      - Handling of repainting indicators

   b) ENTRY RULES
      - Primary and confirmation signals
      - Proper order execution with slippage handling
      - Entry filters based on market conditions

   c) EXIT RULES
      - Dynamic take profit and stop loss placement
      - Trailing stop implementation details
      - Time-based exits when appropriate

   d) RISK MANAGEMENT
      - Position sizing based on account risk percentage
      - Proper lot calculation formulas specific to the instrument
      - Maximum open positions and correlation handling

   e) BACKTESTING CONSIDERATIONS
      - Guidance on avoiding common optimization pitfalls
      - Suggestions for out-of-sample testing
      - Reality checks on strategy performance expectations

When users provide incomplete strategies, help them fill gaps through engaging questions rather than pointing out flaws. Each code example you provide should be complete enough to be immediately usable, properly handling edge cases and containing all necessary risk management components.

Remember to explain WHY certain practices are recommended, providing educational context alongside your code examples.
You are an expert trading strategy analyst and friendly AI assistant. Your goal is to help traders develop complete and robust trading strategies through natural conversation. 

IMPORTANT: NEVER generate trading code immediately when asked. Always have a conversation first and gather necessary information.

INTERACTION FLOW:
1. When a user mentions a trading strategy or requests code:
   - First, acknowledge their request in a conversational manner
   - Ask clarifying questions about their strategy concept
   - EXPLICITLY ask which language they want to use, limiting options to:
     * PineScript (for TradingView)
     * MQL4 (for MetaTrader 4)
     * MQL5 (for MetaTrader 5)
   - DO NOT proceed with code generation until they've specified one of these three languages

2. For strategy development, have a conversation to gather:
   - Indicator choices and their specific parameters
   - Entry conditions with specific trigger points
   - Exit methods (take profit, stop loss, trailing stop)
   - Risk management approach (position sizing, max risk per trade)

3. When the user has provided sufficient details AND specified their preferred language:
   - Generate well-structured, properly commented code
   - Include proper risk management in every code example
   - Explain key parts of the implementation

LANGUAGE-SPECIFIC CONSIDERATIONS:
- For PineScript: Use appropriate Pine version syntax and built-in functions
- For MQL4: Include proper function headers and MetaTrader 4 specific functions
- For MQL5: Utilize object-oriented approaches when appropriate for MetaTrader 5

Always maintain a helpful, educational tone and avoid jargon unless the user demonstrates technical knowledge. Remember that your primary goal is to help users develop safe, well-tested trading strategies through conversation before providing any code.
`
      },
      ...previousMessages,
      {
        role: 'user',
        content: imageData 
          ? [
              { type: 'text', text: message },
              { type: 'image_url', image_url: imageData }
            ]
          : message
      }
    ];

    // Add timeout to fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
        'Referer': 'https://aimarketanalyzer.netlify.app',
        'X-Title': 'AI Market Analyst'
      },
      body: JSON.stringify({
        model: modelId || 'anthropic/claude-3-haiku',
        messages,
        temperature: 0.7,
        max_tokens: 4000,
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        error: errorData
      });
      throw new Error(`API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    if (!data?.choices?.[0]?.message?.content) {
      console.error('Invalid API Response:', data);
      throw new Error('An error occurred while processing your request. Please try again.');
    }

    // Get response content
    const content = data.choices[0].message.content;
    
    // Calculate actual token cost based on response token usage if available
    let actualCost = EA_COST;
    let inputTokens = 0;
    let outputTokens = 0;
    
    if (data.usage?.total_tokens) {
      inputTokens = data.usage.prompt_tokens;
      outputTokens = data.usage.completion_tokens;
      const baseCosts = MODEL_BASE_COSTS[modelId] || MODEL_BASE_COSTS['anthropic/claude-3-haiku'];
      
      // Calculate actual cost using the token calculator
      actualCost = calculateCost(modelId, inputTokens, outputTokens);
      
      // Log the calculated cost
      console.log('💰 EA Generator token cost:', {
        model: modelId,
        inputTokens,
        outputTokens,
        calculatedCost: actualCost,
        timestamp: new Date().toISOString()
      });
    }
    
    // Record token usage
    await recordTokenUsage(uid, {
      tokensUsed: actualCost,
      feature: 'ea-generator',
      model: modelId,
      inputTokens,
      outputTokens,
      metadata: {
        totalTokens: data.usage?.total_tokens || 0,
        messageCount: previousMessages.length + 1,
        hasImage: !!imageData
      }
    });

    // Deduct tokens from user's account
    await update(userRef, {
      tokens: currentTokens - actualCost,
      updatedAt: new Date().toISOString()
    });

    // Save EA generation to history
    // [This part remains unchanged]

    return {
      success: true,
      content: content
    };
  } catch (error) {
    // Handle network errors
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      return {
        success: false,
        error: 'Network error. Please check your internet connection and try again.\n\n' +
               'If the problem persists, please try:\n' +
               '1. Refreshing the page\n' +
               '2. Using a different internet connection\n' +
               '3. Trying again in a few minutes'
      };
    }

    // Handle timeout errors
    if (error.name === 'AbortError') {
      return {
        success: false,
        error: 'The request took too long to complete. Please try:\n\n' +
               '1. Making your request more specific\n' +
               '2. Breaking complex requests into smaller parts\n' +
               '3. Trying again in a few minutes'
      };
    }

    // Handle other errors
    console.error('EA Generation Error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while processing your request. Please try again.'
    };
  }
}