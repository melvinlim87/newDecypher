import { loadStripe } from '@stripe/stripe-js/pure';
import { Stripe } from '@stripe/stripe-js';
import { API_BASE_URL } from '../config';

let stripePromise: Promise<Stripe | null>;

const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

// Define average base costs (per 1000 tokens) across all models
const AVG_INPUT_COST = 0.005; // $0.005 per 1K input tokens (average across models)
const AVG_OUTPUT_COST = 0.015; // $0.015 per 1K output tokens (average across models)
const AVG_BLENDED_COST = 0.01; // Average cost considering typical input/output mixture

// With 10x profit margin
const PROFIT_MULTIPLIER = 10;
const CUSTOMER_COST_PER_1K = AVG_BLENDED_COST * PROFIT_MULTIPLIER; // $0.10 per 1K tokens

// Tokens per dollar calculation - adjusted to match $10 = 6667 tokens
const TOKENS_PER_DOLLAR = 667; // ~667 tokens per $1



// Calculate package prices with minimum of $10
export const STRIPE_PRICES = {
  BASIC: {
    id: import.meta.env.VITE_STRIPE_PRICE_7000_TOKENS,
    tokens: 7000, // 10 dollars worth of tokens (rounded up from 6667)
    price: 10.00, // Minimum $10 package
    description: `Good for approximately 7,000 tokens of analysis or chat`
  },
  STANDARD: {
    id: import.meta.env.VITE_STRIPE_PRICE_40000_TOKENS,
    tokens: 40000, // 50 dollars worth of tokens (33,350) + 6,650 bonus tokens (20% bonus)
    price: 50.00, 
    description: `Good for approximately 40,000 tokens of analysis or chat (includes bonus tokens!)`
  },
  PREMIUM: {
    id: import.meta.env.VITE_STRIPE_PRICE_100000_TOKENS,
    tokens: 100000, // 100 dollars worth of tokens (66,700) + 33,300 bonus tokens (50% bonus)
    price: 100.00,
    description: `Good for approximately 100,000 tokens of analysis or chat (includes bonus tokens!)`
  }
} as const;

// Log the actual calculated packages


export type TokenPackage = keyof typeof STRIPE_PRICES;

// Helper function to calculate token value in USD
export function calculateTokenValueInUSD(tokens: number): number {
  return tokens / TOKENS_PER_DOLLAR;
}

// Helper function to calculate how many tokens a specific dollar amount would buy
export function calculateTokensFromUSD(usdAmount: number): number {
  return Math.floor(usdAmount * TOKENS_PER_DOLLAR);
}

export async function createCheckoutSession(priceId: string, userId: string, customerInfo?: { name?: string; email?: string }) {
  try {
    // Validate inputs
    if (!priceId) {
      throw new Error('Price ID is required');
    }
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Create checkout session using Laravel backend
    const response = await fetch(`${API_BASE_URL}/stripe/create-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId,
        userId,
        customerInfo,
      }),
    });

    // Handle non-OK responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Server error: ${response.status} ${response.statusText}`
      );
    }

    // Parse session data
    const session = await response.json();
    if (!session.success) {
      throw new Error('Invalid session data received from server');
    }

    // Check if we have a session URL to redirect to
    if (session.sessionUrl) {
      // Use the session URL directly from the backend
      window.location.href = session.sessionUrl;
      return;
    } else if (session.id) {
      // Fallback to client-side redirect if only ID is provided
      const stripe = await getStripe();
      if (!stripe) {
        throw new Error('Stripe failed to initialize. Please check your publishable key.');
      }
      
      const { error } = await stripe.redirectToCheckout({
        sessionId: session.id,
      });

      if (error) {
        console.error('Stripe redirect error:', error);
        throw new Error(error.message || 'Failed to redirect to checkout');
      }
    } else {
      throw new Error('No session URL or ID provided');
    }
  } catch (error) {
    console.error('Stripe checkout error:', error);
    if (error instanceof Error) {
      throw new Error(`Checkout failed: ${error.message}`);
    }
    throw new Error('Failed to initiate checkout. Please try again.');
  }
}

export async function verifyCheckoutSession(sessionId: string) {
  try {
    if (!sessionId) {
      console.error('No session ID provided for verification');
      return { success: false, error: 'No session ID provided' };
    }
    
    console.log('Verifying checkout session:', sessionId);
    const response = await fetch(`${API_BASE_URL}/stripe/verify-session?session_id=${encodeURIComponent(sessionId)}`);
    
    // Handle non-OK responses with more detailed error messages
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Server error during session verification:', errorData);
      return { 
        success: false, 
        error: errorData.error || `Server error: ${response.status} ${response.statusText}` 
      };
    }
    
    const result = await response.json();
    console.log('Session verification result:', result);
    
    if (!result.success) {
      return { success: false, error: result.error || 'Unknown verification error' };
    }
    
    return result;
  } catch (error) {
    console.error('Error verifying session:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to verify session' 
    };
  }
}