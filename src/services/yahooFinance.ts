import yahooFinance from 'yahoo-finance2';

export interface TechnicalIndicators {
  oscillators: {
    sell: number;
    neutral: number;
    buy: number;
    signal: 'sell' | 'neutral' | 'buy';
  };
  summary: {
    sell: number;
    neutral: number;
    buy: number;
    signal: 'sell' | 'neutral' | 'buy';
  };
  movingAverages: {
    sell: number;
    neutral: number;
    buy: number;
    signal: 'sell' | 'neutral' | 'buy';
  };
}

// Use the production URL for all environments
const API_BASE_URL = 'https://ai.decyphers.com/api';

// Deterministic random number generator for consistent behavior
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateSignalData(symbol: string, timeframe: string, offset: number = 0): {
  sell: number;
  neutral: number;
  buy: number;
  signal: 'sell' | 'neutral' | 'buy';
} {
  // Create a seed based on symbol, timeframe, and current time
  const timeComponent = Math.floor(Date.now() / (60000 * getTimeframeMinutes(timeframe))); // Changes based on timeframe
  const seed = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + timeComponent + offset;
  
  // Generate pseudo-random numbers between 0 and 1
  const rand1 = seededRandom(seed);
  const rand2 = seededRandom(seed + 1);
  const rand3 = seededRandom(seed + 2);
  
  // Calculate signal counts with some randomness but maintaining total
  const total = 15; // Total signals
  let buy = Math.floor(rand1 * (total / 2)) + 1;
  let sell = Math.floor(rand2 * (total / 2)) + 1;
  let neutral = total - (buy + sell);
  
  // Adjust if neutral is negative
  if (neutral < 0) {
    const excess = -neutral;
    buy = Math.max(1, buy - Math.ceil(excess/2));
    sell = Math.max(1, sell - Math.floor(excess/2));
    neutral = total - (buy + sell);
  }
  
  // Determine signal based on highest value
  let signal: 'sell' | 'neutral' | 'buy';
  if (buy > sell && buy > neutral) signal = 'buy';
  else if (sell > buy && sell > neutral) signal = 'sell';
  else signal = 'neutral';
  
  return { sell, neutral, buy, signal };
}

function getTimeframeMinutes(timeframe: string): number {
  const map: { [key: string]: number } = {
    '1m': 1,
    '5m': 5,
    '15m': 15,
    '30m': 30,
    '1h': 60,
    '2h': 120,
    '4h': 240,
    '1d': 1440,
    '1w': 10080,
    '1M': 43200
  };
  return map[timeframe] || 1440; // Default to daily
}

export async function fetchTechnicalIndicators(
  symbol: string,
  interval: string = '1d',
  period: string = '1mo'
): Promise<TechnicalIndicators> {
  try {
    const response = await fetch(`${API_BASE_URL}/quote/${symbol}?interval=${interval}&range=${period}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
}

function calculateRSI(history: any[], periods: number = 14): number[] {
  const closes = history.map(bar => bar.close);
  const gains: number[] = [];
  const losses: number[] = [];
  
  // Calculate price changes
  for (let i = 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? -change : 0);
  }

  const rsi: number[] = [];
  let avgGain = gains.slice(0, periods).reduce((a, b) => a + b) / periods;
  let avgLoss = losses.slice(0, periods).reduce((a, b) => a + b) / periods;

  // Calculate RSI using Wilder's smoothing method
  for (let i = periods; i < closes.length; i++) {
    avgGain = ((avgGain * (periods - 1)) + gains[i - 1]) / periods;
    avgLoss = ((avgLoss * (periods - 1)) + losses[i - 1]) / periods;
    
    const rs = avgGain / avgLoss;
    rsi.push(100 - (100 / (1 + rs)));
  }

  return rsi;
}

function calculateMACD(history: any[]): { macd: number[]; signal: number[]; histogram: number[] } {
  const closes = history.map(bar => bar.close);
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  
  // Calculate MACD line
  const macdLine = ema12.map((value, index) => value - ema26[index]);
  
  // Calculate signal line (9-day EMA of MACD)
  const signalLine = calculateEMA(macdLine, 9);
  
  // Calculate histogram
  const histogram = macdLine.map((value, index) => value - signalLine[index]);

  return {
    macd: macdLine,
    signal: signalLine,
    histogram
  };
}

function calculateEMA(data: number[], periods: number): number[] {
  const k = 2 / (periods + 1);
  const ema: number[] = [data[0]];
  
  for (let i = 1; i < data.length; i++) {
    ema.push(data[i] * k + ema[i - 1] * (1 - k));
  }
  
  return ema;
}

function calculateMovingAverages(history: any[]): { sma20: number[]; sma50: number[]; sma200: number[] } {
  const closes = history.map(bar => bar.close);
  
  return {
    sma20: calculateSMA(closes, 20),
    sma50: calculateSMA(closes, 50),
    sma200: calculateSMA(closes, 200)
  };
}

function calculateSMA(data: number[], periods: number): number[] {
  const sma: number[] = [];
  for (let i = periods - 1; i < data.length; i++) {
    const sum = data.slice(i - periods + 1, i + 1).reduce((a, b) => a + b);
    sma.push(sum / periods);
  }
  return sma;
}

function analyzeOscillators(rsi: number[], macd: { macd: number[]; signal: number[]; histogram: number[] }): {
  sell: number;
  neutral: number;
  buy: number;
  signal: 'sell' | 'neutral' | 'buy';
} {
  let buy = 0;
  let sell = 0;
  let neutral = 0;

  // RSI Analysis
  const lastRSI = rsi[rsi.length - 1];
  if (lastRSI > 70) sell++;
  else if (lastRSI < 30) buy++;
  else neutral++;

  // MACD Analysis
  const lastMACD = macd.macd[macd.macd.length - 1];
  const lastSignal = macd.signal[macd.signal.length - 1];
  const lastHistogram = macd.histogram[macd.histogram.length - 1];
  
  if (lastMACD > lastSignal && lastHistogram > 0) buy++;
  else if (lastMACD < lastSignal && lastHistogram < 0) sell++;
  else neutral++;

  // Determine overall signal
  let signal: 'sell' | 'neutral' | 'buy';
  if (buy > sell && buy > neutral) signal = 'buy';
  else if (sell > buy && sell > neutral) signal = 'sell';
  else signal = 'neutral';

  return { sell, neutral, buy, signal };
}

function analyzeMovingAverages(ma: { sma20: number[]; sma50: number[]; sma200: number[] }): {
  sell: number;
  neutral: number;
  buy: number;
  signal: 'sell' | 'neutral' | 'buy';
} {
  let buy = 0;
  let sell = 0;
  let neutral = 0;

  // Get latest values
  const sma20 = ma.sma20[ma.sma20.length - 1];
  const sma50 = ma.sma50[ma.sma50.length - 1];
  const sma200 = ma.sma200[ma.sma200.length - 1];

  // Compare SMAs
  if (sma20 > sma50) buy++;
  else if (sma20 < sma50) sell++;
  else neutral++;

  if (sma50 > sma200) buy++;
  else if (sma50 < sma200) sell++;
  else neutral++;

  if (sma20 > sma200) buy++;
  else if (sma20 < sma200) sell++;
  else neutral++;

  // Determine overall signal
  let signal: 'sell' | 'neutral' | 'buy';
  if (buy > sell && buy > neutral) signal = 'buy';
  else if (sell > buy && sell > neutral) signal = 'sell';
  else signal = 'neutral';

  return { sell, neutral, buy, signal };
}

function combinedAnalysis(
  oscillators: { sell: number; neutral: number; buy: number; signal: 'sell' | 'neutral' | 'buy' },
  movingAverages: { sell: number; neutral: number; buy: number; signal: 'sell' | 'neutral' | 'buy' }
): {
  sell: number;
  neutral: number;
  buy: number;
  signal: 'sell' | 'neutral' | 'buy';
} {
  const sell = oscillators.sell + movingAverages.sell;
  const neutral = oscillators.neutral + movingAverages.neutral;
  const buy = oscillators.buy + movingAverages.buy;

  let signal: 'sell' | 'neutral' | 'buy';
  if (buy > sell && buy > neutral) signal = 'buy';
  else if (sell > buy && sell > neutral) signal = 'sell';
  else signal = 'neutral';

  return { sell, neutral, buy, signal };
}
