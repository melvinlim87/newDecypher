import React, { useState } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { ImageUploader } from './ImageUploader';

interface ImageSelectorProps {
  onImageSelect: (url: string) => void;
  isLoading: boolean;
}

export function ImageSelector({ onImageSelect, isLoading }: ImageSelectorProps) {
  const [mode, setMode] = useState<'upload' | 'generate' | null>(null);

  if (mode === 'upload') {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-200">Upload Image</h3>
          <button
            onClick={() => setMode(null)}
            className="text-gray-400 hover:text-gray-300"
          >
            Back
          </button>
        </div>
        <ImageUploader onImageSelect={onImageSelect} isLoading={isLoading} />
      </div>
    );
  }

  if (mode === 'generate') {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-200">Generate Image</h3>
          <button
            onClick={() => setMode(null)}
            className="text-gray-400 hover:text-gray-300"
          >
            Back
          </button>
        </div>
        <div className="p-6 border border-gray-800 rounded-lg bg-gray-900/50">
          <p className="text-gray-300 text-center">
            Image generation feature coming soon...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <button
        onClick={() => setMode('upload')}
        className="p-6 border border-gray-800 rounded-lg bg-gray-900/50 hover:bg-gray-800/50 transition-colors flex flex-col items-center justify-center space-y-2"
        disabled={isLoading}
      >
        <Upload className="w-8 h-8 text-indigo-400" />
        <span className="text-gray-200">Upload Image</span>
      </button>
      <button
        onClick={() => setMode('generate')}
        className="p-6 border border-gray-800 rounded-lg bg-gray-900/50 hover:bg-gray-800/50 transition-colors flex flex-col items-center justify-center space-y-2"
        disabled={isLoading}
      >
        <ImageIcon className="w-8 h-8 text-indigo-400" />
        <span className="text-gray-200">Generate Image</span>
      </button>
    </div>
  );
}
