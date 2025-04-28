const yahooFinance = require('yahoo-finance2').default;

function calculateRSI(history, periods = 14) {
  const closes = history.map(bar => bar.close);
  const gains = [];
  const losses = [];
  
  for (let i = 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? -change : 0);
  }

  const rsi = [];
  let avgGain = gains.slice(0, periods).reduce((a, b) => a + b, 0) / periods;
  let avgLoss = losses.slice(0, periods).reduce((a, b) => a + b, 0) / periods;

  for (let i = periods; i < closes.length; i++) {
    avgGain = ((avgGain * (periods - 1)) + gains[i - 1]) / periods;
    avgLoss = ((avgLoss * (periods - 1)) + losses[i - 1]) / periods;
    
    const rs = avgGain / avgLoss;
    rsi.push(100 - (100 / (1 + rs)));
  }

  return rsi;
}

function calculateMACD(history) {
  const closes = history.map(bar => bar.close);
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  
  const macdLine = ema12.map((value, index) => value - ema26[index]);
  const signalLine = calculateEMA(macdLine, 9);
  const histogram = macdLine.map((value, index) => value - signalLine[index]);

  return {
    macd: macdLine,
    signal: signalLine,
    histogram
  };
}

function calculateEMA(data, periods) {
  const k = 2 / (periods + 1);
  const ema = [data[0]];
  
  for (let i = 1; i < data.length; i++) {
    ema.push(data[i] * k + ema[i - 1] * (1 - k));
  }
  
  return ema;
}

function calculateMovingAverages(history) {
  const closes = history.map(bar => bar.close);
  
  return {
    sma20: calculateSMA(closes, 20),
    sma50: calculateSMA(closes, 50),
    sma200: calculateSMA(closes, 200)
  };
}

function calculateSMA(data, periods) {
  const sma = [];
  for (let i = periods - 1; i < data.length; i++) {
    const sum = data.slice(i - periods + 1, i + 1).reduce((a, b) => a + b, 0);
    sma.push(sum / periods);
  }
  return sma;
}

function analyzeOscillators(rsi, macd) {
  let buy = 0;
  let sell = 0;
  let neutral = 0;

  const lastRSI = rsi[rsi.length - 1];
  if (lastRSI > 70) sell++;
  else if (lastRSI < 30) buy++;
  else neutral++;

  const lastMACD = macd.macd[macd.macd.length - 1];
  const lastSignal = macd.signal[macd.signal.length - 1];
  const lastHistogram = macd.histogram[macd.histogram.length - 1];
  
  if (lastMACD > lastSignal && lastHistogram > 0) buy++;
  else if (lastMACD < lastSignal && lastHistogram < 0) sell++;
  else neutral++;

  let signal = 'neutral';
  if (buy > sell && buy > neutral) signal = 'buy';
  else if (sell > buy && sell > neutral) signal = 'sell';

  return { sell, neutral, buy, signal };
}

function analyzeMovingAverages(ma) {
  let buy = 0;
  let sell = 0;
  let neutral = 0;

  const sma20 = ma.sma20[ma.sma20.length - 1];
  const sma50 = ma.sma50[ma.sma50.length - 1];
  const sma200 = ma.sma200[ma.sma200.length - 1];

  if (sma20 > sma50) buy++;
  else if (sma20 < sma50) sell++;
  else neutral++;

  if (sma50 > sma200) buy++;
  else if (sma50 < sma200) sell++;
  else neutral++;

  if (sma20 > sma200) buy++;
  else if (sma20 < sma200) sell++;
  else neutral++;

  let signal = 'neutral';
  if (buy > sell && buy > neutral) signal = 'buy';
  else if (sell > buy && sell > neutral) signal = 'sell';

  return { sell, neutral, buy, signal };
}

function combinedAnalysis(oscillators, movingAverages) {
  const sell = oscillators.sell + movingAverages.sell;
  const neutral = oscillators.neutral + movingAverages.neutral;
  const buy = oscillators.buy + movingAverages.buy;

  let signal = 'neutral';
  if (buy > sell && buy > neutral) signal = 'buy';
  else if (sell > buy && sell > neutral) signal = 'sell';

  return { sell, neutral, buy, signal };
}

exports.handler = async function(event, context) {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const { symbol, interval } = event.queryStringParameters || {};

    if (!symbol || !interval) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Symbol and interval are required' })
      };
    }

    // Format forex pairs
    let formattedSymbol = symbol;
    if (symbol.length === 6 && !symbol.includes('.') && !symbol.includes('-')) {
      formattedSymbol = symbol + '=X';
    }

    // Validate interval
    const validIntervals = ['1m', '5m', '15m', '30m', '60m', '1h', '1d', '1wk', '1mo'];
    const formattedInterval = validIntervals.includes(interval) ? interval : '1d';

    // Fetch historical data
    const history = await yahooFinance.historical(formattedSymbol, {
      period1: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      period2: new Date(),
      interval: formattedInterval
    });

    if (!history || history.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'No data available for this symbol' })
      };
    }

    // Calculate RSI
    const rsi = calculateRSI(history);
    
    // Calculate MACD
    const macd = calculateMACD(history);
    
    // Calculate Moving Averages
    const ma = calculateMovingAverages(history);

    // Generate signals
    const oscillatorSignals = analyzeOscillators(rsi, macd);
    const maSignals = analyzeMovingAverages(ma);
    const summarySignals = combinedAnalysis(oscillatorSignals, maSignals);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        oscillators: oscillatorSignals,
        summary: summarySignals,
        movingAverages: maSignals
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
