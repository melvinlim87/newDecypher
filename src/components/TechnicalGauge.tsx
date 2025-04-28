import React from 'react';

interface TechnicalGaugeProps {
  title: string;
  sell: number;
  neutral: number;
  buy: number;
  signal: 'sell' | 'neutral' | 'buy';
}

export function TechnicalGauge({ title, sell, neutral, buy, signal }: TechnicalGaugeProps) {
  // Create unique IDs for gradients
  const gaugeId = React.useMemo(() => Math.random().toString(36).substr(2, 9), []);
  
  // Calculate rotation based on signal and proportions
  const getRotation = () => {
    const total = sell + neutral + buy;
    if (total === 0) return 0;

    const sellProportion = sell / total;
    const neutralProportion = neutral / total;
    const buyProportion = buy / total;

    switch (signal) {
      case 'sell':
        return -60 + (sellProportion * 20);
      case 'neutral':
        return (neutralProportion * 20) - 10;
      case 'buy':
        return 60 - (buyProportion * 20);
      default:
        return 0;
    }
  };

  return (
    <div className="glass-effect gradient-border rounded-lg p-4 bg-[#1a1b2e]/50 w-full min-h-[280px] flex flex-col" style={{ background: 'rgba(24, 24, 27, 0.8)', border: '1px solid rgba(0, 133, 215, 0.3)', boxShadow: '0 0 15px rgba(0, 133, 215, 0.2)' }}>
     <h3 className="text-center text-white text-lg mb-6">{title}</h3>
      
      {/* Gauge Container */}
      <div className="relative w-full aspect-[2/1] max-w-[240px] mx-auto mb-8 flex-shrink-0">
        {/* Gauge Background Arc */}
        <div className="absolute inset-0">
          <svg className="w-full h-full" viewBox="0 0 200 120" preserveAspectRatio="xMidYMid meet">
            {/* Background gradient */}
            <defs>
              <linearGradient id={`gauge-gradient-${gaugeId}`} x1="0%" y1="0%" x2="100%">
                <stop offset="0%" stopColor="#00A9E0" />
                <stop offset="50%" stopColor="#0085d7" />
                <stop offset="100%" stopColor="#00A9E0" />
              </linearGradient>
              <linearGradient id={`gauge-bg-${gaugeId}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1a1b2e" />
                <stop offset="100%" stopColor="#1a1b2e" />
              </linearGradient>
            </defs>
            
            {/* Background arc */}
            <path
              d="M30,80 A70,70 0 0,1 170,80"
              fill="none"
              stroke={`url(#gauge-bg-${gaugeId})`}
              strokeWidth="20"
              strokeLinecap="round"
            />
            
            {/* Main gauge arc */}
            <path
              d="M30,80 A70,70 0 0,1 170,80"
              fill="none"
              stroke={`url(#gauge-gradient-${gaugeId})`}
              strokeWidth="18"
              strokeLinecap="round"
            />

            {/* Labels */}
            <g transform="translate(0, 110)">
              <text x="30" y="0" fill="#ffffff" fontSize="12" textAnchor="middle" className="font-medium">SELL</text>
              <text x="100" y="0" fill="#ffffff" fontSize="12" textAnchor="middle" className="font-medium">NEUTRAL</text>
              <text x="170" y="0" fill="#ffffff" fontSize="12" textAnchor="middle" className="font-medium">BUY</text>
            </g>
          </svg>
        </div>

        {/* Needle */}
        <div className="absolute left-1/2 bottom-[33%] origin-bottom transition-transform duration-500" style={{ transform: `translateX(-50%) rotate(${getRotation()}deg)` }}>
          <div className="relative">
            {/* Needle body */}
            <div className="absolute left-1/2 bottom-0 w-[1.5px] h-[45px] bg-gradient-to-t from-[#00A9E0] to-[#00A9E0]/80 -translate-x-1/2" />
            
            {/* Needle point */}
            <div className="absolute left-1/2 -top-[4px] -translate-x-1/2">
              <div className="w-[8px] h-[12px] bg-[#00A9E0]" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
            </div>
            
            {/* Needle base */}
            <div className="absolute left-1/2 bottom-0 w-4 h-4 rounded-full bg-gradient-to-t from-[#00A9E0]/90 to-[#00A9E0] transform -translate-x-1/2 translate-y-1/2 shadow-lg" />
          </div>
        </div>
      </div>

      {/* Signal Indicators */}
      <div className="grid grid-cols-3 gap-3 mt-auto">
        <div className="bg-[#1a1b2e] rounded-lg p-2 text-center" style={{ border: '1px solid rgba(0, 133, 215, 0.2)' }}>
          <div className="text-white font-bold text-2xl">{sell}</div>
          <div className="text-xs text-white opacity-70">Sell</div>
        </div>
        <div className="bg-[#1a1b2e] rounded-lg p-2 text-center" style={{ border: '1px solid rgba(0, 133, 215, 0.2)' }}>
          <div className="text-white font-bold text-2xl">{neutral}</div>
          <div className="text-xs text-white opacity-70">Neutral</div>
        </div>
        <div className="bg-[#1a1b2e] rounded-lg p-2 text-center" style={{ border: '1px solid rgba(0, 133, 215, 0.2)' }}>
          <div className="text-white font-bold text-2xl">{buy}</div>
          <div className="text-xs text-white opacity-70">Buy</div>
        </div>
      </div>

      {/* Overall Signal */}
      <div className={`text-center mt-4 font-bold text-xl ${
       signal === 'sell' ? 'text-white' :
       signal === 'neutral' ? 'text-white' : 'text-white'
      }`}>
        {signal.toUpperCase()}
      </div>
    </div>
  );
}