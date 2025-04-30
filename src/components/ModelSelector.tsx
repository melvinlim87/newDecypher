import React from 'react';
import { Check } from 'lucide-react';

type Model = {
  id: string;
  name: string;
  description: string;
  premium: boolean;
  creditCost: number;
  beta: boolean;
};

interface ModelSelectorProps {
  models: Model[];
  selectedModel: string;
  onModelSelect: (modelId: string) => Promise<void>;
  disabled?: boolean;
}

export function ModelSelector({ models, selectedModel, onModelSelect, disabled }: ModelSelectorProps) {
  if (!models || models.length === 0) return <div>Loading models...</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      {models.map((model) => (
        <button
          key={model.id}
          onClick={async () => {
            if (model.id !== selectedModel) {
              await onModelSelect(model.id);
            }
          }}
          disabled={disabled}
          className={`p-3 rounded-lg border ${
            selectedModel === model.id
              ? 'glass-effect border-[#00A9E0]/50 bg-[#00A9E0]/20'
              : 'glass-effect border-white/5 hover:border-white/10'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-white">{model.name}</h3>
              <p className="text-xs text-white app-text">{model.description}</p>
            </div>
            {selectedModel === model.id && (
              <Check className="w-4 h-4 text-[#00A9E0] flex-shrink-0 animate-in fade-in" />
            )}
          </div>
        </button>
      ))}
    </div>
  );
}