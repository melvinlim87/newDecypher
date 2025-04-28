import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  LineChart, 
  TrendingUp, 
  Gauge, 
  Target,
  AlertCircle,
  X
} from 'lucide-react';
import { ImageUploader } from '../components/ImageUploader';
import { ModelSelector } from '../components/ModelSelector';
import { Button } from '../components/Button';
import { analyzeImage, AVAILABLE_MODELS, type ModelId } from '../services/openrouter';
import { ComprehensiveAnalyzer } from './ComprehensiveAnalyzer';

export function Analyzer() {
  const [images, setImages] = useState<{ url: string; timeframe?: string }[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelId>(AVAILABLE_MODELS[0].id);
  const [currentAnalysisModel, setCurrentAnalysisModel] = useState<string | null>(null);
  const [activeAnalyzer, setActiveAnalyzer] = useState<'ai' | 'comprehensive'>('ai');

  const handleReset = () => {
    // Cleanup previous image URLs
    images.forEach(image => {
      if (image.url.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(image.url);
        } catch (error) {
          console.error('Error revoking URL:', error);
        }
      }
    });
    
    setImages([]);
    setSelectedImage(null);
    setAnalysis(null);
    setTimeframe(null);
    setError(null);
    setCurrentAnalysisModel(null);
  };

  const handleImageSelect = async (url: string) => {
    // Add new image to the list
    setImages(prev => [...prev, { url }]);
    
    // Automatically analyze the newly uploaded image
    setIsLoading(true);
    setTimeframe(null);
    setError(null);
    setCurrentAnalysisModel(AVAILABLE_MODELS.find(m => m.id === selectedModel)?.name || null);

    try {
      const result = await analyzeImage(url, selectedModel);
      setAnalysis(result);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(
        err instanceof Error 
          ? err.message 
          : 'Failed to analyze chart. Please ensure:\n\n' +
            '1. The image is clear and readable\n' +
            '2. Your internet connection is stable\n' +
            '3. You have sufficient tokens'
      );
      setAnalysis(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (images.length === 0) {
      setError('Please upload at least one chart image to analyze.\n\nSupported formats: PNG, JPG, JPEG');
      return;
    }

    setIsLoading(true);
    setTimeframe(null);
    setError(null);
    setCurrentAnalysisModel(AVAILABLE_MODELS.find(m => m.id === selectedModel)?.name || null);

    try {
      // Analyze all images
      const results = await Promise.all(
        images.map(image => analyzeImage(image.url, selectedModel))
      );

      if (results.length === 0) {
        throw new Error(
          'No analysis results received. Please ensure:\n\n' +
          '1. The images are valid chart screenshots\n' +
          '2. The charts show clear price action\n' +
          '3. Technical indicators are visible'
        );
      }
      
      // Combine all analyses into one comprehensive report
      const combinedAnalysis = results.join('\n\n---\n\n');
      setAnalysis(combinedAnalysis);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(
        err instanceof Error 
          ? err.message 
          : 'Failed to analyze charts. Please ensure:\n\n' +
            '1. The images are clear and readable\n' +
            '2. Your internet connection is stable\n' +
            '3. You have sufficient tokens'
      );
      setAnalysis(null);
    } finally {
      setIsLoading(false);
    }
  };

  const removeImage = (index: number) => {
    const imageToRemove = images[index];
    if (imageToRemove.url.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(imageToRemove.url);
      } catch (error) {
        console.error('Error revoking URL:', error);
      }
    }
    setImages(prev => prev.filter((_, i) => i !== index));
    if (selectedImage === imageToRemove.url) {
      setSelectedImage(null);
    }
  };

  const handleModelSelect = async (modelId: ModelId) => {
    setSelectedModel(modelId);
  };

  // Cleanup effect when component unmounts
  React.useEffect(() => {
    return () => {
      images.forEach(image => {
        if (image.url.startsWith('blob:')) {
          try {
            URL.revokeObjectURL(image.url);
          } catch (error) {
            console.error('Error cleaning up URL:', error);
          }
        }
      });
    };
  }, [images]);

  // Update timeframe when analysis changes
  React.useEffect(() => {
    if (analysis) {
      const newTimeframe = extractTimeframe(analysis);
      if (newTimeframe) {
        setTimeframe(newTimeframe);
      }
    }
  }, [analysis]);

  // Cleanup single image URL
  const cleanupImageUrl = (url: string) => {
    if (url.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error revoking URL:', error);
      }
    }
  };

  // Component unmount cleanup
  React.useEffect(() => {
    return () => {
      images.forEach(image => cleanupImageUrl(image.url));
    };
  }, []);

  function formatTechnicalIndicators(indicators: string | null): React.ReactNode {
    if (!indicators) {
      return (
        <div className="glass-effect gradient-border rounded-lg p-6 bg-[#1a1f37]/50">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="flex items-center gap-2 justify-center mb-4">
                <span className="text-2xl opacity-50">🎯</span>
                <span className="text-2xl opacity-50">📊</span>
              </div>
              <p className="text-gray-400">No technical indicators available</p>
              <p className="text-sm text-gray-500 mt-2">Technical indicators will appear here when detected in the chart</p>
            </div>
          </div>
        </div>
      );
    }

    const formattedIndicators = [];
    
    // RSI Pattern - now includes "Not Visible" check
    const rsiPattern = /🎯\s*\*RSI INDICATOR\*\s*\n?(Not Visible|Current Values:\s*([^\n]*)\n?Signal:\s*([^\n]*)\n?Analysis:([\s\S]*?)(?=(?:📊|\n\n|$)))/;
    const rsiMatch = indicators.match(rsiPattern);
    
    if (rsiMatch) {
      if (rsiMatch[0].includes('Not Visible')) {
        formattedIndicators.push({
          name: 'RSI',
          currentValues: 'Not Visible',
          signal: 'N/A',
          analysis: 'RSI indicator is not visible in the chart'
        });
      } else {
        formattedIndicators.push({
          name: 'RSI',
          currentValues: rsiMatch[2]?.trim() || 'Not Available',
          signal: rsiMatch[3]?.trim() || 'N/A',
          analysis: rsiMatch[4]?.trim().replace(/^-\s*/gm, '') || ''
        });
      }
    }

    // MACD Pattern
    const macdPattern = /📊\s*\*MACD INDICATOR\*\s*\n?(Not Visible|Current Values:\s*([^\n]*)\n?Signal:\s*([^\n]*)\n?Analysis:([\s\S]*?)(?=\n\n|$))/;
    const macdMatch = indicators.match(macdPattern);
    
    if (macdMatch) {
      if (macdMatch[0].includes('Not Visible')) {
        formattedIndicators.push({
          name: 'MACD',
          currentValues: 'Not Visible',
          signal: 'N/A',
          analysis: 'MACD indicator is not visible in the chart'
        });
      } else {
        formattedIndicators.push({
          name: 'MACD',
          currentValues: macdMatch[2]?.trim() || 'Not Available',
          signal: macdMatch[3]?.trim() || 'N/A',
          analysis: macdMatch[4]?.trim().replace(/^-\s*/gm, '') || ''
        });
      }
    }

    // If no indicators were found, show a message
    if (formattedIndicators.length === 0) {
      return (
        <div className="glass-effect gradient-border rounded-lg p-6 bg-[#1a1f37]/50">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="flex items-center gap-2 justify-center mb-4">
                <span className="text-2xl opacity-50">🎯</span>
                <span className="text-2xl opacity-50">📊</span>
              </div>
              <p className="text-gray-400">No technical indicators detected</p>
              <p className="text-sm text-gray-500 mt-2">Technical indicators will appear here when detected in the chart</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-6">
        {formattedIndicators.map((indicator, index) => (
          <div key={index} className="glass-effect gradient-border rounded-lg p-6 bg-[#1a1f37]/50">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-2xl">{indicator.name === 'RSI' ? '🎯' : '📊'}</span>
              <h4 className="font-semibold text-white">{indicator.name} INDICATOR</h4>
            </div>
            <div className="space-y-6">
              <div>
                <p className="text-sm text-gray-400 mb-2">Current Values</p>
                <p className="text-lg font-bold text-white">{indicator.currentValues}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-2">Signal</p>
                <p className="text-lg font-bold text-amber-400">{indicator.signal}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-2">Analysis</p>
                <p className="text-white">{indicator.analysis}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  function extractValue(analysis: string, key: string, section?: string): string | null {
    const lines = analysis.split('\n');
    let inSection = !section;
    let currentSection = '';

    // Special handling for Symbol
    if (key === 'Symbol') {
      for (const line of lines) {
        if (line.toLowerCase().includes('symbol:')) {
          const value = line.split(':')[1]?.trim();
          if (value && value !== 'Not Visible' && value !== 'undefined' && value !== 'null') {
            return value;
          }
        }
      }
      return null;
    }
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Special handling for Price Movement section
      if (key === 'Price Movement' && line.includes('TECHNICAL ANALYSIS')) {
        let movement = '';
        i++; // Skip the header line
        
        while (i < lines.length && !lines[i].includes('TECHNICAL INDICATORS')) {
          const movementLine = lines[i].trim();
          if (movementLine && !movementLine.match(/^[📊📈💡🤖]$/)) {
            movement += (movement ? ' ' : '') + movementLine;
          }
          i++;
        }
        return movement.trim();
      }
      
      // Special handling for Action
      if (key === 'Action' && line.includes('Action:')) {
        const match = line.match(/Action:\s*([A-Z]+)/i);
        const action = match?.[1]?.trim()?.toUpperCase();
        if (!action || !['BUY', 'SELL', 'HOLD'].includes(action)) {
          return 'HOLD'; // Default to HOLD if no valid action is found
        }
        return action;
      }

      // Special handling for Technical Indicators section
      if (key === 'Technical Indicators' && line.includes('TECHNICAL INDICATORS')) {
        const indicatorText = [];
        i++; // Skip the "Technical Indicators:" line
        
        while (i < lines.length && !lines[i].includes('TRADING SIGNAL')) {
          const indicatorLine = lines[i].trim();
          // Include all non-empty lines that aren't just emojis
          if (indicatorLine && !indicatorLine.match(/^[📊📈💡🤖]$/)) {
            indicatorText.push(indicatorLine);
          }
          i++;
        }
        return indicatorText.join('\n').trim() || null;
      }
      
      // Special handling for Signal Reasoning
      if (key === 'Technical Analysis' && (line.includes('Signal Reasoning:') || line.includes('SIGNAL REASONING'))) {
        let reasoning = [];
        let currentContext = '';
        
        // Get support and resistance levels
        const supportLevels = extractValue(analysis, 'Support Levels');
        const resistanceLevels = extractValue(analysis, 'Resistance Levels');
        
        // Add support/resistance analysis
        if (supportLevels && resistanceLevels) {
          reasoning.push(`Support levels at ${supportLevels} and resistance at ${resistanceLevels} indicate the current trading range.`);
        }
        
        // Get the initial technical analysis
        const initialReasoning = line.split(/Signal Reasoning:|SIGNAL REASONING/)[1]?.trim();
        if (initialReasoning) {
          // Split into meaningful chunks while preserving context
          const chunks = initialReasoning.split(/(?<=[.!?])\s+/);
          chunks.forEach(chunk => {
            if (chunk.trim()) {
              reasoning.push(chunk.trim());
            }
          });
        }
        
        i++; // Move to next line
        while (i < lines.length && !lines[i].includes('Success Rate:') && !lines[i].includes('Confidence Level:')) {
          const reasoningLine = lines[i].trim();
          if (reasoningLine && !reasoningLine.match(/^[📊📈💡🤖]$/) && reasoningLine.length > 10) {
            // Accumulate context until we find a sentence boundary
            currentContext += ' ' + reasoningLine;
            if (currentContext.match(/[.!?]\s*$/)) {
              reasoning.push(currentContext.trim());
              currentContext = '';
            }
          }
          i++;
        }
        
        // Add any remaining context
        if (currentContext.trim()) {
          reasoning.push(currentContext.trim());
        }
        
        // Get technical indicators summary
        const indicators = extractValue(analysis, 'Technical Indicators');
        if (indicators) {
          const indicatorLines = indicators.split('\n');
          for (const line of indicatorLines) {
            if (line.includes('Analysis:')) {
              const analysis = line.split('Analysis:')[1]?.trim();
              if (analysis && analysis.length > 10) {
                reasoning.push(analysis);
              }
            }
          }
        }
        
        // Filter and clean up the reasoning points
        const cleanedReasoning = reasoning
          .filter(point => point && point.length > 10) // Remove empty or very short points
          .map(point => point.replace(/^[•-]\s*/, '').trim()) // Remove leading bullets
          .filter((point, index, self) => self.indexOf(point) === index); // Remove duplicates
        
        return cleanedReasoning.join('. ').trim() || 'No technical analysis available';
      }

      // Handle regular key-value pairs
      if (!line || line.match(/^[📊📈💡🤖]$/) || line.startsWith('**')) {
        // Skip empty lines and emoji-only lines
        continue;
      } else if (line.toLowerCase().includes(key.toLowerCase())) {
        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) {
          continue;
        }
        
        const value = line.substring(colonIndex + 1).trim();

        const cleanValue = value
          .replace(/[\[\]]/g, '')  // Remove square brackets
          .replace(/^[-•]/g, '')   // Remove leading bullet points
          .replace(/\*/g, '')    // Remove all asterisks
          .replace(/^[0-9]+\.\s+/, '') // Remove numbered lists
          .trim();
        
        if (cleanValue === 'Not Visible' || cleanValue === '' || cleanValue === 'undefined' || cleanValue === 'null') {
          return 'N/A';
        }
        return cleanValue;
      }
    }
    
    return null;
  }

  function extractConfidenceLevel(analysis: string): number {
    const lines = analysis.split('\n');
    for (const line of lines) {
      if (line.includes('Confidence Level:')) {
        const match = line.match(/(\d+)%?/);
        if (match) {
          const value = parseInt(match[1]);
          return isNaN(value) ? 75 : Math.min(100, Math.max(0, value));
        }
      }
    }
    return 75; // Default confidence level if not found
  }

  function extractTimeframe(analysis: string | null): string | null {
    if (!analysis) return null;
    
    const lines = analysis.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.toLowerCase().includes('timeframe:')) {
        const timeframe = trimmedLine.split(/timeframe:/i)[1]?.trim();
        
        if (timeframe) {
          const cleanTimeframe = timeframe
            .replace(/[\[\]]/g, '')  // Remove square brackets
            .trim();
          
          if (cleanTimeframe !== 'Not Visible' && 
              cleanTimeframe !== 'undefined' && 
              cleanTimeframe !== 'null') {
            return cleanTimeframe;
          }
        }
      }
    }
    
    return null;
  }

  function formatTimeframe(timeframe: string | null): string {
    if (!timeframe) return '';
    
    // Convert MX to Xm, DX to XD, WX to XW, MNX to XM
    const mapping: { [key: string]: string } = {
      'M': 'm',  // Minutes
      'H': 'h',  // Hours
      'D': 'D',  // Days
      'W': 'W',  // Weeks
      'MN': 'M'  // Months
    };

    // Handle special case for months (MN1 -> 1M)
    if (timeframe.startsWith('MN')) {
      const number = timeframe.slice(2);
      return `${number}M`;
    }

    // For other timeframes (M15 -> 15m, D1 -> 1D, W1 -> 1W)
    const unit = timeframe[0];
    const number = timeframe.slice(1);
    
    if (mapping[unit]) {
      return unit === 'D' || unit === 'W' 
        ? `${number}${mapping[unit]}` // 1D, 1W
        : `${number}${mapping[unit]}`; // 15m, 1h
    }
    
    return timeframe;
  }

  function getActionColor(action: string | null): string {
    if (!action) return '';
    switch (action.toUpperCase().trim()) {
      case 'BUY':
        return 'text-emerald-400';
      case 'SELL':
        return 'text-red-400';
      case 'HOLD':
        return 'text-amber-400';
      default:
        return 'text-white';
    }
  }

  return (
    <div className="min-h-screen pt-20 px-4 pb-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col items-center justify-center mb-12 fade-in relative">
          <div className="relative mb-6 flex justify-center items-center w-20 h-20">
            <div className="absolute inset-0" style={{ transform: 'rotate(44.598deg)' }}>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-cyan-300 to-purple-500 opacity-100 rounded-full animate-spin-slow"></div>
            </div>
            <div className="absolute inset-0" style={{ transform: 'rotate(-187.464deg)' }}>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-cyan-300 to-blue-500 opacity-100 rounded-full animate-reverse-spin"></div>
            </div>
            <div className="absolute inset-2 bg-[#0c1f2d] rounded-full"></div>
            <div className="absolute inset-4 flex items-center justify-center">
              <Brain className="w-8 h-8 text-indigo-400" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-cyan-300 to-purple-500 opacity-20 rounded-full animate-pulse"></div>
          </div>
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 hover:from-blue-400 hover:via-indigo-400 hover:to-purple-400 transition-all duration-500 text-center mb-12">
              AI Market Analyzer
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 z-0">
              <button
                onClick={() => setActiveAnalyzer('ai')}
                className={`w-full h-24 px-6 glass-effect gradient-border rounded-xl ${
                  activeAnalyzer === 'ai' 
                    ? 'bg-indigo-500/40 ring-2 ring-indigo-500/50' 
                    : 'bg-indigo-500/20 hover:bg-indigo-500/30'
                } text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]`}
              >
                <div className="flex flex-col items-center justify-center space-y-1">
                  <span className="text-xl font-semibold">AI Market Analyzer</span>
                  <span className="text-sm text-indigo-200">Quick single-chart analysis with instant AI insights</span>
                </div>
              </button>
              <button
                onClick={() => setActiveAnalyzer('comprehensive')}
                className={`w-full h-24 px-6 glass-effect gradient-border rounded-xl ${
                  activeAnalyzer === 'comprehensive' 
                    ? 'bg-purple-500/40 ring-2 ring-purple-500/50' 
                    : 'bg-purple-500/20 hover:bg-purple-500/30'
                } text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]`}
              >
                <div className="flex flex-col items-center justify-center space-y-1">
                  <span className="text-xl font-semibold">Comprehensive Market Analyzer</span>
                  <span className="text-sm text-purple-200">Multi-timeframe analysis with correlated insights</span>
                </div>
              </button>
            </div>

            {activeAnalyzer === 'ai' ? (
              <>
                {/* Header Section */}
                <div className="flex flex-col items-center justify-center mb-6 fade-in z-0">
                  <h1 className="text-3xl font-bold text-white mb-2">AI Market Analyzer</h1>
                  <p className="text-gray-400 text-center max-w-2xl">
                    Upload your chart for instant AI-powered analysis. Get detailed insights on market structure, support/resistance levels, and precise trading signals.
                  </p>
                </div>

                <div className="glass-effect gradient-border rounded-lg p-6 mb-6 slide-up z-0">
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-indigo-200 mb-2">Select Model</h3>
                    <ModelSelector
                      selectedModel={selectedModel}
                      onModelSelect={handleModelSelect}
                      disabled={isLoading}
                    />
                  </div>
                  <ImageUploader onImageSelect={handleImageSelect} isLoading={isLoading} />
                  {images.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      {images.map((image, index) => (
                        <div 
                          key={index}
                          className={`relative glass-effect gradient-border rounded-lg p-4 cursor-pointer ${
                            selectedImage === image.url ? 'ring-2 ring-indigo-500' : ''
                          }`}
                          onClick={() => setSelectedImage(image.url)}
                        >
                          <img
                            src={image.url}
                            alt={`Chart ${index + 1}`}
                            className="w-full h-auto rounded-lg"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(index);
                            }}
                            className="absolute top-2 right-2 p-1 glass-effect gradient-border rounded-full bg-red-500/20 hover:bg-red-500/30 text-white"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {isLoading && (
                  <div className="glass-effect gradient-border rounded-lg p-6 mb-6 fade-in bg-gray-900/50">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400"></div>
                      <span className="ml-3 text-gray-400">Analyzing chart...</span>
                    </div>
                  </div>
                )}

                {analysis && (
                  <div className="space-y-6 slide-up mb-20">
                    <div className="glass-effect gradient-border bg-gradient-to-br from-purple-500/10 via-indigo-500/10 to-blue-500/10 rounded-xl p-8">
                      <div className="flex justify-between items-center mb-2">
                        <h2 className="text-3xl font-bold font-display">Market Analysis</h2>
                        {currentAnalysisModel && (
                          <span className="px-3 py-1 bg-indigo-500/20 rounded-full text-sm font-medium text-indigo-300">
                            Analyzed by {currentAnalysisModel}
                          </span>
                        )}
                      </div>
                      <p className="text-purple-100">Comprehensive technical analysis of your chart</p>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-6">
                      <div className="col-span-3 glass-effect gradient-border rounded-xl p-6">
                        {extractValue(analysis, 'Symbol') && (
                            <div className="flex items-center gap-3 mb-4">
                              <span className="px-4 py-2 bg-indigo-500/20 rounded-lg text-lg font-semibold text-indigo-300">
                                {extractValue(analysis, 'Symbol')}
                              </span>
                              <span className="px-4 py-2 bg-indigo-500/20 rounded-lg text-lg font-semibold text-indigo-300">
                                {formatTimeframe(extractValue(analysis, 'Timeframe'))}
                              </span>
                            </div>
                        )}
                        
                        <div className="flex items-center gap-3 mb-4">
                          <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 p-2 rounded-lg">
                            <LineChart className="w-6 h-6 text-white icon-pulse" />
                          </div>
                          <h3 className="text-xl font-bold text-white">Market Summary</h3>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="glass-effect gradient-border rounded-lg p-4">
                            <p className="text-sm text-indigo-200 mb-1">Current Price</p>
                            <p className="text-lg font-bold text-white">{extractValue(analysis, 'Current Price')}</p>
                          </div>
                          <div className="glass-effect gradient-border rounded-lg p-4">
                            <p className="text-sm text-indigo-200 mb-1">Support Levels</p>
                            <p className="text-lg font-bold text-white">{extractValue(analysis, 'Support Levels')}</p>
                          </div>
                          <div className="glass-effect gradient-border rounded-lg p-4">
                            <p className="text-sm text-indigo-200 mb-1">Resistance Levels</p>
                            <p className="text-lg font-bold text-white">{extractValue(analysis, 'Resistance Levels')}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-span-3 glass-effect gradient-border rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 p-2 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-white icon-slide" />
                          </div>
                          <h3 className="text-xl font-bold text-white">Price Movement</h3>
                        </div>
                        <p className="text-indigo-100 leading-relaxed">
                          {extractValue(analysis, 'Price Movement')}
                        </p>
                      </div>
                      
                      <div className="col-span-3 glass-effect gradient-border rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 p-2 rounded-lg">
                            <Gauge className="w-6 h-6 text-white icon-rotate" />
                          </div>
                          <h3 className="text-xl font-bold text-white">Technical Indicators</h3>
                        </div>
                        {formatTechnicalIndicators(extractValue(analysis, 'Technical Indicators'))}
                      </div>
                      
                      <div className="col-span-3 glass-effect gradient-border rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 p-2 rounded-lg">
                            <Target className="w-6 h-6 text-white icon-scale" />
                          </div>
                          <h3 className="text-xl font-bold text-white">Trading Signal</h3>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 mb-6">
                          <div className="glass-effect gradient-border rounded-lg p-4">
                            <p className="text-sm text-indigo-200 mb-1">Action</p>
                            <p className={`text-lg font-bold ${getActionColor(extractValue(analysis, 'Action'))}`}>
                              {extractValue(analysis, 'Action')}
                            </p>
                          </div>
                          {extractValue(analysis, 'Action') !== 'HOLD' && (
                            <>
                              <div className="glass-effect gradient-border rounded-lg p-4">
                                <p className="text-sm text-indigo-200 mb-1">Entry Price</p>
                                <p className="text-lg font-bold text-white">{extractValue(analysis, 'Entry Price')}</p>
                              </div>
                              <div className="glass-effect gradient-border rounded-lg p-4">
                                <p className="text-sm text-indigo-200 mb-1">Take Profit</p>
                                <p className="text-lg font-bold text-emerald-400">{extractValue(analysis, 'Take Profit')}</p>
                              </div>
                            </>
                          )}
                        </div>
                        
                        <div className="glass-effect gradient-border rounded-lg p-4 mb-4">
                          <p className="text-sm text-indigo-200 mb-2">Technical Analysis</p>
                          <div className="space-y-4 text-white">
                            {extractValue(analysis, 'Technical Analysis')?.split(/(?<=[.!?])\s+/)
                              .filter(point => {
                                const trimmed = point.trim();
                                return trimmed && 
                                  !trimmed.toLowerCase().includes('error') &&
                                  trimmed.length > 10 && // Filter out very short fragments
                                  !trimmed.match(/^(and|or|but|however|therefore)\s/i); // Filter out sentence fragments
                              })
                              .map((point, index) => (
                                <div key={index} className="glass-effect gradient-border bg-white/5 rounded-lg p-3">
                                  <p className="leading-relaxed text-justify flex items-start gap-3">
                                    <span className="min-w-2 h-2 w-2 rounded-full bg-indigo-400 mt-2.5 flex-shrink-0"></span>
                                    {point.trim().replace(/^[•-]\s*/, '')} {/* Remove leading bullets */}
                                  </p>
                                </div>
                              ))
                            }
                          </div>
                        </div>
                        
                        {extractValue(analysis, 'Action') !== 'HOLD' && (
                          <div className="glass-effect gradient-border rounded-lg p-4">
                            <div className="flex justify-between items-center mb-2">
                              <p className="text-sm text-indigo-200">Confidence Level</p>
                              <p className="text-sm font-medium text-white">{extractConfidenceLevel(analysis)}%</p>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-2">
                              <div 
                                className="bg-emerald-400 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${extractConfidenceLevel(analysis)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <ComprehensiveAnalyzer />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}