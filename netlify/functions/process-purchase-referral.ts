import { Handler } from '@netlify/functions';
import { getDatabase } from 'firebase-admin/database';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Validate required environment variables
const requiredEnvVars = [
  'FIREBASE_ADMIN_PROJECT_ID',
  'FIREBASE_ADMIN_CLIENT_EMAIL',
  'FIREBASE_ADMIN_PRIVATE_KEY',
  'FIREBASE_ADMIN_DATABASE_URL',
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  throw new Error('Server configuration error: Missing required environment variables');
}

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

interface PurchaseReferralRequest {
  userId: string;
  purchaseAmount: number;
  purchaseTokens: number;
}

const handler: Handler = async (event) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parse request body
    const requestBody: PurchaseReferralRequest = JSON.parse(event.body || '{}');
    const { userId, purchaseAmount, purchaseTokens } = requestBody;

    // Validate request data
    if (!userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Missing required field: userId is required' 
        }),
      };
    }

    console.log(`Processing purchase referral bonus for user ${userId}`);

    // Find if this user was referred by someone
    const userRef = db.ref(`users/${userId}`);
    const userSnapshot = await userRef.once('value');
    
    if (!userSnapshot.exists()) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'User not found' 
        }),
      };
    }

    const userData = userSnapshot.val();
    
    // Check if user has a referrer
    if (!userData.referredBy) {
      console.log(`User ${userId} was not referred by anyone. No bonus to award.`);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          message: 'No referrer found for this user',
          bonusAwarded: false
        }),
      };
    }

    const referrerId = userData.referredBy;
    console.log(`Found referrer: ${referrerId}`);

    // Check if this is the user's first purchase (to avoid giving bonus multiple times)
    const purchaseHistoryRef = db.ref(`users/${userId}/purchases`);
    const purchaseSnapshot = await purchaseHistoryRef.once('value');
    const purchases = purchaseSnapshot.val() || {};
    const purchaseCount = Object.keys(purchases).length;

    // If this is not the first purchase, don't award bonus
    if (purchaseCount > 1) {
      console.log(`This is not the user's first purchase. No bonus to award.`);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          message: 'Not the first purchase, no bonus awarded',
          bonusAwarded: false
        }),
      };
    }

    // Get referrer data
    const referrerRef = db.ref(`users/${referrerId}`);
    const referrerSnapshot = await referrerRef.once('value');
    
    if (!referrerSnapshot.exists()) {
      console.log(`Referrer ${referrerId} not found. No bonus to award.`);
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Referrer not found' 
        }),
      };
    }

    const referrerData = referrerSnapshot.val();
    
    // Award 2,000 tokens to the referrer
    const bonusTokens = 2000;
    const currentReferrerTokens = referrerData.tokens || 0;
    
    // Add to referrer's purchase history
    const referrerHistoryRef = db.ref(`users/${referrerId}/purchaseHistory`);
    const referrerHistorySnapshot = await referrerHistoryRef.once('value');
    const referrerHistory = referrerHistorySnapshot.exists() ? referrerHistorySnapshot.val() : [];
    
    const newHistoryEntry = {
      type: 'referral_purchase_bonus',
      tokens: bonusTokens,
      description: 'Referral Bonus: Your referred friend made their first purchase',
      timestamp: new Date().toISOString()
    };
    
    referrerHistory.push(newHistoryEntry);
    
    // Update referrer with new tokens
    await referrerRef.update({
      tokens: currentReferrerTokens + bonusTokens,
      purchaseHistory: referrerHistory,
      updatedAt: new Date().toISOString()
    });
    
    console.log(`Added ${bonusTokens} bonus tokens to referrer ${referrerId}`);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: 'Referral purchase bonus processed successfully',
        referrerId,
        bonusTokens,
        bonusAwarded: true
      }),
    };
  } catch (error) {
    console.error('Error processing referral purchase bonus:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: 'Failed to process referral purchase bonus',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};

export { handler };
