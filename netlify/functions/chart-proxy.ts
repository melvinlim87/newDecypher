import { Handler } from '@netlify/functions'

export const handler: Handler = async (event) => {
  // Get the origin from the request headers
  const origin = event.headers.origin || event.headers.Origin || 'null';
  
  // Define allowed origins
  const allowedOrigins = [
    'https://aimarketanalyzer.netlify.app',
    'http://localhost:5173',  // Vite dev server
    'http://localhost:8888',  // Netlify dev server
    'null'                    // Allow file:// protocol for testing
  ];

  // Set CORS headers based on the request origin
  const corsHeaders = {
    'Access-Control-Allow-Origin': origin,  // Echo back the requesting origin
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',  // 24 hours
    'Vary': 'Origin'  // Important for CDN caching
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    console.log('Handling OPTIONS request from origin:', origin);
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    console.log('Invalid method:', event.httpMethod);
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    }
  }

  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Request body is required' })
      }
    }

    const { symbol, interval, theme, studies } = JSON.parse(event.body);
    
    if (!symbol || !interval) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Symbol and interval are required' })
      }
    }

    const chartUrl = `https://chart-img.com/tradingview/advanced-chart?symbol=${encodeURIComponent(symbol)}&interval=${interval}&theme=${theme || 'dark'}&studies=${studies ? studies.join(',') : ''}`;

    console.log('Request details:', {
      origin,
      method: event.httpMethod,
      headers: event.headers,
      chartUrl
    });
    
    // Dynamically import node-fetch
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch(chartUrl, {
      headers: {
        'Accept': 'image/png,image/*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const contentType = response.headers.get('Content-Type');
    console.log('Response details:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error from chart-img:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorText.slice(0, 200)
      });
      
      return {
        statusCode: response.status,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Chart API request failed',
          details: `Status ${response.status}: ${response.statusText}`,
          response: errorText.slice(0, 200)
        })
      };
    }

    if (!contentType?.includes('image')) {
      let responseText;
      try {
        responseText = await response.text();
      } catch (e) {
        responseText = 'Could not read response body';
      }
      
      console.error('Invalid content type:', {
        contentType,
        headers: Object.fromEntries(response.headers.entries()),
        response: responseText.slice(0, 200)
      });
      
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Invalid response from chart API',
          details: `Expected image/* but received ${contentType}`,
          response: responseText.slice(0, 200)
        })
      }
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log('Success:', {
      size: buffer.length,
      contentType,
      headers: Object.fromEntries(response.headers.entries())
    });

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': contentType || 'image/png',
        'Cache-Control': 'public, max-age=300'
      },
      body: buffer.toString('base64'),
      isBase64Encoded: true
    };
  } catch (error) {
    console.error('Proxy error:', {
      message: error.message,
      stack: error.stack,
      headers: event.headers
    });
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Failed to fetch image',
        details: error.message,
        stack: error.stack
      })
    };
  }
}
