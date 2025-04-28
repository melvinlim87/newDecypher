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

interface ReferralRequest {
  referralCode: string;
  userId: string;
  userEmail: string;
  userName: string;
  authProvider: string;
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
    const requestBody: ReferralRequest = JSON.parse(event.body || '{}');
    const { referralCode, userId, userEmail, userName, authProvider } = requestBody;

    // Validate request data
    if (!referralCode || !userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: referralCode and userId are required' 
        }),
      };
    }

    console.log(`Processing referral for user ${userId} with code ${referralCode}`);

    // Find the referrer by the referral code
    const usersRef = db.ref('users');
    const snapshot = await usersRef.orderByChild('referralCode').equalTo(referralCode).once('value');
    
    if (!snapshot.exists()) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Invalid referral code: No user found with this referral code' 
        }),
      };
    }

    // Get referrer data
    let referrerId = null;
    let referrerData = null;
    
    snapshot.forEach((childSnapshot) => {
      referrerId = childSnapshot.key;
      referrerData = childSnapshot.val();
      return true; // Stop iteration after first match
    });

    if (!referrerId || !referrerData) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Failed to process referrer data' 
        }),
      };
    }

    console.log(`Found referrer: ${referrerId}`);
    
    // Get current referral count and referrals
    const currentReferralCount = referrerData.referralCount || 0;
    const newReferralCount = currentReferralCount + 1;
    console.log(`Updating referral count from ${currentReferralCount} to ${newReferralCount}`);
    
    // Add 1,000 tokens for the referral
    const referralTokens = 1000;
    
    // Add to purchase history
    const historyRef = db.ref(`users/${referrerId}/purchaseHistory`);
    const historySnapshot = await historyRef.once('value');
    const currentHistory = historySnapshot.exists() ? historySnapshot.val() : [];
    
    const newHistoryEntry = {
      type: 'referral_bonus',
      tokens: referralTokens,
      description: 'Referral Bonus: Friend signed up using your referral code',
      timestamp: new Date().toISOString()
    };
    
    currentHistory.push(newHistoryEntry);
    
    // Add 100 bonus tokens to the new user
    const newUserRef = db.ref(`users/${userId}`);
    const newUserSnapshot = await newUserRef.once('value');
    
    if (newUserSnapshot.exists()) {
      const newUserData = newUserSnapshot.val();
      const currentTokens = newUserData.tokens || 0;
      const bonusTokens = 100;
      
      // Add bonus tokens to new user's history
      const newUserHistoryRef = db.ref(`users/${userId}/purchaseHistory`);
      const newUserHistorySnapshot = await newUserHistoryRef.once('value');
      const newUserHistory = newUserHistorySnapshot.exists() ? newUserHistorySnapshot.val() : [];
      
      newUserHistory.push({
        type: 'referral_signup_bonus',
        tokens: bonusTokens,
        description: 'Signup Bonus: Registered with a referral code',
        timestamp: new Date().toISOString()
      });
      
      // Update new user's tokens
      await newUserRef.update({
        tokens: currentTokens + bonusTokens,
        purchaseHistory: newUserHistory,
        updatedAt: new Date().toISOString()
      });
      
      console.log(`Added ${bonusTokens} bonus tokens to new user ${userId}`);
    }
    
    // Update referrer with new tokens and referral data
    const updates = {
      [`users/${referrerId}/referralCount`]: newReferralCount,
      [`users/${referrerId}/tokens`]: (referrerData.tokens || 0) + referralTokens,
      [`users/${referrerId}/referrals/${userId}`]: {
        email: userEmail || null,
        name: userName || null,
        joinedAt: new Date().toISOString(),
        authProvider: authProvider || 'email'
      },
      [`users/${referrerId}/purchaseHistory`]: currentHistory,
      [`users/${referrerId}/updatedAt`]: new Date().toISOString()
    };
    
    console.log('Updating referrer with new data');
    await db.ref().update(updates);
    console.log('Successfully updated referrer data');
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: 'Referral processed successfully',
        referrerId,
        referralTokens,
        newUserBonus: 100
      }),
    };
  } catch (error) {
    console.error('Error processing referral:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: 'Failed to process referral',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};

export { handler };
