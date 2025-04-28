import { Handler } from '@netlify/functions';
import Stripe from 'stripe';
import { getDatabase } from 'firebase-admin/database';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Validate required environment variables
const requiredEnvVars = [
  'STRIPE_SECRET_KEY',
  'FIREBASE_ADMIN_PROJECT_ID',
  'FIREBASE_ADMIN_CLIENT_EMAIL',
  'FIREBASE_ADMIN_PRIVATE_KEY',
  'FIREBASE_ADMIN_DATABASE_URL',
  'VITE_STRIPE_PRICE_7000_TOKENS',
  'VITE_STRIPE_PRICE_40000_TOKENS',
  'VITE_STRIPE_PRICE_100000_TOKENS',
  'VITE_STRIPE_PRICE_10_TOKENS',
  'VITE_STRIPE_PRICE_50_TOKENS',
  'VITE_STRIPE_PRICE_100_TOKENS',
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  throw new Error('Server configuration error: Missing required environment variables');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    databaseURL: process.env.FIREBASE_ADMIN_DATABASE_URL,
  });
}

const db = getDatabase();

// Map price IDs to token amounts
const TOKEN_AMOUNTS = {
  [process.env.VITE_STRIPE_PRICE_7000_TOKENS || '']: 7000,  // 7000 tokens
  [process.env.VITE_STRIPE_PRICE_40000_TOKENS || '']: 40000,  // 40000 tokens
  [process.env.VITE_STRIPE_PRICE_100000_TOKENS || '']: 100000, // 100000 tokens
  // Include legacy price IDs for backward compatibility
  [process.env.VITE_STRIPE_PRICE_10_TOKENS || '']: 10,  // 10 tokens
  [process.env.VITE_STRIPE_PRICE_50_TOKENS || '']: 50,  // 50 tokens
  [process.env.VITE_STRIPE_PRICE_100_TOKENS || '']: 100, // 100 tokens
};

export const handler: Handler = async (event) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  console.log('Received verify-session request:', {
    method: event.httpMethod,
    sessionId: event.queryStringParameters?.session_id,
  });

  // Handle OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: '',
      isBase64Encoded: false
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method not allowed' }),
      isBase64Encoded: false
    };
  }

  try {
    const sessionId = event.queryStringParameters?.session_id;
    if (!sessionId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'Session ID is required' }),
        isBase64Encoded: false
      };
    }

    console.log('Retrieving session:', sessionId);
    // Retrieve the session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log('Session details:', {
      id: session.id,
      paymentStatus: session.payment_status,
      metadata: session.metadata,
    });
    
    // Check if payment was successful
    if (session.payment_status !== 'paid') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'Payment not completed', status: session.payment_status }),
        isBase64Encoded: false
      };
    }

    const userId = session.metadata?.userId;
    if (!userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'No user ID found in session metadata' }),
        isBase64Encoded: false
      };
    }

    // Get line items to determine token amount
    console.log('Fetching line items for session:', sessionId);
    const lineItems = await stripe.checkout.sessions.listLineItems(sessionId);
    console.log('Line items:', lineItems.data);

    if (!lineItems.data.length) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'No line items found in session' }),
        isBase64Encoded: false
      };
    }

    const priceId = lineItems.data[0]?.price?.id;
    if (!priceId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'No price ID found in line items' }),
        isBase64Encoded: false
      };
    }

    // Get token amount from price ID
    const tokensToAdd = TOKEN_AMOUNTS[priceId] || 0;
    if (tokensToAdd === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: `Invalid price ID: ${priceId}` }),
        isBase64Encoded: false
      };
    }

    console.log('Token calculation:', {
      priceId,
      tokensToAdd,
      userId,
    });

    // Update user's tokens in Firebase
    const userRef = db.ref(`users/${userId}`);
    try {
      // Get current user data
      console.log('Fetching current user data for:', userId);
      const snapshot = await userRef.once('value');
      const userData = snapshot.val() || {};
      const currentTokens = typeof userData.tokens === 'number' ? userData.tokens : 0;

      // Check if this purchase was already processed
      if (userData.lastPurchase?.sessionId === session.id) {
        console.log('Purchase already processed:', {
          sessionId: session.id,
          lastPurchase: userData.lastPurchase,
        });
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            tokensAdded: userData.lastPurchase.amount,
            newTotal: currentTokens,
            previousTotal: currentTokens - userData.lastPurchase.amount,
            alreadyProcessed: true,
          }),
          isBase64Encoded: false
        };
      }

      console.log('Current user data:', {
        userId,
        currentTokens,
        newTokens: currentTokens + tokensToAdd,
      });

      // Update tokens and store purchase history
      const updates = {
        tokens: currentTokens + tokensToAdd,
        email: userData.email || session.customer_details?.email,
        updatedAt: new Date().toISOString(),
        lastPurchase: {
          amount: tokensToAdd,
          timestamp: new Date().toISOString(),
          sessionId: session.id,
          priceId: priceId,
        },
      };

      // Add to purchase history
      const purchaseData = {
        tokens: TOKEN_AMOUNTS[priceId] || 0, // Use the mapping to get correct token amount
        amount: (lineItems.data[0]?.amount_total || 0) / 100, // Ensure amount is in dollars
        date: new Date().toISOString(),
        status: session.payment_status,
        priceId: priceId,
        customerEmail: session.customer_details?.email,
        currency: lineItems.data[0]?.currency || 'usd' // Add currency
      };

      console.log('Storing purchase history:', purchaseData);
      
      // Update both user data and purchase history atomically
      const multiUpdate = {
        [`users/${userId}/tokens`]: currentTokens + tokensToAdd,
        [`users/${userId}/email`]: userData.email || session.customer_details?.email,
        [`users/${userId}/updatedAt`]: new Date().toISOString(),
        [`users/${userId}/lastPurchase`]: updates.lastPurchase,
        [`users/${userId}/purchases/${session.id}`]: purchaseData,
        [`users/${userId}/purchaseHistory`]: {
          [session.id]: purchaseData
        }
      };

      // Check for referral and add bonus tokens if this is a pro upgrade
      if (userData.referredBy) {
        const referrerRef = db.ref(`users`);
        const referrersSnapshot = await referrerRef.once('value');
        const referrers = referrersSnapshot.val();
        
        // Find the referrer by their referral code
        const referrer = Object.entries(referrers).find(([_, data]: [string, any]) => 
          data.referralCode === userData.referredBy
        );

        if (referrer) {
          const [referrerId, referrerData] = referrer;
          // Add 500 tokens bonus for pro upgrade referral
          const referrerUpdates = {
            tokens: (referrerData.tokens || 0) + 500,
            updatedAt: new Date().toISOString()
          };
          multiUpdate[`users/${referrerId}`] = {
            ...referrerData,
            ...referrerUpdates
          };
        }
      }

      console.log('Updating user data:', multiUpdate);
      await db.ref().update(multiUpdate);

      // Verify the update was successful
      console.log('Verifying update...');
      const verifySnapshot = await userRef.once('value');
      const updatedData = verifySnapshot.val();
      
      if (!verifySnapshot.exists() || updatedData.tokens !== (currentTokens + tokensToAdd)) {
        console.error('Token update verification failed:', {
          expected: currentTokens + tokensToAdd,
          actual: updatedData.tokens,
        });
        throw new Error('Token update verification failed');
      }

      console.log('Update successful:', {
        userId,
        previousTokens: currentTokens,
        addedTokens: tokensToAdd,
        newTotal: currentTokens + tokensToAdd,
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          tokensAdded: tokensToAdd,
          newTotal: currentTokens + tokensToAdd,
          previousTotal: currentTokens,
        }),
        isBase64Encoded: false
      };
    } catch (dbError) {
      console.error('Firebase update error:', dbError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: `Failed to update user data: ${dbError instanceof Error ? dbError.message : 'Unknown error'}` 
        }),
        isBase64Encoded: false
      };
    }
  } catch (error) {
    console.error('Verify session error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: `Verification error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }),
      isBase64Encoded: false
    };
  }
};