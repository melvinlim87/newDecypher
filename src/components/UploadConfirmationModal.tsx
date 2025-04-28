import React from 'react';
import { X, Loader2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface UploadConfirmationModalProps {
  onClose: () => void;
  onUploadMore: () => void;
  onAnalyze: () => void;
  charts: string[];
  isAnalyzing: boolean;
}

export const UploadConfirmationModal: React.FC<UploadConfirmationModalProps> = ({
  onClose,
  onUploadMore,
  onAnalyze,
  charts,
  isAnalyzing
}) => {
  const { theme } = useTheme();
  
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div 
        className={`rounded-lg p-6 max-w-4xl w-full mx-4 shadow-xl ${
          theme !== 'dark' ? 'bg-white' : ''
        }`} 
        style={{
          background: 'linear-gradient(145deg, #0a192f 0%, #0a5e70 100%)',
          padding: '25px',
          borderRadius: '12px',
          boxShadow: '0 0 30px rgba(0, 229, 255, 0.3), inset 0 0 20px rgba(0, 229, 255, 0.2)',
          border: '1px solid rgba(0, 229, 255, 0.3)'
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 
            className="text-xl font-semibold text-white"
            style={{textShadow: '0 0 8px rgba(0, 229, 255, 0.5)'}}
          >
            Upload More Timeframe for More Comprehensive Analysis?
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={onUploadMore}
              className="px-4 py-2 rounded-lg text-white font-medium transition-all duration-300"
              style={{
                background: 'rgba(0, 229, 255, 0.2)',
                border: '1px solid rgba(0, 229, 255, 0.5)',
                boxShadow: '0 0 15px rgba(0, 229, 255, 0.2)',
              }}
              onMouseOver={e => {
                e.currentTarget.style.background = 'rgba(0, 229, 255, 0.3)';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 229, 255, 0.4)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = 'rgba(0, 229, 255, 0.2)';
                e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 229, 255, 0.2)';
              }}
            >
              Upload More
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-white hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="mb-4">
          <p 
            className="text-white"
          >
            Charts to analyze ({charts.length}):
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {charts.map((url, index) => (
            <div key={index} className="relative">
              <img
                src={url}
                alt={`Chart ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg"
                style={{
                  border: '1px solid rgba(0, 229, 255, 0.3)',
                  boxShadow: '0 0 10px rgba(0, 229, 255, 0.2)'
                }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-white transition-all duration-300"
            style={{
              background: 'rgba(10, 25, 47, 0.7)',
              border: '1px solid rgba(0, 229, 255, 0.2)',
            }}
            onMouseOver={e => {
              e.currentTarget.style.background = 'rgba(10, 25, 47, 0.9)';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = 'rgba(10, 25, 47, 0.7)';
              e.currentTarget.style.color = '';
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onClose();
              onAnalyze();
            }}
            className="px-4 py-2 rounded-lg text-white font-medium transition-all duration-300"
            style={{
              background: 'rgba(0, 229, 255, 0.2)',
              border: '1px solid rgba(0, 229, 255, 0.5)',
              boxShadow: '0 0 15px rgba(0, 229, 255, 0.2)',
            }}
            onMouseOver={e => {
              e.currentTarget.style.background = 'rgba(0, 229, 255, 0.3)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 229, 255, 0.4)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = 'rgba(0, 229, 255, 0.2)';
              e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 229, 255, 0.2)';
            }}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </div>
            ) : (
              `Analyze Now (${charts.length} ${charts.length === 1 ? 'chart' : 'charts'})`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};