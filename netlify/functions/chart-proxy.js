const fetch = require('node-fetch').default;

exports.handler = async (event, context) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
      ? 'https://aimarketanalyzer.netlify.app' 
      : '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
    };
  }

  try {
    console.log('Received request:', event.body);
    const { symbol, interval, theme, studies } = JSON.parse(event.body);
    const apiKey = process.env.VITE_CHART_IMG_API_KEY;

    if (!apiKey) {
      console.error('API key not found in environment variables');
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'API key not configured' }),
      };
    }

    // Build URL with query parameters
    const apiUrl = 'https://api.chart-img.com/v1/tradingview/advanced-chart/storage';
    const queryParams = new URLSearchParams({
      symbol: symbol,
      interval: interval,
      theme: theme || 'dark',
      key: apiKey,
      height: '300'
    });

    // Add studies if present
    if (studies && Array.isArray(studies)) {
      studies.forEach(study => queryParams.append('studies', study));
    }

    console.log('Making request to:', `${apiUrl}?${queryParams}`);

    const response = await fetch(`${apiUrl}?${queryParams}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Chart-img API error:', response.status, response.statusText);
      return {
        statusCode: response.status,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: `Chart-img API error: ${response.status} ${response.statusText}` 
        }),
      };
    }

    const chartData = await response.json();
    console.log('Chart data:', chartData);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(chartData)
    };
  } catch (error) {
    console.error('Proxy error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
