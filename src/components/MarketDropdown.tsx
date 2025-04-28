import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MarketItem {
  label: string;
  symbol: string;
}

export const forexPairs: MarketItem[] = [
  { label: 'AUD/CAD', symbol: 'AUDCAD' },
  { label: 'AUD/CHF', symbol: 'AUDCHF' },
  { label: 'AUD/JPY', symbol: 'AUDJPY' },
  { label: 'AUD/NZD', symbol: 'AUDNZD' },
  { label: 'AUD/USD', symbol: 'AUDUSD' },
  { label: 'CAD/CHF', symbol: 'CADCHF' },
  { label: 'CAD/JPY', symbol: 'CADJPY' },
  { label: 'CHF/JPY', symbol: 'CHFJPY' },
  { label: 'EUR/AUD', symbol: 'EURAUD' },
  { label: 'EUR/CAD', symbol: 'EURCAD' },
  { label: 'EUR/CHF', symbol: 'EURCHF' },
  { label: 'EUR/GBP', symbol: 'EURGBP' },
  { label: 'EUR/JPY', symbol: 'EURJPY' },
  { label: 'EUR/NZD', symbol: 'EURNZD' },
  { label: 'EUR/USD', symbol: 'EURUSD' },
  { label: 'GBP/CHF', symbol: 'GBPCHF' },
  { label: 'GBP/JPY', symbol: 'GBPJPY' },
  { label: 'GBP/USD', symbol: 'GBPUSD' },
  { label: 'GOLD', symbol: 'GOLD' },
  { label: 'NZD/JPY', symbol: 'NZDJPY' },
  { label: 'NZD/USD', symbol: 'NZDUSD' },
  { label: 'USD/CAD', symbol: 'USDCAD' },
  { label: 'USD/CHF', symbol: 'USDCHF' },
  { label: 'USD/JPY', symbol: 'USDJPY' },
];

export const indexes: MarketItem[] = [
  { label: 'DJI', symbol: '_DJI' },
  { label: 'NQ100', symbol: '_NQ100' },
  { label: 'NQCOMP', symbol: '_NQCOMP' },
  { label: 'SP500', symbol: '_SP500' },
];

export const cfds: MarketItem[] = [
  { label: 'HPQ', symbol: '#HPQ' },
  { label: 'IBM', symbol: '#IBM' },
  { label: 'INTC', symbol: '#INTC' },
  { label: 'MSFT', symbol: '#MSFT' },
  { label: 'QQQ', symbol: '#QQQ' },
  { label: 'SPY', symbol: '#SPY' },
  { label: 'T', symbol: '#T' },
  { label: 'XOM', symbol: '#XOM' },
];

interface SubMenuProps {
  label: string;
  items: MarketItem[];
  onSelect: (category: string, symbol: string) => void;
}

function SubMenu({ label, items, onSelect }: SubMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        className="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-300 hover:bg-indigo-500/20"
      >
        <span>{label}</span>
        <ChevronRight className="w-4 h-4 text-indigo-300" />
      </button>

      {isOpen && (
        <div className="absolute left-full top-0 w-48 rounded-md shadow-lg bg-gray-900 ring-1 ring-black ring-opacity-5">
          <div className="py-1 max-h-[calc(100vh-100px)] overflow-y-auto scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-indigo-500">
            {items.map((item) => (
              <button
                key={item.symbol}
                onClick={() => onSelect(label, item.symbol)}
                className="block w-full px-4 py-2 text-sm text-gray-300 hover:bg-indigo-500/20 text-left whitespace-nowrap"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function MarketDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleItemClick = (category: string, symbol: string) => {
    const formattedCategory = category.toLowerCase();
    const formattedSymbol = symbol
      .replace('/', '-')
      .replace('#', '')
      .replace('_', '');
    navigate(`/market/${formattedCategory}/${formattedSymbol}`);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        className="flex items-center px-4 py-2 rounded-lg hover:bg-indigo-500/20 transition-colors"
      >
        <span className="text-indigo-200 mr-1">Market</span>
        <ChevronDown className="w-4 h-4 text-indigo-300" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-gray-900 ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            <SubMenu label="Forex" items={forexPairs} onSelect={handleItemClick} />
            <SubMenu label="Indexes" items={indexes} onSelect={handleItemClick} />
            <SubMenu label="CFDs" items={cfds} onSelect={handleItemClick} />
          </div>
        </div>
      )}
    </div>
  );
}
