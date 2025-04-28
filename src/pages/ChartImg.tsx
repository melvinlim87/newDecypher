import React, { useState } from 'react';
import { LineChart } from 'lucide-react';
import { ENV } from '../lib/env';
import { auth, database } from '../lib/firebase';
import { ref, get, set } from 'firebase/database';

// Define exchange symbols with their descriptions
const EXCHANGE_SYMBOLS = [
  { value: 'BINANCE:BTCUSDT', label: 'Binance - BTC/USDT' },
  { value: 'BINANCEUS:BTCUSD', label: 'Binance US - BTC/USD' },
  { value: 'BINGX:BTCUSDT', label: 'BingX - BTC/USDT' },
  { value: 'BITFINEX:BTCUSD', label: 'Bitfinex - BTC/USD' },
  { value: 'BITFLYER:BTCJPY', label: 'bitFlyer - BTC/JPY' },
  { value: 'BITGET:BTCUSDT.P', label: 'Bitget - BTC/USDT Perpetual' },
  { value: 'BITHUMB:BTCKRW', label: 'Bithumb - BTC/KRW' },
  { value: 'BITMART:BTCUSDT', label: 'Bitmart - BTC/USDT' },
  { value: 'BITMEX:XBTUSD', label: 'BitMEX - XBT/USD' },
  { value: 'BITSTAMP:BTCUSD', label: 'Bitstamp - BTC/USD' },
  { value: 'BTSE:BTCUSD.P', label: 'BTSE - BTC/USD Perpetual' },
  { value: 'BYBIT:BTCUSDT.P', label: 'Bybit - BTC/USDT Perpetual' },
  { value: 'COINBASE:BTCUSD', label: 'Coinbase - BTC/USD' },
  { value: 'COINEX:BTCUSDT', label: 'CoinEx - BTC/USDT' },
  { value: 'DERIBIT:BTCUSD.P', label: 'Deribit - BTC/USD Perpetual' },
  { value: 'GATEIO:BTCUSDT', label: 'Gate.io - BTC/USDT' },
  { value: 'GEMINI:BTCUSD', label: 'Gemini - BTC/USD' },
  { value: 'HTX:BTCUSDT', label: 'HTX - BTC/USDT' },
  { value: 'KRAKEN:BTCUSD', label: 'Kraken - BTC/USD' },
  { value: 'KUCOIN:BTCUSDT', label: 'KuCoin - BTC/USDT' },
  { value: 'MEXC:BTCUSDT.P', label: 'MEXC Global - BTC/USDT Perpetual' },
  { value: 'OKCOIN:BTCUSD', label: 'OKCoin - BTC/USD' },
  { value: 'OKX:BTCUSDT.P', label: 'OKX - BTC/USDT Perpetual' },
  { value: 'PHEMEX:BTCPERP', label: 'Phemex - BTC Perpetual' },
  { value: 'POLONIEX:BTCUSDT', label: 'Poloniex - BTC/USDT' },
  { value: 'UPBIT:BTCKRW', label: 'UpBit - BTC/KRW' }
];

const INTERVALS = [
  { value: '1m', label: '1 Minute' },
  { value: '5m', label: '5 Minutes' },
  { value: '15m', label: '15 Minutes' },
  { value: '30m', label: '30 Minutes' },
  { value: '1h', label: '1 Hour' },
  { value: '4h', label: '4 Hours' },
  { value: '1D', label: '1 Day' },
  { value: '1W', label: '1 Week' },
  { value: '1M', label: '1 Month' }
];

const THEMES = [
  { value: 'dark', label: 'Dark Theme' },
  { value: 'light', label: 'Light Theme' }
];

export function ChartImg() {
  const [symbol, setSymbol] = useState('BINANCE:BTCUSDT');
  const [interval, setInterval] = useState('1D');
  const [theme, setTheme] = useState('dark');
  const [chartUrl, setChartUrl] = useState('');
  const [decodedUrl, setDecodedUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const TOKENS_PER_CHART = 10; // Define token cost constant

  const generateChart = async () => {
    if (!auth.currentUser) {
      setError('Please login to generate charts');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Check and consume tokens
      const uid = auth.currentUser.uid;
      const userRef = ref(database, `users/${uid}`);
      const snapshot = await get(userRef);
      
      if (!snapshot.exists()) {
        throw new Error('User data not found');
      }

      const userData = snapshot.val();
      if (!userData.tokens || userData.tokens < TOKENS_PER_CHART) {
        throw new Error(`Insufficient tokens. You need ${TOKENS_PER_CHART} tokens to generate a chart. Please purchase more tokens to continue.`);
      }

      // Generate chart
      const apiKey = ENV.CHART_IMG_API_KEY();
      const baseUrl = 'https://api.chart-img.com/v1/tradingview/advanced-chart/storage';
      const queryParams = new URLSearchParams({
        symbol: symbol,
        interval: interval,
        theme: theme,
        key: apiKey
      });

      // Consume tokens
      await set(userRef, {
        ...userData,
        tokens: userData.tokens - TOKENS_PER_CHART,
        updatedAt: new Date().toISOString()
      });

      // Get the URL from chartUtils
      const result = await saveChartImage(interval, symbol, {
        ema: false,
        macd: true,
        rsi: true
      });

      setChartUrl(result.objectUrl);
      setDecodedUrl(result.decodedUrl);
      setPreviewUrl(result.previewUrl);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to generate chart. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const selectClass = "w-full px-4 py-2 rounded-lg glass-effect gradient-border bg-transparent text-indigo-200";
  const optionClass = "bg-gray-900";

  return (
    <div className="container mx-auto px-4 pt-20">
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-indigo-200 flex items-center gap-2">
          <LineChart className="w-6 h-6" />
          Chart Generator
        </h1>

        <div className="glass-effect gradient-border p-6 rounded-lg">
          <div className="flex flex-col gap-4">
            {error && (
              <div className="bg-red-500/20 text-red-200 px-4 py-2 rounded-lg">
                {error}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-indigo-200 mb-2">Symbol</label>
                <select
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  className={selectClass}
                  disabled={isGenerating}
                >
                  {EXCHANGE_SYMBOLS.map((option) => (
                    <option key={option.value} value={option.value} className={optionClass}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-indigo-200 mb-2">Interval</label>
                <select
                  value={interval}
                  onChange={(e) => setInterval(e.target.value)}
                  className={selectClass}
                  disabled={isGenerating}
                >
                  {INTERVALS.map((option) => (
                    <option key={option.value} value={option.value} className={optionClass}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-indigo-200 mb-2">Theme</label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className={selectClass}
                  disabled={isGenerating}
                >
                  {THEMES.map((theme) => (
                    <option key={theme.value} value={theme.value} className={optionClass}>
                      {theme.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={generateChart}
              disabled={isGenerating}
              className={`w-full px-4 py-2 rounded-lg glass-effect gradient-border bg-transparent text-indigo-200 hover:bg-indigo-500/20 transition-colors ${
                isGenerating ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isGenerating ? (
                <>
                  <span className="animate-spin inline-block mr-2">⌛</span>
                  Generating...
                </>
              ) : (
                'Generate Chart'
              )}
            </button>

            {chartUrl && !error && (
              <div className="mt-4 space-y-4">
                <div className="p-4 rounded-lg bg-gray-800/50 space-y-4">
                  <div>
                    <h3 className="text-indigo-200 font-semibold mb-2">Chart-img API URL:</h3>
                    <code className="text-sm text-indigo-100 break-all">{decodedUrl}</code>
                  </div>
                  <div>
                    <h3 className="text-indigo-200 font-semibold mb-2">Preview URL:</h3>
                    <code className="text-sm text-indigo-100 break-all">{previewUrl}</code>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-indigo-200 font-semibold mb-2">Local Image:</h3>
                    <img 
                      src={chartUrl} 
                      alt="Trading Chart (Local)" 
                      className="w-full rounded-lg shadow-lg" 
                      style={{ maxHeight: '600px', objectFit: 'contain' }}
                      onError={(e) => {
                        setError('Failed to load local chart image. Please try again.');
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="text-indigo-200 font-semibold mb-2">Preview Image:</h3>
                    <img 
                      src={previewUrl} 
                      alt="Trading Chart (Preview)" 
                      className="w-full rounded-lg shadow-lg" 
                      style={{ maxHeight: '600px', objectFit: 'contain' }}
                      onError={(e) => {
                        setError('Failed to load preview chart image. Please try again.');
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
