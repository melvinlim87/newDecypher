interface Indicators {
  ema: boolean;
  macd: boolean;
  rsi: boolean;
  keltner: boolean;
  sar: boolean;
  stoch: boolean;
}

interface ChartResult {
  objectUrl: string;
  decodedUrl: string;
  previewUrl: string;
}

export async function saveChartImage(
  interval: string = '4h', 
  symbol: string = 'EURUSD',
  indicators: Indicators = { 
    ema: false, 
    macd: false, 
    rsi: false,
    keltner: false,
    sar: false,
    stoch: false
  }
): Promise<ChartResult> {
  try {
    console.log('saveChartImage called with:', { interval, symbol, indicators });
    
    const API_KEY = import.meta.env.VITE_CHART_IMG_API_KEY;
    if (!API_KEY) {
      throw new Error('Chart API key not configured');
    }

    // Build studies string based on selected indicators
    const studies: string[] = [];
    
    if (indicators.ema) {
      studies.push('MA');
    }
    if (indicators.macd) {
      studies.push('MACD');
    }
    if (indicators.rsi) {
      studies.push('RSI');
    }
    if (indicators.keltner) {
      studies.push('KC');  // Keltner Channels
    }
    if (indicators.sar) {
      studies.push('SAR');  // Parabolic SAR
    }
    if (indicators.stoch) {
      studies.push('Stochastic');  // Stochastic Oscillator
    }

    // Use netlify function proxy with correct development URL
    const proxyUrl = import.meta.env.DEV 
      ? 'https://ai.decyphers.com/api/chart'
      : '/.netlify/functions/chart-proxy';

    const requestBody = {
      symbol: symbol,
      interval: interval,
      theme: 'dark',
      studies,
      key: API_KEY
    };
    
    console.log('Making request to chart proxy:', proxyUrl);
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'image/png,image/*'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch chart: ${response.status} ${response.statusText} - ${errorText}`);
    }

    // Response will be JSON with the chart data
    const chartData = await response.json();
    console.log('Received chart data:', { url: chartData.url.substring(0, 50) + '...' });

    // Create object URL from the chart URL
    console.log('Fetching image from URL...');
    const imageResponse = await fetch(chartData.url);
    const blob = await imageResponse.blob();
    console.log('Created blob:', { size: blob.size, type: blob.type });
    const objectUrl = URL.createObjectURL(blob);
    console.log('Created object URL:', objectUrl);
    
    return { 
      objectUrl,
      decodedUrl: chartData.url,
      previewUrl: chartData.url
    };
  } catch (error) {
    console.error('Error in saveChartImage:', error);
    throw error instanceof Error ? error : new Error('Failed to download chart image');
  }
}
