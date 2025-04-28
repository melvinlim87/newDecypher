import React, { useEffect, useState } from 'react';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';

interface CurrencyPair {
  pair: string;
  bid: number;
  ask: number;
  change: number;
  changePercent: number;
}

interface LiveMarketDataProps {
  theme: string;
}

export const LiveMarketData: React.FC<LiveMarketDataProps> = ({ theme }) => {
  const [marketData, setMarketData] = useState<CurrencyPair[]>([
    { pair: 'EUR/USD', bid: 1.0921, ask: 1.0923, change: 0.0012, changePercent: 0.11 },
    { pair: 'GBP/USD', bid: 1.2651, ask: 1.2654, change: -0.0023, changePercent: -0.18 },
    { pair: 'USD/JPY', bid: 151.43, ask: 151.46, change: 0.32, changePercent: 0.21 },
    { pair: 'AUD/USD', bid: 0.6542, ask: 0.6544, change: -0.0018, changePercent: -0.27 },
    { pair: 'USD/CAD', bid: 1.3665, ask: 1.3667, change: 0.0020, changePercent: 0.15 },
    { pair: 'EUR/GBP', bid: 0.8631, ask: 0.8633, change: 0.0015, changePercent: 0.17 },
  ]);
  
  const [highlightedPair, setHighlightedPair] = useState<string | null>(null);

  // Simulate market data changes
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketData(prevData => {
        const newData = [...prevData];
        
        // Randomly select a currency pair to update
        const randomIndex = Math.floor(Math.random() * newData.length);
        const pairToUpdate = newData[randomIndex];
        
        // Generate random price changes
        const bidChange = (Math.random() * 0.0020) - 0.0010;
        const newBid = parseFloat((pairToUpdate.bid + bidChange).toFixed(4));
        const newAsk = parseFloat((newBid + 0.0002).toFixed(4));
        
        // Calculate change values
        const newChange = parseFloat((bidChange).toFixed(4));
        const newChangePercent = parseFloat(((newChange / pairToUpdate.bid) * 100).toFixed(2));
        
        // Update the currency pair with new values
        newData[randomIndex] = {
          ...pairToUpdate,
          bid: newBid,
          ask: newAsk,
          change: pairToUpdate.change + newChange,
          changePercent: parseFloat((pairToUpdate.changePercent + newChangePercent).toFixed(2))
        };
        
        // Highlight the updated pair
        setHighlightedPair(pairToUpdate.pair);
        
        return newData;
      });
    }, 2000); // Update every 2 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  // Clear highlight after animation
  useEffect(() => {
    if (highlightedPair) {
      const timeout = setTimeout(() => {
        setHighlightedPair(null);
      }, 1000);
      
      return () => clearTimeout(timeout);
    }
  }, [highlightedPair]);

  return (
    <div className="w-full overflow-hidden">
      <div 
        className="rounded-xl p-4"
        style={{
          backgroundColor: theme === 'silver' ? 'rgba(176, 180, 185, 0.15)' : 'rgba(21, 23, 25, 0.7)',
          backdropFilter: 'blur(10px)',
          border: theme === 'silver' ? '1px solid rgba(201, 204, 207, 0.5)' : '1px solid rgba(44, 49, 55, 0.8)',
          boxShadow: '0 8px 32px rgba(14, 31, 53, 0.15)'
        }}
      >
        <h3 
          className="text-2xl font-bold mb-4 text-center"
          style={{
            color: '#ffffff',
            textShadow: '0 0 8px rgba(0, 169, 224, 0.3)'
          }}
        >
          Live Market Data
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr
                style={{
                  borderBottom: theme === 'silver' ? '1px solid rgba(201, 204, 207, 0.5)' : '1px solid rgba(44, 49, 55, 0.8)',
                }}
              >
                <th 
                  className="py-2 px-3 text-left"
                  style={{
                    color: theme === 'silver' ? '#515969' : '#B7BCCD'
                  }}
                >
                  Pair
                </th>
                <th 
                  className="py-2 px-3 text-right"
                  style={{
                    color: theme === 'silver' ? '#515969' : '#B7BCCD'
                  }}
                >
                  Bid
                </th>
                <th 
                  className="py-2 px-3 text-right"
                  style={{
                    color: theme === 'silver' ? '#515969' : '#B7BCCD'
                  }}
                >
                  Ask
                </th>
                <th 
                  className="py-2 px-3 text-right"
                  style={{
                    color: theme === 'silver' ? '#515969' : '#B7BCCD'
                  }}
                >
                  Change
                </th>
              </tr>
            </thead>
            <tbody>
              {marketData.map((data) => (
                <tr 
                  key={data.pair}
                  className={`transition-all duration-500 ${data.pair === highlightedPair ? 'bg-opacity-30' : 'bg-opacity-0'}`}
                  style={{
                    backgroundColor: data.pair === highlightedPair 
                      ? (data.change >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)')
                      : 'transparent',
                    transition: 'background-color 0.5s ease'
                  }}
                >
                  <td 
                    className="py-3 px-3 font-medium"
                    style={{
                      color: '#ffffff'
                    }}
                  >
                    {data.pair}
                  </td>
                  <td 
                    className="py-3 px-3 text-right font-mono"
                    style={{
                      color: '#ffffff'
                    }}
                  >
                    {data.bid.toFixed(4)}
                  </td>
                  <td 
                    className="py-3 px-3 text-right font-mono"
                    style={{
                      color: '#ffffff'
                    }}
                  >
                    {data.ask.toFixed(4)}
                  </td>
                  <td 
                    className="py-3 px-3 text-right flex items-center justify-end"
                  >
                    <span
                      className="inline-flex items-center"
                      style={{
                        color: data.change >= 0 ? '#10B981' : '#EF4444'
                      }}
                    >
                      {data.change >= 0 ? <FaArrowUp className="mr-1" size={10} /> : <FaArrowDown className="mr-1" size={10} />}
                      {Math.abs(data.change).toFixed(4)} ({Math.abs(data.changePercent).toFixed(2)}%)
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Animated highlight border */}
        <div 
          className="w-full h-px mt-2"
          style={{
            background: 'linear-gradient(to right, transparent, rgba(0, 169, 224, 0.7), transparent)',
            boxShadow: '0 0 8px rgba(0, 169, 224, 0.5)'
          }}
        />
      </div>
    </div>
  );
};

export default LiveMarketData;