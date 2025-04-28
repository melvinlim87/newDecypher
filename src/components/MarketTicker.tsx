import React, { useEffect, useRef } from 'react';

interface MarketTickerProps {
  symbol: string;
}

declare global {
  interface Window {
    TradingView?: any;
  }
}

export const MarketTicker: React.FC<MarketTickerProps> = ({ symbol }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear any existing content
    container.innerHTML = '';

    // Create the widget container
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container__widget';
    container.appendChild(widgetContainer);

    // Create and load TradingView script
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';
    script.async = true;
    script.type = 'text/javascript';

    // Define widget options
    const widgetOptions = {
      "symbol": symbol,
      "width": "100%",
      "height": "78",
      "locale": "en",
      "dateRange": "1D",
      "colorTheme": "dark",
      "isTransparent": true,
      "autosize": false,
      "largeChartUrl": "",
      "chartOnly": false
    };

    // Set widget options as text content (not innerHTML)
    script.textContent = JSON.stringify(widgetOptions);

    // Add script to container
    widgetContainer.appendChild(script);

    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [symbol]);

  return (
    <div 
      ref={containerRef}
      className="tradingview-widget-container"
      style={{ minHeight: '78px' }}
    />
  );
};
