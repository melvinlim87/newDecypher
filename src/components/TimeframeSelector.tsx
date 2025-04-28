import React from 'react';
import { Clock } from 'lucide-react';

export const TIMEFRAMES = [
  { id: 'M1', name: '1 Minute', description: 'Short-term scalping' },
  { id: 'M5', name: '5 Minutes', description: 'Intraday trading' },
  { id: 'M15', name: '15 Minutes', description: 'Swing trading' },
  { id: 'H1', name: '1 Hour', description: 'Medium-term trends' },
  { id: 'H4', name: '4 Hours', description: 'Major trend shifts' },
  { id: 'D1', name: 'Daily', description: 'Long-term analysis' },
] as const;

export type TimeframeId = typeof TIMEFRAMES[number]['id'];

interface TimeframeSelectorProps {
  selectedTimeframe: TimeframeId;
  onTimeframeSelect: (timeframeId: TimeframeId) => void;
  disabled?: boolean;
}

export function TimeframeSelector({ selectedTimeframe, onTimeframeSelect, disabled }: TimeframeSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
      {TIMEFRAMES.map((timeframe) => (
        <button
          key={timeframe.id}
          onClick={() => onTimeframeSelect(timeframe.id)}
          disabled={disabled}
          className={`p-3 rounded-lg border ${
            selectedTimeframe === timeframe.id
             ? 'glass-effect border-[#00A9E0]/50 bg-[#00A9E0]/20'
              : 'glass-effect border-white/5 hover:border-white/10'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
               <Clock className="w-4 h-4 text-[#00A9E0]" />
                <h3 className="text-sm font-medium text-white">{timeframe.name}</h3>
              </div>
             <p className="text-xs text-white app-text mt-1">{timeframe.description}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}