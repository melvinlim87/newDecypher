import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface HistoryItem {
  id: string;
  type: 'market-analysis' | 'ea-generator' | 'chat-conversation';
  title: string;
  content: string;
  timestamp: string;
}

interface LoadHistoryModalProps {
  item: HistoryItem;
  onConfirm: () => void;
  onCancel: () => void;
}

export function LoadHistoryModal({ item, onConfirm, onCancel }: LoadHistoryModalProps) {
  const { theme } = useTheme();
  
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="rounded-lg p-6 max-w-md w-full mx-4 shadow-xl app-card">
        <h3 className="text-xl font-semibold mb-2 text-white">
          Load History
        </h3>
        <p className="mb-6 text-white">
          Do you want to load this history item?
          <br />
          <span className="text-sm mt-1 block truncate text-white">
            {item.title || formatTimestamp(item.timestamp)}
          </span>
        </p>
        
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium rounded-lg transition-colors app-button-secondary text-white"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium rounded-lg transition-colors app-button text-white"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
