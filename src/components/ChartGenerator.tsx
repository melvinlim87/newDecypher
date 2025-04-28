import React, { useState } from 'react';
import { Loader2, AlertCircle, X } from 'lucide-react';
import { saveChartImage } from '../utils/chartUtils';

interface ChartGeneratorProps {
  onChartGenerated: (imageUrl: string) => void;
  onClose?: () => void;
}

const SYMBOL_CATEGORIES = [
  {
    label: 'Forex',
    options: [
      { value: 'EURUSD', label: 'EUR/USD' },
      { value: 'GBPUSD', label: 'GBP/USD' },
      { value: 'USDJPY', label: 'USD/JPY' },
      { value: 'AUDUSD', label: 'AUD/USD' },
      { value: 'USDCAD', label: 'USD/CAD' },
      { value: 'USDCHF', label: 'USD/CHF' },
      { value: 'NZDUSD', label: 'NZD/USD' },
      { value: 'EURJPY', label: 'EUR/JPY' },
      { value: 'GBPJPY', label: 'GBP/JPY' },
      { value: 'EURGBP', label: 'EUR/GBP' }
    ]
  },
  {
    label: 'Crypto',
    options: [
      { value: 'BTCUSD', label: 'BTC/USD' },
      { value: 'ETHUSD', label: 'ETH/USD' },
      { value: 'XRPUSD', label: 'XRP/USD' },
      { value: 'DOTUSD', label: 'DOT/USD' },
      { value: 'SOLUSD', label: 'SOL/USD' },
      { value: 'ADAUSD', label: 'ADA/USD' },
      { value: 'DOGUSD', label: 'DOGE/USD' },
      { value: 'MATICUSD', label: 'MATIC/USD' },
      { value: 'LINKUSD', label: 'LINK/USD' },
      { value: 'UNIUSD', label: 'UNI/USD' }
    ]
  },
  {
    label: 'Indices',
    options: [
      { value: 'US500', label: 'S&P 500' },
      { value: 'USTEC', label: 'NASDAQ 100' },
      { value: 'US30', label: 'Dow Jones' },
      { value: 'UK100', label: 'FTSE 100' },
      { value: 'DE40', label: 'DAX 40' },
      { value: 'JP225', label: 'Nikkei 225' },
      { value: 'HK50', label: 'Hang Seng' },
      { value: 'AU200', label: 'ASX 200' },
      { value: 'EU50', label: 'Euro Stoxx 50' },
      { value: 'FR40', label: 'CAC 40' }
    ]
  }
];

const TIMEFRAMES = [
  { value: '1m', label: '1 minute' },
  { value: '3m', label: '3 minutes' },
  { value: '5m', label: '5 minutes' },
  { value: '15m', label: '15 minutes' },
  { value: '30m', label: '30 minutes' },
  { value: '45m', label: '45 minutes' },
  { value: '1h', label: '1 hour' },
  { value: '2h', label: '2 hours' },
  { value: '3h', label: '3 hours' },
  { value: '4h', label: '4 hours' },
  { value: '1D', label: '1 day' },
  { value: '1W', label: '1 week' },
  { value: '1M', label: '1 month' },
  { value: '3M', label: '3 months' },
  { value: '6M', label: '6 months' },
  { value: '1Y', label: '1 year' }
];

export const ChartGenerator: React.FC<ChartGeneratorProps> = ({ onChartGenerated, onClose }) => {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('EURUSD');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('4h');
  const [isGenerating, setIsGenerating] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [indicators, setIndicators] = useState({
    ema: false,
    macd: false,
    rsi: false,
    keltner: false,
    sar: false,
    stoch: false
  });

  // Helper function to count selected indicators
  const getSelectedIndicatorCount = () => {
    return Object.values(indicators).filter(Boolean).length;
  };

  // Handle indicator change with max 3 limit
  const handleIndicatorChange = (name: keyof typeof indicators, checked: boolean) => {
    if (checked && getSelectedIndicatorCount() >= 3) {
      return; // Don't allow more than 3 selections
    }
    setIndicators(prev => ({ ...prev, [name]: checked }));
  };

  // Reset form to initial state
  const resetForm = () => {
    setSelectedSymbol('EURUSD');
    setSelectedTimeframe('4h');
    setIndicators({
      ema: false,
      macd: false,
      rsi: false,
      keltner: false,
      sar: false,
      stoch: false
    });
    setChartError(null);
    setShowPrompt(false);
  };

  const handleGenerateChart = async () => {
    try {
      setIsGenerating(true);
      setChartError(null);
      console.log('Generating chart with settings:', { 
        symbol: selectedSymbol, 
        interval: selectedTimeframe,
        indicators
      });
      
      const result = await saveChartImage(selectedTimeframe, selectedSymbol, indicators);
      console.log('Chart generated:', { 
        objectUrl: result.objectUrl,
        decodedUrl: result.decodedUrl,
        previewUrl: result.previewUrl 
      });
      
      onChartGenerated(result.objectUrl);
      setIsGenerating(false);
    } catch (error) {
      console.error('Failed to generate chart:', error);
      setChartError(error instanceof Error ? error.message : 'Failed to generate chart');
      setIsGenerating(false);
    }
  };

  // Flatten symbol options for simple dropdown
  const symbolOptions = SYMBOL_CATEGORIES.flatMap(category => [
    // Add category header
    { value: '', label: `--- ${category.label} ---`, disabled: true },
    // Add category options
    ...category.options
  ]);

  return (
    <div className="w-full max-w-2xl mx-auto bg-gray-900 rounded-lg shadow-xl overflow-hidden">
      <div className="p-4">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-medium text-white">Generate Chart</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-700 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </div>

        <div className="space-y-6">
          {/* Symbol and Timeframe */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Symbol</label>
              <select
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
                className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-700 hover:border-gray-600 transition-colors"
                disabled={isGenerating}
              >
                {symbolOptions.map((option, index) => (
                  <option 
                    key={index} 
                    value={option.value} 
                    disabled={option.disabled}
                    className={option.disabled ? 'font-semibold bg-gray-900 text-gray-500' : ''}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Timeframe</label>
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-700 hover:border-gray-600 transition-colors"
                disabled={isGenerating}
              >
                {TIMEFRAMES.map((timeframe) => (
                  <option key={timeframe.value} value={timeframe.value}>
                    {timeframe.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Indicators */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Indicators</label>
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="relative flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      checked={indicators.ema}
                      onChange={(e) => handleIndicatorChange('ema', e.target.checked)}
                      className="form-checkbox h-4 w-4 text-indigo-600 border-gray-600 rounded focus:ring-indigo-500 bg-gray-700"
                      disabled={isGenerating || (!indicators.ema && getSelectedIndicatorCount() >= 3)}
                    />
                  </div>
                  <div className="ml-2 text-sm">
                    <span className="text-white">EMA</span>
                    <p className="text-white text-xs opacity-70">Moving Average</p>
                  </div>
                </label>

                <label className="relative flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      checked={indicators.macd}
                      onChange={(e) => handleIndicatorChange('macd', e.target.checked)}
                      className="form-checkbox h-4 w-4 text-indigo-600 border-gray-600 rounded focus:ring-indigo-500 bg-gray-700"
                      disabled={isGenerating || (!indicators.macd && getSelectedIndicatorCount() >= 3)}
                    />
                  </div>
                  <div className="ml-2 text-sm">
                    <span className="text-white">MACD</span>
                    <p className="text-white text-xs opacity-70">Moving Average CD</p>
                  </div>
                </label>

                <label className="relative flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      checked={indicators.rsi}
                      onChange={(e) => handleIndicatorChange('rsi', e.target.checked)}
                      className="form-checkbox h-4 w-4 text-indigo-600 border-gray-600 rounded focus:ring-indigo-500 bg-gray-700"
                      disabled={isGenerating || (!indicators.rsi && getSelectedIndicatorCount() >= 3)}
                    />
                  </div>
                  <div className="ml-2 text-sm">
                    <span className="text-white">RSI</span>
                    <p className="text-white text-xs opacity-70">Relative Strength</p>
                  </div>
                </label>

                <label className="relative flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      checked={indicators.keltner}
                      onChange={(e) => handleIndicatorChange('keltner', e.target.checked)}
                      className="form-checkbox h-4 w-4 text-indigo-600 border-gray-600 rounded focus:ring-indigo-500 bg-gray-700"
                      disabled={isGenerating || (!indicators.keltner && getSelectedIndicatorCount() >= 3)}
                    />
                  </div>
                  <div className="ml-2 text-sm">
                    <span className="text-white">Keltner</span>
                    <p className="text-white text-xs opacity-70">Keltner Channels</p>
                  </div>
                </label>

                <label className="relative flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      checked={indicators.sar}
                      onChange={(e) => handleIndicatorChange('sar', e.target.checked)}
                      className="form-checkbox h-4 w-4 text-indigo-600 border-gray-600 rounded focus:ring-indigo-500 bg-gray-700"
                      disabled={isGenerating || (!indicators.sar && getSelectedIndicatorCount() >= 3)}
                    />
                  </div>
                  <div className="ml-2 text-sm">
                    <span className="text-white">SAR</span>
                    <p className="text-white text-xs opacity-70">Parabolic SAR</p>
                  </div>
                </label>

                <label className="relative flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      checked={indicators.stoch}
                      onChange={(e) => handleIndicatorChange('stoch', e.target.checked)}
                      className="form-checkbox h-4 w-4 text-indigo-600 border-gray-600 rounded focus:ring-indigo-500 bg-gray-700"
                      disabled={isGenerating || (!indicators.stoch && getSelectedIndicatorCount() >= 3)}
                    />
                  </div>
                  <div className="ml-2 text-sm">
                    <span className="text-white">Stochastic</span>
                    <p className="text-white text-xs opacity-70">Stochastic Oscillator</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {chartError && (
            <div className="flex items-center space-x-2 text-red-500">
              <AlertCircle className="w-5 h-5" />
              <span>{chartError}</span>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerateChart}
            disabled={isGenerating}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? (
              <span className="flex items-center justify-center">
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating...
              </span>
            ) : (
              'Generate Chart'
            )}
          </button>

          {/* Upload More Prompt */}
          {showPrompt && !isGenerating && (
            <div className="mt-4 p-4 bg-gray-800 rounded-lg">
              <p className="text-white mb-4">Would you like to upload another chart?</p>
              <div className="flex space-x-4">
                <button
                  onClick={resetForm}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  Yes, Upload Another
                </button>
                <button
                  onClick={() => setShowPrompt(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                >
                  No, I'm Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
