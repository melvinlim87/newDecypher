import { Handler } from '@netlify/functions';
import Stripe from 'stripe';

// Validate required environment variables
const requiredEnvVars = [
  'STRIPE_SECRET_KEY',
  'VITE_STRIPE_PUBLISHABLE_KEY',
  'VITE_STRIPE_PRICE_10_TOKENS',
  'VITE_STRIPE_PRICE_50_TOKENS',
  'VITE_STRIPE_PRICE_100_TOKENS',
  'VITE_STRIPE_PRICE_7000_TOKENS',
  'VITE_STRIPE_PRICE_40000_TOKENS',
  'VITE_STRIPE_PRICE_100000_TOKENS'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

// Valid price IDs from environment variables
const validPriceIds = [
  process.env.VITE_STRIPE_PRICE_10_TOKENS,
  process.env.VITE_STRIPE_PRICE_50_TOKENS,
  process.env.VITE_STRIPE_PRICE_100_TOKENS,
  process.env.VITE_STRIPE_PRICE_7000_TOKENS,
  process.env.VITE_STRIPE_PRICE_40000_TOKENS,
  process.env.VITE_STRIPE_PRICE_100000_TOKENS
].filter(Boolean);

export const handler: Handler = async (event) => {
  console.log('Received create-checkout request:', {
    method: event.httpMethod,
    body: event.body,
    url: process.env.URL,
    stripeKeySet: !!process.env.STRIPE_SECRET_KEY,
    validPriceIds,
  });

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method not allowed' }),
    };
  }

  try {
    const { priceId, userId, customerInfo } = JSON.parse(event.body || '{}');
    console.log('Parsed request body:', { priceId, userId, customerInfo });

    if (!priceId || !userId) {
      console.error('Missing parameters:', { priceId, userId });
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required parameters' }),
      };
    }

    // Validate price ID
    if (!validPriceIds.includes(priceId)) {
      console.error('Invalid price ID:', { priceId, validPriceIds });
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid price ID' }),
      };
    }

    if (!process.env.URL) {
      console.error('URL environment variable is not set');
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Server configuration error: URL not set' }),
      };
    }

    // Verify that the price exists in Stripe
    try {
      const price = await stripe.prices.retrieve(priceId);
      console.log('Retrieved price from Stripe:', {
        id: price.id,
        active: price.active,
        currency: price.currency,
      });
      
      if (!price.active) {
        throw new Error('Price is not active');
      }
    } catch (error) {
      console.error('Error retrieving price from Stripe:', error);
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid or inactive price ID' }),
      };
    }

    console.log('Creating checkout session with:', {
      priceId,
      userId,
      customerInfo,
      successUrl: `${process.env.URL}/profile?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${process.env.URL}/profile`,
    });

    // Create a customer first if we have customer info
    let customerId;
    if (customerInfo?.email) {
      console.log('Creating or retrieving customer with info:', {
        email: customerInfo.email,
        name: customerInfo.name || undefined
      });
      
      try {
        // Search for existing customers with this email
        const customers = await stripe.customers.list({
          email: customerInfo.email,
          limit: 1
        });
        
        if (customers.data.length > 0) {
          // Update existing customer
          customerId = customers.data[0].id;
          await stripe.customers.update(customerId, {
            name: customerInfo.name || undefined
          });
          console.log('Updated existing customer:', customerId);
        } else {
          // Create new customer
          const customer = await stripe.customers.create({
            email: customerInfo.email,
            name: customerInfo.name || undefined,
            metadata: {
              userId
            }
          });
          customerId = customer.id;
          console.log('Created new customer:', customerId);
        }
      } catch (error) {
        console.error('Error creating/updating customer:', error);
        // Continue without customer ID if there's an error
      }
    }
    
    // Create checkout session with appropriate customer parameters
    // Note: We can't use both customer and customer_creation together
    const sessionConfig: any = {
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.URL}/profile?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.URL}/profile`,
      metadata: {
        userId,
        customer_name: customerInfo?.name || '',
      },
      payment_intent_data: {
        metadata: {
          userId,
          price_id: priceId,
          session_id: '{CHECKOUT_SESSION_ID}',
          customer_name: customerInfo?.name || '',
          customer_email: customerInfo?.email || '',
        }
      }
    };
    
    // Add customer-related parameters based on what we have
    if (customerId) {
      // If we have a customer ID, use it
      sessionConfig.customer = customerId;
    } else if (customerInfo?.email) {
      // If we have an email but no customer ID, let Stripe create a customer
      sessionConfig.customer_email = customerInfo.email;
      sessionConfig.customer_creation = 'always';
    }
    
    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log('Created checkout session:', {
      sessionId: session.id,
      metadata: session.metadata,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ id: session.id }),
    };
  } catch (error) {
    console.error('Stripe error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        message: 'Failed to create checkout session',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};