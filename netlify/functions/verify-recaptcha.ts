import { Handler } from '@netlify/functions';

const RECAPTCHA_SECRET_KEY = process.env.VITE_RECAPTCHA_SECRET_KEY;
const VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

export const handler: Handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { token } = JSON.parse(event.body || '{}');

    if (!token) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'reCAPTCHA token is required' }),
      };
    }

    if (!RECAPTCHA_SECRET_KEY) {
      console.error('RECAPTCHA_SECRET_KEY is not configured');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'reCAPTCHA verification is not configured' }),
      };
    }

    // Verify the token with Google's reCAPTCHA API
    const params = new URLSearchParams({
      secret: RECAPTCHA_SECRET_KEY,
      response: token,
    });

    const response = await fetch(`${VERIFY_URL}?${params}`, {
      method: 'POST',
    });

    const data = await response.json();

    if (!data.success) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'reCAPTCHA verification failed',
          details: data['error-codes'] 
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
