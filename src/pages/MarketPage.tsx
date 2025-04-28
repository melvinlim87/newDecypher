import React, { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { MarketCarousel } from '../components/MarketCarousel';
import { MarketTicker } from '../components/MarketTicker';
import { forexPairs, indexes, cfds } from '../components/MarketDropdown';
import { VerticalCircuitLines } from '../components/VerticalCircuitLines';
import '../styles/market-carousel.css';
import '../styles/market-ticker-slider.css';

declare global {
  interface Window {
    TradingView: any;
  }
}

type TimeRange = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y';

const MarketPage = () => {
  const { category = 'forex', symbol } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedRange, setSelectedRange] = useState<TimeRange>('1D');
  const [isLoading, setIsLoading] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const widgetRef = useRef<any>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout>();

  // Use a stable container ID based on category and symbol
  const chartContainerId = useMemo(() => 
    `tradingview_${category}_${symbol || 'default'}`,
    [category, symbol]
  );

  // Format the symbol based on category
  const getFormattedSymbol = useCallback(() => {
    if (!symbol) return '';
    
    switch (category) {
      case 'forex':
        if (symbol === 'GOLD') {
          return 'GOLD';
        }
        return `FX:${symbol}`;
      case 'indexes':
        return `FOREXCOM:${symbol}`;
      case 'cfds':
        return `OANDA:${symbol}`;
      default:
        return symbol;
    }
  }, [category, symbol]);

  // Load TradingView script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
      setScriptLoaded(false);
    };
  }, []); // Only run once when component mounts

  // Cleanup function for widget
  const cleanupWidget = useCallback(() => {
    const container = document.getElementById(chartContainerId);
    if (container) {
      if (widgetRef.current) {
        try {
          widgetRef.current.remove();
        } catch (e) {
          console.warn('Error removing widget:', e);
        }
        widgetRef.current = null;
      }
      container.innerHTML = '';
    }
  }, [chartContainerId]);

  // Initialize TradingView widget
  useEffect(() => {
    if (!symbol || !scriptLoaded || !window.TradingView) return;

    cleanupWidget();
    
    const container = document.getElementById(chartContainerId);
    if (!container) return;
    
    const formattedSymbol = getFormattedSymbol();

    try {
      // Create new widget instance with fresh container
      const widget = new window.TradingView.widget({
        symbol: formattedSymbol,
        timezone: "Asia/Singapore",
        theme: "dark",
        style: "1",
        locale: "en",
        container_id: chartContainerId,
        autosize: true,
        height: 500,
        allow_symbol_change: true,
        enabled_features: ["use_localstorage_for_settings"],
        disabled_features: ["header_symbol_search"]
      });

      widgetRef.current = widget;
    } catch (error) {
      console.error('Error initializing TradingView widget:', error);
    }

    return cleanupWidget;
  }, [symbol, category, scriptLoaded, getFormattedSymbol, chartContainerId, cleanupWidget]);

  if (!symbol || !category) {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="glass-effect gradient-border rounded-lg p-6 bg-gray-900/50 relative z-10">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-100">Invalid Market Selection</h2>
              <p className="mt-4 text-gray-300">Please select a valid market from the navigation menu.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const formattedSymbol = getFormattedSymbol();

  return (
    <div className="min-h-screen bg-gray-900 relative">
      {/* Background animations */}
      <div className="absolute inset-0 overflow-hidden">
        <VerticalCircuitLines theme="light" />
      </div>
      
      <div className="container mx-auto px-6 md:px-12 lg:px-24 py-8 relative z-10">
        <div className="glass-effect gradient-border rounded-lg p-6 bg-gray-900/50 relative z-10">
          {/* Market Carousel */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-100">
              {category === 'forex' ? 'Popular Forex Pairs' :
               category === 'indexes' ? 'Major Indexes' :
               'Popular CFDs'}
            </h2>
            <MarketCarousel 
              items={category === 'forex' ? forexPairs : category === 'indexes' ? indexes : cfds} 
              category={category} 
              currentSymbol={symbol || ''}
              key={`${category}-${symbol}`}
            />
          </div>

          {/* Title Section with Real-time Data */}
          <div className="mt-8 rounded-lg p-4 bg-gray-800/50 border border-gray-700/50">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-semibold text-gray-100">
                {symbol === 'GOLD' ? 'GOLD' : symbol?.replace('-', '/')}
              </h1>
              <div className="flex-1">
                <MarketTicker symbol={formattedSymbol} key={formattedSymbol} />
              </div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="mt-8 rounded-lg p-6 bg-gray-800/50 border border-gray-700/50">
            <div className="flex flex-col h-full">
              {/* Chart */}
              <div 
                id={chartContainerId}
                className={`w-full h-[500px] rounded-lg overflow-hidden ${isLoading ? 'opacity-50' : ''}`}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
              />
              {/* Time Range Selector */}
              {/* <div className="flex mt-4 space-x-2 justify-start relative z-20">
                {(['1D', '1W', '1M', '3M', '6M', '1Y'] as TimeRange[]).map((range) => (
                  <button
                    key={range}
                    onClick={() => {
                      if (isLoading) return;
                      setSelectedRange(range);
                      // Clear any existing timeout
                      if (loadingTimeoutRef.current) {
                        clearTimeout(loadingTimeoutRef.current);
                      }
                      setIsLoading(true);
                      // Set a new timeout
                      loadingTimeoutRef.current = setTimeout(() => {
                        setIsLoading(false);
                      }, 1000);
                    }}
                    disabled={isLoading}
                    className={`px-4 py-2 rounded-lg transition-all duration-200 relative z-20 ${
                      selectedRange === range
                        ? 'bg-indigo-500 text-white font-medium'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {range}
                  </button>
                ))}
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { MarketPage };
