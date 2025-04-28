import React from 'react';
import { Check } from 'lucide-react';

// Available symbols with descriptions
export const AVAILABLE_SYMBOLS = [
  { id: 'EURUSD', name: 'EUR/USD', description: 'Euro / US Dollar' },
  { id: 'GBPUSD', name: 'GBP/USD', description: 'British Pound / US Dollar' },
  { id: 'USDJPY', name: 'USD/JPY', description: 'US Dollar / Japanese Yen' },
  { id: 'AUDUSD', name: 'AUD/USD', description: 'Australian Dollar / US Dollar' },
  { id: 'USDCAD', name: 'USD/CAD', description: 'US Dollar / Canadian Dollar' },
  { id: 'USDCHF', name: 'USD/CHF', description: 'US Dollar / Swiss Franc' },
  { id: 'NZDUSD', name: 'NZD/USD', description: 'New Zealand Dollar / US Dollar' },
  { id: 'BTCUSD', name: 'BTC/USD', description: 'Bitcoin / US Dollar' },
  { id: 'ETHUSD', name: 'ETH/USD', description: 'Ethereum / US Dollar' },
  { id: 'XAUUSD', name: 'XAU/USD', description: 'Gold / US Dollar' },
  { id: 'US30', name: 'US30', description: 'Dow Jones Industrial Average' },
  { id: 'SPX500', name: 'SPX500', description: 'S&P 500 Index' },
  { id: 'NAS100', name: 'NAS100', description: 'Nasdaq 100 Index' }
];

interface SymbolSelectorProps {
  selectedSymbol: string;
  onSymbolSelect: (symbolId: string) => void;
  disabled?: boolean;
}

export function SymbolSelector({ selectedSymbol, onSymbolSelect, disabled }: SymbolSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      {AVAILABLE_SYMBOLS.map((symbol) => (
        <button
          key={symbol.id}
          onClick={() => {
            // If clicking the selected symbol, deselect it
            if (symbol.id === selectedSymbol) {
              onSymbolSelect('');
            } else {
              onSymbolSelect(symbol.id);
            }
          }}
          disabled={disabled}
          className={`p-3 rounded-lg border ${
            selectedSymbol === symbol.id
             ? 'glass-effect border-[#00A9E0]/50 bg-[#00A9E0]/20'
              : 'glass-effect border-white/5 hover:border-white/10'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-white">{symbol.name}</h3>
             <p className="text-xs text-white app-text">{symbol.description}</p>
            </div>
            {selectedSymbol === symbol.id && (
             <Check className="w-4 h-4 text-[#00A9E0] flex-shrink-0 animate-in fade-in" />
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
