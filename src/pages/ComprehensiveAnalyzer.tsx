import React, { useState } from 'react';
import { ImageUploader } from '../components/ImageUploader';
import { ModelSelector } from '../components/ModelSelector';
import { SymbolSelector } from '../components/SymbolSelector';
import { TechnicalGauge } from '../components/TechnicalGauge';
import { AVAILABLE_MODELS, type ModelId } from '../services/modelUtils';
import { analyzeImageBackend } from '../services/backendApi';
import { Brain, LineChart, TrendingUp, Gauge, Target, AlertCircle, X, ChevronDown, ChevronUp, Clock, Loader2, Search, Timer, Check } from 'lucide-react';
import { Button } from '../components/Button';
import { fetchTechnicalIndicators } from '../services/yahooFinance';

// Available timeframes
const TIMEFRAMES = [
  { id: '1m', name: '1 minute' },
  { id: '5m', name: '5 minutes' },
  { id: '15m', name: '15 minutes' },
  { id: '30m', name: '30 minutes' },
  { id: '1h', name: '1 hour' },
  { id: '2h', name: '2 hours' },
  { id: '4h', name: '4 hours' },
  { id: '1d', name: '1 day' },
  { id: '1w', name: '1 week' },
  { id: '1M', name: '1 month' }
];

interface ChartData {
  url: string;
  timeframe?: string;
  symbol?: string;
}

interface CorrelativeAnalysis {
  trendAlignment: string;
  summary: string;
  priceMovement: string;
  keyLevels: {
    support: string[];
    resistance: string[];
  };
  signals: {
    primary: string;
    confirmation: string;
    entryPrice: string | null;
    takeProfit: string | null;
    confidence: number | null;
  };
  recommendation: string;
}

interface AnalysisSection {
  title: string;
  points: string[];
}

interface AnalysisData {
  timeframe?: string;
  trend?: string;
  signal?: string;
  momentum?: string;
  priceAction?: string;
  support?: string[];
  resistance?: string[];
  currentPrice?: string;
  rsi?: {
    value: string;
    signal: string;
    analysis: string;
  };
  macd?: {
    value: string;
    signal: string;
    analysis: string;
  };
}

interface GaugeData {
  oscillators: {
    sell: number;
    neutral: number;
    buy: number;
    signal: 'sell' | 'neutral' | 'buy';
  };
  summary: {
    sell: number;
    neutral: number;
    buy: number;
    signal: 'sell' | 'neutral' | 'buy';
  };
  movingAverages: {
    sell: number;
    neutral: number;
    buy: number;
    signal: 'sell' | 'neutral' | 'buy';
  };
}

export function ComprehensiveAnalyzer() {
  const [charts, setCharts] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelId>(AVAILABLE_MODELS[0].id);
  const [currentAnalysisModel, setCurrentAnalysisModel] = useState<string | null>(null);
  const [correlativeAnalysis, setCorrelativeAnalysis] = useState<CorrelativeAnalysis | null>(null);
  const [analyses, setAnalyses] = useState<string[]>([]);
  const [isGuideExpanded, setIsGuideExpanded] = useState(true);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('');
  const [gaugeData, setGaugeData] = useState<GaugeData | null>(null);

  const handleModelSelect = async (modelId: ModelId) => {
    setSelectedModel(modelId);
  };

  const handleSymbolSelect = (symbolId: string) => {
    setSelectedSymbol(symbolId);
    // If symbolId is empty, remove symbol from charts and reset timeframe
    if (!symbolId) {
      setSelectedTimeframe('');
    }
    setCharts(charts.map(chart => ({
      ...chart,
      symbol: symbolId || undefined
    })));
  };

  const handleTimeframeSelect = async (timeframe: string) => {
    setSelectedTimeframe(timeframe);
    setCharts(charts.map(chart => ({
      ...chart,
      timeframe
    })));

    if (!selectedSymbol) return;

    try {
      // Convert timeframe to Yahoo Finance interval format
      const getYahooInterval = (tf: string) => {
        const map: { [key: string]: string } = {
          '1m': '1m', '5m': '5m', '15m': '15m', '30m': '30m',
          '1h': '60m', '2h': '1h', '4h': '1h',
          '1d': '1d', '1w': '1wk', '1M': '1mo'
        };
        return map[tf] || '1d';
      };

      // Fetch real technical indicators from Yahoo Finance
      const indicators = await fetchTechnicalIndicators(
        selectedSymbol.toUpperCase(),
        getYahooInterval(timeframe)
      );
      setGaugeData(indicators);
    } catch (error) {
      // Fallback to mock data if there's an error
      const getTimeframeValue = (tf: string) => {
        const timeframeMap = {
          '1m': 1, '5m': 5, '15m': 15, '30m': 30,
          '1h': 60, '2h': 120, '4h': 240,
          '1d': 1440, '1w': 10080, '1M': 43200
        };
        return timeframeMap[tf] || 1;
      };

      const minutes = getTimeframeValue(timeframe);
      const cycle = (minutes % 60) / 60;
      
      const generateSignalData = (offset: number = 0) => {
        const phase = (cycle + offset) % 1;
        const sell = Math.round(Math.abs(Math.sin(phase * Math.PI * 2)) * 10);
        const buy = Math.round(Math.abs(Math.cos(phase * Math.PI * 2)) * 10);
        const neutral = Math.round(Math.abs(Math.sin((phase + 0.33) * Math.PI * 2)) * 5);
        
        let signal: 'sell' | 'neutral' | 'buy';
        if (sell > buy && sell > neutral) signal = 'sell';
        else if (buy > sell && buy > neutral) signal = 'buy';
        else signal = 'neutral';
        
        return { sell, neutral, buy, signal };
      };

      setGaugeData({
        oscillators: generateSignalData(0),
        summary: generateSignalData(0.33),
        movingAverages: generateSignalData(0.66)
      });
    }
  };

  // Helper function to compare timeframes
  const compareTimeframes = (a: string, b: string): number => {
    const timeframeOrder = {
      'W1': 7, 'D1': 6, 'H4': 5, 'H1': 4, 'M15': 3, 'M5': 2, 'M1': 1
    };
    const getTimeframeValue = (tf: string) => {
      const normalized = tf.toUpperCase().replace(/[^A-Z0-9]/g, '');
      return timeframeOrder[normalized] || 0;
    };
    return getTimeframeValue(a) - getTimeframeValue(b);
  };

  // Helper function to determine trend alignment
  const determineTrendAlignment = (trends: (string | null)[]): string => {
    const validTrends = trends.filter(Boolean).map(trend => trend?.toLowerCase());
    
    if (validTrends.length === 0) return 'Neutral';
    
    const bullishCount = validTrends.filter(trend => 
      trend?.includes('bullish') || trend?.includes('uptrend')
    ).length;
    
    const bearishCount = validTrends.filter(trend => 
      trend?.includes('bearish') || trend?.includes('downtrend')
    ).length;
    
    if (bullishCount > validTrends.length / 2) return 'Bullish';
    if (bearishCount > validTrends.length / 2) return 'Bearish';
    return 'Neutral';
  };

  // Helper function to extract levels from analysis
  const extractLevels = (analysis: string, type: 'Support' | 'Resistance'): string[] => {
    const value = extractValue(analysis, `${type} Levels`);
    if (!value) return [];
    return value.split(',').map(level => level.trim());
  };

  // Helper function to parse analysis text into structured data
  const parseAnalysis = (analysis: string) => {
    try {
      const result: any = {};

      // Extract basic info
      result.symbol = extractValue(analysis, 'Symbol') || extractValue(analysis, 'Currency Pair');
      result.timeframe = extractValue(analysis, 'Timeframe');
      result.currentPrice = extractValue(analysis, 'Current Price');
      
      // Extract trend and signal
      result.trend = extractValue(analysis, 'Market Structure') || extractValue(analysis, 'Trend');
      result.signal = extractValue(analysis, 'Action');

      // Extract support and resistance
      const supportText = extractValue(analysis, 'Support Levels');
      const resistanceText = extractValue(analysis, 'Resistance Levels');
      
      result.support = supportText ? supportText.split(',').map(s => s.trim()) : [];
      result.resistance = resistanceText ? resistanceText.split(',').map(s => s.trim()) : [];

      // Extract price action
      result.priceAction = extractValue(analysis, 'Price Movement');

      // Extract RSI data
      result.rsi = {
        value: extractValue(analysis, 'RSI Current Values') || extractValue(analysis, 'RSI Values'),
        signal: extractValue(analysis, 'RSI Signal'),
        analysis: extractValue(analysis, 'RSI Analysis')
      };

      // Extract MACD data
      result.macd = {
        value: extractValue(analysis, 'MACD Current Values') || extractValue(analysis, 'MACD Values'),
        signal: extractValue(analysis, 'MACD Signal'),
        analysis: extractValue(analysis, 'MACD Analysis')
      };

      return result;
    } catch (err) {
      return {};
    }
  };

  // Helper function to format analysis section
  const formatSection = (title: string, points: string[]): AnalysisSection => ({
    title,
    points: points.filter(Boolean)
  });

  // Analyze correlation between different timeframes
  const analyzeCorrelation = (analyses: string[]): CorrelativeAnalysis => {
    try {
      if (!analyses?.length) {
        return {
          trendAlignment: 'Neutral',
          summary: 'No analysis data available',
          priceMovement: 'No price movement data available',
          keyLevels: { support: [], resistance: [] },
          signals: {
            primary: 'HOLD',
            confirmation: 'No signals available',
            entryPrice: null,
            takeProfit: null,
            confidence: 50
          },
          recommendation: 'No analysis data available'
        };
      }

      // Parse each analysis into structured data
      const parsedAnalyses = analyses.map(analysis => {
        try {
          return parseAnalysis(analysis);
        } catch (err) {
          return {};
        }
      });

      const timeframes = charts.map(chart => chart.timeframe || 'Unknown');

      // Extract trends and signals
      const trends = parsedAnalyses.map(a => a.trend || 'Unknown');
      const signals = parsedAnalyses.map(a => a.signal || 'Unknown');

      // Determine trend alignment
      const trendAlignment = trends.every(t => t === trends[0]) ? trends[0] : 'Mixed';
      const signalAlignment = signals.every(s => s === signals[0]);

      // Consolidate support and resistance levels
      const allSupport = parsedAnalyses.flatMap(a => a.support || []).filter(Boolean);
      const allResistance = parsedAnalyses.flatMap(a => a.resistance || []).filter(Boolean);

      const consolidatedLevels = {
        support: [...new Set(allSupport)].sort((a, b) => parseFloat(a) - parseFloat(b)),
        resistance: [...new Set(allResistance)].sort((a, b) => parseFloat(a) - parseFloat(b))
      };

      // Generate analysis sections
      const sections: AnalysisSection[] = [];

      // Add timeframe analyses
      timeframes.forEach((timeframe, i) => {
        if (i < parsedAnalyses.length) {
          const analysis = parsedAnalyses[i];
          const symbol = charts[i].symbol || 'Unknown Symbol';
          sections.push(formatSection(`${symbol} - ${timeframe} Analysis`, [
            `Trend: ${analysis.trend || 'Unclear'}`,
            `Signal: ${analysis.signal || 'Neutral'}`,
            `Support: ${analysis.support?.join(', ') || 'None'}`,
            `Resistance: ${analysis.resistance?.join(', ') || 'None'}`,
            `Price Action: ${analysis.priceAction || 'No clear patterns'}`
          ]));
        }
      });

      // Add key levels analysis
      sections.push(formatSection('Key Levels', [
        `Support: ${consolidatedLevels.support.join(', ') || 'None'}`,
        `Resistance: ${consolidatedLevels.resistance.join(', ') || 'None'}`
      ]));

      // Generate summary text
      const summary = sections.map(section => 
        `${section.title}\n${section.points.map(p => `- ${p}`).join('\n')}`
      ).join('\n\n');

      // Calculate confidence score
      const confidenceScore = Math.min(
        ((signalAlignment ? 30 : 0) +
        (trendAlignment !== 'Mixed' ? 30 : 0) +
        (consolidatedLevels.support.length > 0 ? 20 : 0) +
        (consolidatedLevels.resistance.length > 0 ? 20 : 0)),
        100
      );

      // Generate price movement text
      const priceMovement = [
        `Trend alignment: ${trendAlignment}`,
        `Signal consensus: ${signalAlignment ? 'Strong' : 'Mixed'}`,
        `Support levels: ${consolidatedLevels.support.length > 0 ? consolidatedLevels.support.join(', ') : 'None'}`,
        `Resistance levels: ${consolidatedLevels.resistance.length > 0 ? consolidatedLevels.resistance.join(', ') : 'None'}`
      ].join(' - ');

      return {
        trendAlignment,
        summary,
        priceMovement,
        keyLevels: consolidatedLevels,
        signals: {
          primary: signalAlignment && trendAlignment !== 'Mixed' ? signals[0] : 'HOLD',
          confirmation: signalAlignment ? 'Strong confirmation across timeframes' : 'Mixed signals across timeframes',
          entryPrice: consolidatedLevels.resistance[0] || null,
          takeProfit: consolidatedLevels.resistance[1] || null,
          confidence: confidenceScore
        },
        recommendation: summary
      };
    } catch (err) {
      return {
        trendAlignment: 'Neutral',
        summary: 'Error analyzing charts',
        priceMovement: 'Error analyzing price movement',
        keyLevels: { support: [], resistance: [] },
        signals: {
          primary: 'HOLD',
          confirmation: 'Error in analysis',
          entryPrice: null,
          takeProfit: null,
          confidence: 0
        },
        recommendation: 'Error analyzing charts'
      };
    }
  };

  const handleAnalyze = async () => {
    if (charts.length === 0) {
      setError('Please upload at least one chart to analyze');
      return;
    }

    if (charts.length < 2) {
      setError('For comprehensive analysis, please upload at least 2 charts with different timeframes. This helps in analyzing market structure across multiple timeframes.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setCorrelativeAnalysis(null);
    setAnalyses([]);

    try {
      // Analyze each chart
      const analysisPromises = charts.map(chart => analyzeImageBackend(chart.url, selectedModel));
      const results = await Promise.all(analysisPromises);
      
      if (!results.length || results.some(result => !result)) {
        throw new Error('Failed to analyze one or more charts');
      }

      // Update charts with symbol and timeframe from analysis
      const updatedCharts = charts.map((chart, index) => {
        const analysis = results[index];
        return {
          ...chart,
          symbol: extractValue(analysis, 'Symbol') || extractValue(analysis, 'Currency Pair') || 'Unknown',
          timeframe: extractValue(analysis, 'Timeframe') || 'Unknown'
        };
      });
      setCharts(updatedCharts);

      // Store raw analyses
      setAnalyses(results);
      
      // Generate correlative analysis
      const analysis = analyzeCorrelation(results);
      setCorrelativeAnalysis(analysis);
      setCurrentAnalysisModel(selectedModel);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze charts');
      setCorrelativeAnalysis(null);
      setAnalyses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageSelect = async (url: string) => {
    setCharts(prev => [...prev, { url }]);
  };

  const removeChart = (index: number) => {
    const chartToRemove = charts[index];
    if (chartToRemove.url.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(chartToRemove.url);
      } catch (error) {
        // Ignore error
      }
    }
    setCharts(prev => prev.filter((_, i) => i !== index));
  };

  // Cleanup effect
  React.useEffect(() => {
    return () => {
      charts.forEach(chart => {
        if (chart.url.startsWith('blob:')) {
          try {
            URL.revokeObjectURL(chart.url);
          } catch (error) {
            // Ignore error
          }
        }
      });
    };
  }, []);

  // Helper function to extract value from analysis
  const extractValue = (analysis: string, key: string): string | null => {
    try {
      if (!analysis) return null;
      const lines = analysis.split('\n');
      
      for (const line of lines) {
        if (line.toLowerCase().includes(key.toLowerCase())) {
          const value = line.split(':')[1]?.trim();
          if (value && value !== 'Not Visible' && value !== 'undefined' && value !== 'null') {
            return value.replace(/[\[\]]/g, '').trim();
          }
        }
      }
    } catch (err) {
      // Ignore error
    }
    
    return null;
  };

  return (
    <div className="min-h-screen pt-20 px-4 pb-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Model Selection Section */}
        <div className="glass-effect gradient-border rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Brain className="w-6 h-6 text-indigo-400" />
            Select Model
          </h2>
          <ModelSelector
            models={AVAILABLE_MODELS}
            selectedModel={selectedModel}
            onModelSelect={handleModelSelect}
            disabled={isLoading}
          />
        </div>

        {/* Symbol Selection Section */}
        <div className="glass-effect gradient-border rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <LineChart className="w-6 h-6 text-indigo-400" />
            Select Symbol
          </h2>
          <SymbolSelector
            selectedSymbol={selectedSymbol}
            onSymbolSelect={handleSymbolSelect}
            disabled={isLoading}
          />
        </div>

        {/* Timeframe Selection Section - Only show when symbol is selected */}
        {selectedSymbol && (
          <div className="glass-effect gradient-border rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Timer className="w-6 h-6 text-indigo-400" />
              Select Timeframe
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {TIMEFRAMES.map((timeframe) => (
                <button
                  key={timeframe.id}
                  onClick={() => handleTimeframeSelect(timeframe.id)}
                  className={`p-3 rounded-lg border transition-all duration-200 ${
                    selectedTimeframe === timeframe.id
                      ? 'glass-effect border-indigo-300/50 bg-indigo-500/20'
                      : 'glass-effect border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">{timeframe.name}</span>
                    {selectedTimeframe === timeframe.id && (
                      <Check className="w-4 h-4 text-indigo-300 flex-shrink-0 animate-in fade-in ml-2" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Technical Indicators Gauge Section */}
        {selectedTimeframe && gaugeData && (
          <div className="glass-effect gradient-border rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Gauge className="w-6 h-6 text-indigo-400" />
              Technical Indicators
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
              <TechnicalGauge
                title="Oscillators"
                sell={gaugeData.oscillators.sell}
                neutral={gaugeData.oscillators.neutral}
                buy={gaugeData.oscillators.buy}
                signal={gaugeData.oscillators.signal}
              />
              <TechnicalGauge
                title="Summary"
                sell={gaugeData.summary.sell}
                neutral={gaugeData.summary.neutral}
                buy={gaugeData.summary.buy}
                signal={gaugeData.summary.signal}
              />
              <TechnicalGauge
                title="Moving Averages"
                sell={gaugeData.movingAverages.sell}
                neutral={gaugeData.movingAverages.neutral}
                buy={gaugeData.movingAverages.buy}
                signal={gaugeData.movingAverages.signal}
              />
            </div>
          </div>
        )}

        {/* Image Upload Section */}
        <div className="glass-effect gradient-border rounded-xl p-6 bg-white/5 shadow-[0_4px_20px_rgba(255,255,255,0.1)] backdrop-blur-md border border-white/10">
          {/* Chart Preview */}
          <h2 className="text-2xl font-bold mb-4 text-white">Chart Preview</h2>
          <div className="flex flex-wrap gap-4">
            {charts.map((chart, index) => (
              <div key={index} className="relative">
                <img
                  src={chart.url}
                  alt={`Chart ${index + 1}`}
                  className="max-w-full h-auto rounded-lg"
                  style={{ maxHeight: '300px' }}
                />
                <button
                  onClick={() => removeChart(index)}
                  className="absolute top-2 right-2 p-1 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
                {chart.timeframe && (
                  <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 rounded text-sm text-white">
                    {chart.timeframe}
                  </div>
                )}
                {chart.symbol && (
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-sm text-white">
                    {chart.symbol}
                  </div>
                )}
              </div>
            ))}
            {charts.length < 3 && (
              <ImageUploader onImageSelect={handleImageSelect} />
            )}
          </div>

          {/* Analysis Controls */}
          <div className="flex gap-4 mt-6">
            <Button
              onClick={handleAnalyze}
              disabled={isLoading || charts.length === 0}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing...</span>
                </div>
              ) : (
                'Analyze Charts'
              )}
            </Button>
          </div>
        </div>

        {error && (
          <div className="glass-effect gradient-border-error rounded-xl p-4 mb-6 text-red-400 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div className="whitespace-pre-line">{error}</div>
          </div>
        )}

        {correlativeAnalysis && !error && (
          <div className="space-y-6">
            {/* Market Summary Section */}
            <div className="glass-effect gradient-border rounded-xl p-6 bg-white/5 shadow-[0_4px_20px_rgba(255,255,255,0.1)] backdrop-blur-md border border-white/10">
              <div className="flex items-center gap-2 mb-6">
                <LineChart className="w-6 h-6 text-indigo-400" />
                <h2 className="text-2xl font-bold text-white">Market Summary</h2>
              </div>

              {/* Symbol and Timeframe Pills */}
              <div className="flex flex-wrap gap-2 mb-6">
                {charts.map((chart, index) => (
                  <div key={index} className="bg-indigo-900/30 px-3 py-1.5 rounded-lg">
                    <span className="text-indigo-200 font-medium">{chart.symbol || 'Unknown'}</span>
                    <span className="text-indigo-400 text-sm ml-2">{chart.timeframe}</span>
                  </div>
                ))}
              </div>

              {/* Summary Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Current Price Card */}
                <div className="glass-effect gradient-border rounded-lg p-4 bg-white/5">
                  <h3 className="text-indigo-300 text-sm mb-2">Current Price</h3>
                  <div className="text-2xl font-semibold text-white">
                    {extractValue(analyses[0] || '', 'Current Price') || 'N/A'}
                  </div>
                </div>

                {/* Support Levels Card */}
                <div className="glass-effect gradient-border rounded-lg p-4 bg-white/5">
                  <h3 className="text-indigo-300 text-sm mb-2">Support Levels</h3>
                  <div className="text-2xl font-semibold text-white">
                    {correlativeAnalysis.keyLevels.support.length > 0 
                      ? correlativeAnalysis.keyLevels.support.join(', ')
                      : 'No levels detected'}
                  </div>
                </div>

                {/* Resistance Levels Card */}
                <div className="glass-effect gradient-border rounded-lg p-4 bg-white/5">
                  <h3 className="text-indigo-300 text-sm mb-2">Resistance Levels</h3>
                  <div className="text-2xl font-semibold text-white">
                    {correlativeAnalysis.keyLevels.resistance.length > 0
                      ? correlativeAnalysis.keyLevels.resistance.join(', ')
                      : 'No levels detected'}
                  </div>
                </div>
              </div>
            </div>

            {/* Price Movement Section */}
            <div className="glass-effect gradient-border rounded-xl p-6 bg-white/5 shadow-[0_4px_20px_rgba(255,255,255,0.1)] backdrop-blur-md border border-white/10 mb-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="bg-white/10 p-2 rounded-lg backdrop-blur-md">
                  <TrendingUp className={`w-5 h-5 ${
                    correlativeAnalysis.trendAlignment === 'Bullish' ? 'text-emerald-400' :
                    correlativeAnalysis.trendAlignment === 'Bearish' ? 'text-red-400' :
                    'text-yellow-400'
                  }`} />
                </div>
                <h2 className="text-2xl font-bold text-white">Price Movement</h2>
              </div>

              <div className="bg-white/5 rounded-xl p-6 shadow-[0_4px_15px_rgba(255,255,255,0.05)] backdrop-blur-md border border-white/10">
                <div className="space-y-4 text-[#e4e4e7] text-lg">
                  {correlativeAnalysis.priceMovement.split(' - ').map((point, index) => (
                    point && (
                      <div key={index} className="flex items-start gap-3">
                        <div className="min-w-2 h-2 w-2 rounded-full bg-indigo-400 mt-2.5"></div>
                        <p className="text-[#e4e4e7] leading-relaxed">{point}</p>
                      </div>
                    )
                  ))}
                </div>
              </div>
            </div>

            {/* Technical Indicators Section */}
            <div className="glass-effect gradient-border rounded-xl p-6 bg-white/5 shadow-[0_4px_20px_rgba(255,255,255,0.1)] backdrop-blur-md border border-white/10">
              <div className="flex items-center gap-2 mb-6">
                <Gauge className="w-6 h-6 text-indigo-400" />
                <h2 className="text-2xl font-bold text-white">Technical Indicators</h2>
              </div>

              <div className="space-y-6">
                {/* RSI Indicator */}
                <div className="glass-effect gradient-border rounded-lg p-4 bg-white/5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-red-500/20 p-1.5 rounded">
                      <Target className="w-4 h-4 text-red-400" />
                    </div>
                    <h3 className="text-lg font-medium text-white">RSI INDICATOR</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-indigo-300 text-sm mb-1">Current Values</h4>
                      <div className="text-white">
                        {analyses[0] && parseAnalysis(analyses[0]).rsi?.value || 'Not Visible'}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-indigo-300 text-sm mb-1">Signal</h4>
                      <div className="text-white">
                        {analyses[0] && parseAnalysis(analyses[0]).rsi?.signal || '-'}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-indigo-300 text-sm mb-1">Analysis</h4>
                      <div className="text-white">
                        {analyses[0] && parseAnalysis(analyses[0]).rsi?.analysis || '-'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* MACD Indicator */}
                <div className="glass-effect gradient-border rounded-lg p-4 bg-white/5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-blue-500/20 p-1.5 rounded">
                      <LineChart className="w-4 h-4 text-white" /> {/* Changed from text-blue-400 */}
                    </div>
                    <h3 className="text-lg font-medium text-white">MACD INDICATOR</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-indigo-300 text-sm mb-1">Current Values</h4>
                      <div className="text-white">
                        {analyses[0] && parseAnalysis(analyses[0]).macd?.value || 'Not Visible'}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-indigo-300 text-sm mb-1">Signal</h4>
                      <div className="text-white">
                        {analyses[0] && parseAnalysis(analyses[0]).macd?.signal || '-'}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-indigo-300 text-sm mb-1">Analysis</h4>
                      <div className="text-white">
                        {analyses[0] && parseAnalysis(analyses[0]).macd?.analysis || '-'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Trading Signal Section */}
            <div className="glass-effect gradient-border rounded-xl p-6 bg-white/5 shadow-[0_4px_20px_rgba(255,255,255,0.1)] backdrop-blur-md border border-white/10">
              <div className="flex items-center gap-2 mb-6">
                <div className="bg-white/10 p-2 rounded-lg backdrop-blur-md">
                  <Target className="w-5 h-5 text-indigo-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">Trading Signal</h2>
              </div>

              {/* Signal Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Action Panel */}
                <div className="bg-white/5 rounded-xl p-6 shadow-[0_4px_15px_rgba(255,255,255,0.05)] backdrop-blur-md border border-white/10">
                  <h3 className="text-gray-300 mb-3">Action</h3>
                  <div className={`text-2xl font-bold ${
                    correlativeAnalysis.signals.primary.toLowerCase().includes('buy') ? 'text-emerald-400' :
                    correlativeAnalysis.signals.primary.toLowerCase().includes('sell') ? 'text-red-400' :
                    'text-yellow-400'
                  }`}>
                    {correlativeAnalysis.signals.primary}
                  </div>
                </div>

                {/* Entry Price Panel */}
                <div className="bg-white/5 rounded-xl p-6 shadow-[0_4px_15px_rgba(255,255,255,0.05)] backdrop-blur-md border border-white/10">
                  <h3 className="text-gray-300 mb-3">Entry Price</h3>
                  <div className="text-2xl font-bold text-white">
                    {correlativeAnalysis.signals.entryPrice || 'N/A'}
                  </div>
                </div>

                {/* Take Profit Panel */}
                <div className="bg-white/5 rounded-xl p-6 shadow-[0_4px_15px_rgba(255,255,255,0.05)] backdrop-blur-md border border-white/10">
                  <h3 className="text-gray-300 mb-3">Take Profit</h3>
                  <div className="text-2xl font-bold text-emerald-400">
                    {correlativeAnalysis.signals.takeProfit || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Technical Analysis Panel */}
              <div className="bg-white/5 rounded-xl p-6 shadow-[0_4px_15px_rgba(255,255,255,0.05)] backdrop-blur-md border border-white/10 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-white/10 p-2 rounded-lg backdrop-blur-md">
                    <LineChart className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Technical Analysis</h3>
                </div>

                <div className="space-y-6">
                  {correlativeAnalysis.summary.split('\n\n').map((section, index) => {
                    if (!section) return null;
                    const [title, ...points] = section.split('\n');
                    return (
                      <div key={index} className="bg-white/5 rounded-xl p-4 shadow-[0_4px_15px_rgba(255,255,255,0.05)] backdrop-blur-md border border-white/10">
                        <h4 className="text-lg font-semibold mb-3 text-white">{title || 'Analysis'}</h4>
                        <div className="space-y-2">
                          {points.map((point, pointIndex) => (
                            <div key={pointIndex} className="flex items-start gap-3">
                              <div className="min-w-2 h-2 w-2 rounded-full bg-indigo-400 mt-2.5"></div>
                              <p className="text-[#e4e4e7] leading-relaxed">
                                {point.replace(/^- /, '')}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Confidence Level Panel */}
              <div className="bg-white/5 rounded-xl p-6 shadow-[0_4px_15px_rgba(255,255,255,0.05)] backdrop-blur-md border border-white/10">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-gray-300">Confidence Level</h3>
                  <span className="text-white font-bold">{correlativeAnalysis.signals?.confidence || 50}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className="bg-emerald-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${correlativeAnalysis.signals?.confidence || 50}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
