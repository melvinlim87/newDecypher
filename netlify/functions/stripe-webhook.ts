import { Handler } from '@netlify/functions';
import Stripe from 'stripe';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

// Validate required environment variables
const requiredEnvVars = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'FIREBASE_ADMIN_PROJECT_ID',
  'FIREBASE_ADMIN_CLIENT_EMAIL',
  'FIREBASE_ADMIN_PRIVATE_KEY',
  'FIREBASE_ADMIN_DATABASE_URL',
  'VITE_STRIPE_PRICE_7000_TOKENS',
  'VITE_STRIPE_PRICE_40000_TOKENS',
  'VITE_STRIPE_PRICE_100000_TOKENS',
  'VITE_STRIPE_PRICE_10_TOKENS',
  'VITE_STRIPE_PRICE_50_TOKENS',
  'VITE_STRIPE_PRICE_100_TOKENS'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  throw new Error('Server configuration error: Missing required environment variables');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

// Initialize Firebase Admin
if (!getApps().length) {
  console.log('Initializing Firebase Admin');
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      databaseURL: process.env.FIREBASE_ADMIN_DATABASE_URL,
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
    throw error;
  }
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
  console.log('Received webhook event:', {
    method: event.httpMethod,
    contentType: event.headers['content-type'],
    signature: event.headers['stripe-signature'] ? 'Present' : 'Missing',
    stripeKeySet: !!process.env.STRIPE_SECRET_KEY,
    webhookSecretSet: !!process.env.STRIPE_WEBHOOK_SECRET,
    tokenAmountsKeys: Object.keys(TOKEN_AMOUNTS),
  });

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method not allowed' }),
    };
  }

  // Verify webhook signature
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Webhook secret not configured' }),
    };
  }

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body || '',
      event.headers['stripe-signature'] || '',
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return {
      statusCode: 400,
      body: JSON.stringify({ message: `Webhook signature verification failed: ${error instanceof Error ? error.message : 'Unknown error'}` }),
    };
  }

  console.log('Webhook event verified:', {
    type: stripeEvent.type,
    id: stripeEvent.id,
  });

  // Handle the event
  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;
    console.log('Checkout session completed:', {
      id: session.id,
      paymentStatus: session.payment_status,
      metadata: session.metadata,
    });

    // Verify payment status
    if (session.payment_status !== 'paid') {
      console.log('Payment not completed:', session.payment_status);
      return {
        statusCode: 200, // Return 200 to acknowledge receipt
        body: JSON.stringify({ message: 'Payment not completed, no action taken' }),
      };
    }

    // Get user ID from metadata
    const userId = session.metadata?.userId;
    if (!userId) {
      console.error('No user ID found in session metadata');
      return {
        statusCode: 200, // Return 200 to acknowledge receipt
        body: JSON.stringify({ message: 'No user ID found in session metadata' }),
      };
    }

    // Determine token amount to add
    let tokensToAdd = 0;
    
    try {
      // First try to get line items directly
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
      console.log('Line items:', lineItems.data.map(item => ({
        priceId: item.price?.id,
        amount: item.amount_total / 100,
        quantity: item.quantity,
      })));
      
      // Find the corresponding token amount for each line item
      for (const item of lineItems.data) {
        const priceId = item.price?.id;
        if (priceId && TOKEN_AMOUNTS[priceId]) {
          tokensToAdd += TOKEN_AMOUNTS[priceId] * (item.quantity || 1);
        } else {
          console.warn('Unknown price ID in line items:', priceId);
        }
      }
      
      console.log('Tokens to add from line items:', tokensToAdd);
    } catch (error) {
      console.error('Error retrieving line items:', error);
      // Fallback to metadata if line items retrieval fails
      const priceId = session.metadata?.price_id;
      if (priceId && TOKEN_AMOUNTS[priceId]) {
        tokensToAdd = TOKEN_AMOUNTS[priceId];
        console.log('Tokens to add from metadata fallback:', tokensToAdd);
      } else {
        console.error('Could not determine token amount from price ID:', priceId);
      }
    }
    
    // If we still couldn't determine the token amount, return an error
    if (tokensToAdd === 0) {
      console.error('Could not determine token amount to add', {
        availablePriceIds: Object.keys(TOKEN_AMOUNTS),
        sessionMetadata: session.metadata,
      });
      return {
        statusCode: 200, // Return 200 to acknowledge receipt
        body: JSON.stringify({ message: 'Could not determine token amount to add' }),
      };
    }

    // Update user's tokens in Firebase
    const userRef = db.ref(`users/${userId}`);
    
    try {
      // Get current user data
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
          body: JSON.stringify({
            received: true,
            alreadyProcessed: true,
          }),
        };
      }

      console.log('Current user data:', {
        userId,
        currentTokens,
        newTokens: currentTokens + tokensToAdd,
      });

      // Prepare updates for both user data and purchase history
      const multiUpdate = {};
      
      // Update user data
      multiUpdate[`users/${userId}/tokens`] = currentTokens + tokensToAdd;
      multiUpdate[`users/${userId}/email`] = userData.email || session.customer_details?.email;
      
      // Store customer name if available
      const customerName = session.metadata?.customer_name || session.customer_details?.name;
      if (customerName && !userData.displayName) {
        multiUpdate[`users/${userId}/displayName`] = customerName;
      }
      
      multiUpdate[`users/${userId}/updatedAt`] = new Date().toISOString();
      multiUpdate[`users/${userId}/lastPurchase`] = {
        amount: tokensToAdd,
        timestamp: new Date().toISOString(),
        sessionId: session.id,
        priceId: session.metadata?.price_id,
      };

      // Add purchase history with customer details
      multiUpdate[`users/${userId}/purchaseHistory/${session.id}`] = {
        amount: tokensToAdd,
        currency: "USD",
        price: (lineItems.data[0]?.amount_total || 0) / 100, // Convert from cents to dollars
        priceId: session.metadata?.price_id,
        sessionId: session.id,
        timestamp: new Date().toISOString(),
        customerEmail: session.customer_details?.email || session.metadata?.customer_email || '',
        customerName: session.customer_details?.name || session.metadata?.customer_name || ''
      };

      // Update everything atomically
      await db.ref().update(multiUpdate);
      console.log('Successfully updated tokens and purchase history:', {
        userId,
        previousTokens: currentTokens,
        addedTokens: tokensToAdd,
        newTotal: currentTokens + tokensToAdd,
      });

      // Verify the update
      const verifySnapshot = await userRef.once('value');
      const updatedData = verifySnapshot.val();
      if (updatedData.tokens !== (currentTokens + tokensToAdd)) {
        throw new Error('Token update verification failed');
      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          received: true,
          userId,
          tokensAdded: tokensToAdd,
          newTotal: currentTokens + tokensToAdd,
        }),
      };
    } catch (dbError) {
      console.error('Firebase update error:', dbError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Internal server error' }),
      };
    }
  }

  // Handle other event types
  return {
    statusCode: 200,
    body: JSON.stringify({ received: true }),
  };
};