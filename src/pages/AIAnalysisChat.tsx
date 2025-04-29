import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, AlertCircle, X, Loader2, Send, ChevronLeft, ChevronRight, Code2 } from 'lucide-react';
import { ImageUploader } from '../components/ImageUploader';
import { ChartGenerator } from '../components/ChartGenerator';
import { UploadConfirmationModal } from '../components/UploadConfirmationModal';
import { AVAILABLE_MODELS, analyzeImage, type ModelId, sendChatMessage } from '../services/openrouter';
import Markdown from 'react-markdown';
import { useTypingEffect } from '../hooks/useTypingEffect';
import { formatTimeframe } from '../utils/formatters';
import { auth, database } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { saveChatAnalysis, uploadChartImage, getUserAnalyses } from '../lib/firebase';
import styles from './AIAnalysisChat.module.css';
import { useAnalysisContext } from '../context/AnalysisContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useSidebarState } from '../contexts/SidebarContext';
import { LowCreditModal } from '../components/LowCreditModal';
import '../styles/silverTheme.css';

const AnalysisType = {
  Technical: 'Technical',
  Fundamental: 'Fundamental',
  Combined: 'Combined'
} as const;

type AnalysisTypeKey = keyof typeof AnalysisType;

interface Message {
  role: 'user' | 'assistant';
  content: string;
  isTyping?: boolean;
}

const extractConfidenceLevel = (text: string): number | null => {
  // First try to match explicit percentage
  const percentMatch = text.match(/confidence(?:\s+level)?[:\s]+(\d+)%/i);
  if (percentMatch) {
    return parseInt(percentMatch[1]);
  }

  // If no explicit percentage, check for descriptive terms
  const confidenceLevelText = text.toLowerCase();
  if (confidenceLevelText.includes('confidence level:') || confidenceLevelText.includes('confidence:')) {
    if (confidenceLevelText.includes('very high') || confidenceLevelText.includes('strong')) return 90;
    if (confidenceLevelText.includes('high')) return 80;
    if (confidenceLevelText.includes('moderate')) return 65;
    if (confidenceLevelText.includes('low')) return 40;
    if (confidenceLevelText.includes('very low')) return 25;
  }
  return null;
};

const ConfidenceBar = ({ percentage, showLabel = true }: { percentage: number, showLabel?: boolean }) => {
  const { theme } = useTheme();
  
  const getColorStyle = (value: number) => {
    if (value >= 80) return {
      backgroundColor: '#00E5FF',
      boxShadow: '0 0 10px rgba(0, 229, 255, 0.7)',
    };
    if (value >= 60) return {
      backgroundColor: '#FFD700',
      boxShadow: '0 0 10px rgba(255, 215, 0, 0.7)',
    };
    return {
      backgroundColor: '#FF4545',
      boxShadow: '0 0 10px rgba(255, 69, 69, 0.7)',
    };
  };

  return (
    <div className="mt-2 w-full">
      <div className="flex items-center gap-2">
        <div 
          className="flex-1 rounded-full h-2.5 overflow-hidden" 
          style={{
            backgroundColor: theme === 'dark' ? 'rgba(17, 34, 64, 0.8)' : 'rgba(17, 34, 64, 0.8)',
            border: '1px solid rgba(0, 229, 255, 0.3)',
            boxShadow: '0 0 5px rgba(0, 229, 255, 0.2)',
          }}
        >
          <div 
            className="h-full rounded-full transition-all duration-500"
            style={{ 
              width: `${percentage}%`,
              ...getColorStyle(percentage)
            }}
          />
        </div>
        {showLabel && (
          <span 
            className="text-sm font-medium min-w-[3rem]"
            style={{
              color: theme === 'dark' ? '#00E5FF' : '#00E5FF',
              textShadow: '0 0 5px rgba(0, 229, 255, 0.5)',
              fontWeight: 'bold'
            }}
          >
            {percentage}%
          </span>
        )}
      </div>
    </div>
  );
};

const formatAnalysisOutput = (content: string) => {
  if (!content) return null;

  // Extract all data points using helper functions
  const symbol = extractSymbol(content);
  const price = extractPrice(content);
  const supportLevels = extractSupportLevels(content);
  const resistanceLevels = extractResistanceLevels(content);
  const priceMovement = extractPriceMovement(content);
  const rsi = extractRSI(content);
  const rsiSignal = extractRSISignal(content);
  const rsiAnalysis = extractRSIAnalysis(content);
  const macdValues = extractMACDValues(content);
  const macdSignal = extractMACDSignal(content);
  const macdAnalysis = extractMACDAnalysis(content);
  const bollingerBands = extractBollingerBands(content);
  const bollingerSignal = extractBollingerSignal(content);
  const bollingerAnalysis = extractBollingerAnalysis(content);
  const stochastic = extractStochastic(content);
  const stochasticSignal = extractStochasticSignal(content);
  const stochasticAnalysis = extractStochasticAnalysis(content);
  const otherIndicator = extractOtherIndicator(content);
  const otherIndicatorName = extractOtherIndicatorName(content);
  const otherIndicatorSignal = extractOtherIndicatorSignal(content);
  const otherIndicatorAnalysis = extractOtherIndicatorAnalysis(content);
  const tradingAction = extractTradingAction(content);
  const tradingAnalysis = extractTradingAnalysis(content);

  // Check for phrases to hide
  if (supportLevels.includes("No clear reversal or continuation patterns observed") ||
      supportLevels.includes("N/A") ||
      supportLevels.includes("not visible") ||
      supportLevels.includes("No clear chart patterns identified")) {
    return null; // Skip rendering this section
  }

  // Calculate confidence level based on signals
  const signals = [rsiSignal, macdSignal, bollingerSignal, stochasticSignal, otherIndicatorSignal].filter(signal => signal !== 'Neutral');
  const confidenceLevel = Math.min(100, (signals.length / 5) * 100);

  return (
    <div className={styles.analysisOutput}>
      {/* Main Header */}
      {/* <h2 className={styles.mainHeader}>🤖 AI ANALYSIS</h2> */}
      
      {/* Technical Analysis Section */}
      <div className={styles.section}>
        <h3 className={`${styles.sectionHeader} ${styles.blueHeader}`} data-number="1">Technical Aspects</h3>
        
        {/* Price Action Analysis */}
        <div className={styles.contentPanel}>
          <div className={styles.subHeader}>Price Action Analysis</div>
          <div className={styles.space4}>
            <p className={styles.infoText}>
              <span className={styles.label}>Symbol:</span>
              <span className={styles.value}>{symbol}</span>
            </p>
            <p className={styles.infoText}>
              <span className={styles.label}>Current Price:</span>
              <span className={styles.value}>{price}</span>
            </p>
            <p className={styles.infoText}>
              <span className={styles.label}>Support Levels:</span>
              <span className={styles.value}>{supportLevels}</span>
            </p>
            <p className={styles.infoText}>
              <span className={styles.label}>Resistance Levels:</span>
              <span className={styles.value}>{resistanceLevels}</span>
            </p>
            <p className={styles.infoText}>
              <span className={styles.label}>Price Movement:</span>
              <span className={styles.value}>{priceMovement}</span>
            </p>
          </div>
        </div>

        {/* Technical Indicators */}
        {(rsi && rsi !== 'N/A') || 
         (macdValues && macdValues !== 'N/A') || 
         (bollingerBands && bollingerBands !== 'N/A') || 
         (stochastic && stochastic !== 'N/A') || 
         (otherIndicator && otherIndicator !== 'N/A') ? (
          <div className={styles.contentPanel}>
            <div className={styles.subHeader}>Technical Indicators</div>
            <div className={styles.space4}>
              {/* RSI Analysis */}
              {rsi && rsi !== 'N/A' && (
                <div className={styles.indicatorSection}>
                  <div className={styles.subHeader}>RSI Analysis</div>
                  <p className={styles.infoText}>
                    <span className={styles.label}>RSI Value:</span>
                    <span className={styles.value}>{rsi}</span>
                  </p>
                  <p className={styles.infoText}>
                    <span className={styles.label}>Signal:</span>
                    <span className={`${styles.signalValue} ${
                      rsiSignal === 'Overbought' ? styles.bearish :
                      rsiSignal === 'Oversold' ? styles.bullish :
                      styles.neutral
                    }`}>{rsiSignal}</span>
                  </p>
                  <p className={styles.infoText}>
                    <span className={styles.label}>Analysis:</span>
                    <span className={styles.value}>{rsiAnalysis}</span>
                  </p>
                </div>
              )}

              {/* Add other technical indicators here */}
            </div>
          </div>
        ) : null}
      </div>

      {/* Risk Management Section */}
      <div className={styles.section}>
        <h3 className={`${styles.sectionHeader} ${styles.purpleHeader}`} data-number="2">Risk Management</h3>
        
        {/* Risk Assessment */}
        <div className={styles.contentPanel}>
          <div className={styles.subHeader}>Risk Assessment</div>
          <div className={styles.space4}>
            <p className={styles.infoText}>
              <span className={styles.label}>Market Volatility:</span>
              <span className={styles.value}>{extractVolatility(content)}</span>
            </p>
            <p className={styles.infoText}>
              <span className={styles.label}>Risk Level:</span>
              <span className={`${styles.value} ${getRiskLevelClass(extractRiskLevel(content))}`}>
                {extractRiskLevel(content)}
              </span>
            </p>
            <p className={styles.infoText}>
              <span className={styles.label}>Stop Loss:</span>
              <span className={styles.value}>{extractStopLoss(content)}</span>
            </p>
            <p className={styles.infoText}>
              <span className={styles.label}>Take Profit:</span>
              <span className={styles.value}>{extractTakeProfit(content)}</span>
            </p>
          </div>
        </div>

        {/* Position Sizing */}
        <div className={styles.contentPanel}>
          <div className={styles.subHeader}>Position Sizing</div>
          <div className={styles.space4}>
            <p className={styles.infoText}>
              <span className={styles.label}>Recommended Size:</span>
              <span className={styles.value}>{extractPositionSize(content)}</span>
            </p>
            <p className={styles.infoText}>
              <span className={styles.label}>Risk Per Trade:</span>
              <span className={styles.value}>{extractRiskPerTrade(content)}</span>
            </p>
            <p className={styles.infoText}>
              <span className={styles.label}>Risk/Reward Ratio:</span>
              <span className={styles.value}>{extractRiskRewardRatio(content)}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Trading Action and Analysis */}
      <div className={styles.section}>
        <h3 className={`${styles.sectionHeader} ${styles.greenHeader}`} data-number="3">Entry/Exit Strategies</h3>
        <div className={styles.contentPanel}>
          <p className={styles.infoText}>
            <span className={styles.label}>Recommended Action:</span>
            <span className={`${styles.signalValue} ${
              tradingAction?.toLowerCase() === 'buy' ? styles.bullish :
              tradingAction?.toLowerCase() === 'sell' ? styles.bearish :
              styles.neutral
            }`}>{tradingAction}</span>
          </p>
          <p className={styles.infoText}>
            <span className={styles.label}>Analysis:</span>
            <span className={styles.value}>{tradingAnalysis}</span>
          </p>
          
          {/* Entry Points */}
          <div className={styles.subSection}>
            <div className={styles.subHeader}>Entry Points</div>
            <p className={styles.infoText}>
              <span className={styles.label}>Primary Entry:</span>
              <span className={styles.value}>{extractPrimaryEntry(content)}</span>
            </p>
            <p className={styles.infoText}>
              <span className={styles.label}>Secondary Entry:</span>
              <span className={styles.value}>{extractSecondaryEntry(content)}</span>
            </p>
          </div>

          {/* Exit Strategy */}
          <div className={styles.subSection}>
            <div className={styles.subHeader}>Exit Strategy</div>
            <p className={styles.infoText}>
              <span className={styles.label}>Primary Target:</span>
              <span className={styles.value}>{extractPrimaryTarget(content)}</span>
            </p>
            <p className={styles.infoText}>
              <span className={styles.label}>Secondary Target:</span>
              <span className={styles.value}>{extractSecondaryTarget(content)}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Additional helper functions */}
      {extractConfidenceLevel(content) && (
        <div className="mt-6 p-4 rounded-lg" style={{
          background: 'rgba(10, 25, 47, 0.7)',
          border: '1px solid rgba(0, 229, 255, 0.3)',
          boxShadow: '0 0 15px rgba(0, 229, 255, 0.2)'
        }}>
          <div className="text-sm font-medium text-cyan-200 mb-2" style={{textShadow: '0 0 5px rgba(0, 229, 255, 0.3)'}}>
            Analysis Confidence
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-800 rounded-full h-3 overflow-hidden" style={{boxShadow: 'inset 0 0 5px rgba(0, 0, 0, 0.5)'}}>
              <div 
                className={`h-3 rounded-full transition-all duration-500`}
                style={{ 
                  width: `${extractConfidenceLevel(content)}%`,
                  background: extractConfidenceLevel(content) >= 80 ? 'linear-gradient(90deg, #00e5ff, #4aeaff)' :
                                             extractConfidenceLevel(content) >= 60 ? 'linear-gradient(90deg, #00c3ff, #00e5ff)' :
                                             extractConfidenceLevel(content) >= 40 ? 'linear-gradient(90deg, #ffcc00, #ffd700)' :
                                             'linear-gradient(90deg, #ff4d4d, #ff6666)',
                  boxShadow: `0 0 10px ${extractConfidenceLevel(content) >= 80 ? 'rgba(0, 229, 255, 0.8)' : 
                                                         extractConfidenceLevel(content) >= 60 ? 'rgba(0, 229, 255, 0.6)' : 
                                                         extractConfidenceLevel(content) >= 40 ? 'rgba(255, 215, 0, 0.6)' : 
                                                         'rgba(255, 77, 77, 0.6)'}`,
                  animation: extractConfidenceLevel(content) >= 60 ? 'pulse-cyan 2s infinite' : ''
                }}
              />
            </div>
            <span className="text-sm font-medium text-cyan-300" style={{textShadow: '0 0 5px rgba(0, 229, 255, 0.3)', fontWeight: 'bold'}}>
              {extractConfidenceLevel(content)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper functions to extract data from analysis content
const extractFromContent = (content: string, pattern: RegExp): string => {
  const match = content.match(pattern);
  return match ? match[1].trim() : 'N/A';
};

const extractSymbol = (content: string): string => {
  return extractFromContent(content, /Symbol:?\s*([A-Z/]+)/i) || 'NZDUSD';
};

const extractPrice = (content: string): string => {
  return extractFromContent(content, /Current Price:?\s*([\d.]+)/i);
};

const extractSupportLevels = (content: string): string => {
  return extractFromContent(content, /Support Levels?:?\s*([\d., ]+)/i);
};

const extractResistanceLevels = (content: string): string => {
  return extractFromContent(content, /Resistance Levels?:?\s*([\d., ]+)/i);
};

const extractPriceMovement = (content: string): string => {
  return extractFromContent(content, /Price Movement:?\s*([^.]+\.)/i);
};

const extractRSI = (content: string): string => {
  // First check if the RSI section exists in the content
  if (!content.toLowerCase().includes('rsi indicator') && 
      !content.toLowerCase().includes('rsi analysis')) {
    return 'N/A';
  }
  // If RSI is mentioned but with "Not visible" or similar phrases, return N/A
  if (content.toLowerCase().includes('rsi') && 
      (content.toLowerCase().includes('not visible') || 
       content.toLowerCase().includes('not applicable') ||
       content.toLowerCase().includes('n/a'))) {
    return 'N/A';
  }
  return extractFromContent(content, /RSI:?\s*([\d.]+)/i);
};

const extractRSISignal = (content: string): string => {
  const rsi = parseFloat(extractRSI(content));
  if (isNaN(rsi)) return 'Neutral';
  if (rsi > 70) return 'Overbought';
  if (rsi < 30) return 'Oversold';
  return 'Neutral';
};

const extractRSIAnalysis = (content: string): string => {
  return extractFromContent(content, /RSI Analysis:?\s*([^.]+\.)/i);
};

const extractMACDValues = (content: string): string => {
  // First check if the MACD section exists in the content
  if (!content.toLowerCase().includes('macd indicator') && 
      !content.toLowerCase().includes('macd analysis')) {
    return 'N/A';
  }
  // If MACD is mentioned but with "Not visible" or similar phrases, return N/A
  if (content.toLowerCase().includes('macd') && 
      (content.toLowerCase().includes('not visible') || 
       content.toLowerCase().includes('not applicable') ||
       content.toLowerCase().includes('n/a'))) {
    return 'N/A';
  }
  return extractFromContent(content, /MACD:?\s*([^.]+\.)/i);
};

const extractMACDSignal = (content: string): string => {
  const macdContent = content.toLowerCase();
  if (macdContent.includes('bullish crossover') || macdContent.includes('bullish signal')) return 'Bullish';
  if (macdContent.includes('bearish crossover') || macdContent.includes('bearish signal')) return 'Bearish';
  return 'Neutral';
};

const extractMACDAnalysis = (content: string): string => {
  return extractFromContent(content, /MACD Analysis:?\s*([^.]+\.)/i);
};

const extractBollingerBands = (content: string): string => {
  // First check if the Bollinger Bands section exists in the content
  if (!content.toLowerCase().includes('bollinger bands indicator') && 
      !content.toLowerCase().includes('bollinger bands analysis')) {
    return 'N/A';
  }
  // If Bollinger Bands is mentioned but with "Not visible" or similar phrases, return N/A
  if (content.toLowerCase().includes('bollinger bands') && 
      (content.toLowerCase().includes('not visible') || 
       content.toLowerCase().includes('not applicable') ||
       content.toLowerCase().includes('n/a'))) {
    return 'N/A';
  }
  return extractFromContent(content, /Bollinger Bands:?\s*([^.]+\.)/i);
};

const extractBollingerSignal = (content: string): string => {
  const bollingerContent = content.toLowerCase();
  if (bollingerContent.includes('bullish signal') || bollingerContent.includes('buy signal')) return 'Bullish';
  if (bollingerContent.includes('bearish signal') || bollingerContent.includes('sell signal')) return 'Bearish';
  return 'Neutral';
};

const extractBollingerAnalysis = (content: string): string => {
  return extractFromContent(content, /Bollinger Bands Analysis:?\s*([^.]+\.)/i);
};

const extractStochastic = (content: string): string => {
  // First check if the Stochastic Oscillator section exists in the content
  if (!content.toLowerCase().includes('stochastic oscillator indicator') && 
      !content.toLowerCase().includes('stochastic oscillator analysis')) {
    return 'N/A';
  }
  // If Stochastic Oscillator is mentioned but with "Not visible" or similar phrases, return N/A
  if (content.toLowerCase().includes('stochastic oscillator') && 
      (content.toLowerCase().includes('not visible') || 
       content.toLowerCase().includes('not applicable') ||
       content.toLowerCase().includes('n/a'))) {
    return 'N/A';
  }
  return extractFromContent(content, /Stochastic Oscillator:?\s*([^.]+\.)/i);
};

const extractStochasticSignal = (content: string): string => {
  const stochasticContent = content.toLowerCase();
  if (stochasticContent.includes('bullish signal') || stochasticContent.includes('buy signal')) return 'Bullish';
  if (stochasticContent.includes('bearish signal') || stochasticContent.includes('sell signal')) return 'Bearish';
  return 'Neutral';
};

const extractStochasticAnalysis = (content: string): string => {
  return extractFromContent(content, /Stochastic Oscillator Analysis:?\s*([^.]+\.)/i);
};

const extractOtherIndicator = (content: string): string => {
  // First check if the Other Indicator section exists in the content
  if (!content.toLowerCase().includes('other indicator') && 
      !content.toLowerCase().includes('other analysis')) {
    return 'N/A';
  }
  // If Other Indicator is mentioned but with "Not visible" or similar phrases, return N/A
  if (content.toLowerCase().includes('other indicator') && 
      (content.toLowerCase().includes('not visible') || 
       content.toLowerCase().includes('not applicable') ||
       content.toLowerCase().includes('n/a'))) {
    return 'N/A';
  }
  return extractFromContent(content, /Other Indicator:?\s*([^.]+\.)/i);
};

const extractOtherIndicatorName = (content: string): string => {
  return extractFromContent(content, /Other Indicator Name:?\s*([^.]+\.)/i);
};

const extractOtherIndicatorSignal = (content: string): string => {
  const otherIndicatorContent = content.toLowerCase();
  if (otherIndicatorContent.includes('bullish signal') || otherIndicatorContent.includes('buy signal')) return 'Bullish';
  if (otherIndicatorContent.includes('bearish signal') || otherIndicatorContent.includes('sell signal')) return 'Bearish';
  return 'Neutral';
};

const extractOtherIndicatorAnalysis = (content: string): string => {
  return extractFromContent(content, /Other Indicator Analysis:?\s*([^.]+\.)/i);
};

const extractTradingAction = (content: string): string => {
  return extractFromContent(content, /Trading Action:?\s*(\w+)/i);
};

const extractTradingAnalysis = (content: string): string => {
  return extractFromContent(content, /Trading Analysis:?\s*([^.]+\.)/i);
};

const ChatMessage = ({ message, isLoading = false, isCurrent = false }: { message: Message, isLoading: boolean, isCurrent: boolean }) => {
  const { theme } = useTheme();
  
  return (
    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`p-4 rounded-lg ${
        message.role === 'user'
          ? theme === 'dark'
            ? 'bg-cyan-700/80 border border-cyan-600/50'
            : 'bg-cyan-600/80 border border-cyan-500/50'
          : theme === 'dark' 
            ? 'bg-cyan-950/80 border border-cyan-900/50' 
            : 'bg-gray-200/90 border border-gray-300/50'
      } max-w-[90%]`}
      style={message.role === 'user' && theme === 'light' 
        ? {
            background: 'linear-gradient(135deg, rgba(10, 94, 112, 0.7) 0%, rgba(15, 138, 158, 0.6) 100%)',
            boxShadow: '0 0 10px rgba(0, 229, 255, 0.3)'
          } 
        : message.role === 'assistant' && theme === 'light'
          ? {
              background: 'linear-gradient(160deg, rgba(10, 25, 47, 0.7) 0%, rgba(10, 94, 112, 0.7) 100%)',
              border: '1px solid rgba(0, 229, 255, 0.3)',
              boxShadow: '0 0 10px rgba(0, 229, 255, 0.2)'
          }
        : {}
      }>
        <Markdown className={`prose prose-sm max-w-none break-words ${
            message.role === 'user'
              ? theme === 'dark' ? 'text-white' : 'text-white'
              : theme === 'dark' 
                ? 'text-white' 
                : 'text-white'
        }`}
        style={message.role === 'assistant' && theme === 'light' ? {textShadow: '0 0 2px rgba(0, 229, 255, 0.3)'} : {}}>
          {message.content}
        </Markdown>
        {isLoading && isCurrent && (
          <div className={`flex items-center mt-2 ${theme === 'dark' ? 'text-cyan-400' : 'text-cyan-300'}`}>
            <span className="mr-2" style={theme === 'light' ? {textShadow: '0 0 5px rgba(0, 229, 255, 0.5)'} : {}}>
              Analyzing
            </span>
            <div className="animate-bounce">.</div>
            <div className="animate-bounce animation-delay-200">.</div>
            <div className="animate-bounce animation-delay-400">.</div>
          </div>
        )}
      </div>
    </div>
  );
};


function AIAnalysisChat() {
  const { theme } = useTheme();
  const { isCollapsed } = useSidebarState();
  const navigate = useNavigate();
  const location = useLocation();
  
  // References for animation effects
  const particleContainerRef = useRef<HTMLDivElement>(null);
  const dataGridRef = useRef<HTMLDivElement>(null);
  const scanlineRef = useRef<HTMLDivElement>(null);
  const dataStreamRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const matrixRef = useRef<HTMLDivElement>(null);

  const { 
    image, 
    setImage, 
    analysis, 
    setAnalysis, 
    timeframe, 
    setTimeframe,
    chartPreviews,
    setChartPreviews,
    initialMessage,
    resetAnalysis
  } = useAnalysisContext();

  const { displayedText, isTyping } = useTypingEffect(initialMessage, { typingSpeed: 25 });
  const [selectedModel, setSelectedModel] = useState<ModelId>(AVAILABLE_MODELS[0].id);
  
  // Track model-specific conversations and analysis
  const [modelConversations, setModelConversations] = useState<Record<string, {
    messages: Message[];
    analysis: string;
    chartPreviews: string[];
  }>>({});

  const premiumModels = AVAILABLE_MODELS.filter(model => model.premium);
  const nonPremiumModels = AVAILABLE_MODELS.filter(model => !model.premium);

  const [analysisType, setAnalysisType] = useState<typeof AnalysisType[AnalysisTypeKey]>(AnalysisType.Fundamental);
  const [isGeneratingChart, setIsGeneratingChart] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUploadPrompt, setShowUploadPrompt] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [pendingImages, setPendingImages] = useState<string[]>(chartPreviews);
  const [selectedPreviewUrl, setSelectedPreviewUrl] = useState<string | null>(null);
  const [showChartGenerator, setShowChartGenerator] = useState(false);
  const [selectedOption, setSelectedOption] = useState('Upload Chart');
  const [totalCharts, setTotalCharts] = useState(0);
  const [currentChart, setCurrentChart] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<{ symbol: string; timeframe: string; analysis: string }[]>([]);
  const [currentAnalysisIndex, setCurrentAnalysisIndex] = useState(0);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [modelHistoryIds, setModelHistoryIds] = useState<Record<string, string>>({});

  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: initialMessage }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [userTokens, setUserTokens] = useState(100); // Assuming initial tokens
  const [requiredTokens, setRequiredTokens] = useState(0);

  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (historyId) {
      sessionStorage.setItem('currentHistoryId', historyId);
      console.log('History ID saved to sessionStorage:', historyId);
      
      // Also update the model-specific history ID mapping
      setModelHistoryIds(prev => ({
        ...prev,
        [selectedModel]: historyId
      }));
    }
  }, [historyId, selectedModel]);

  useEffect(() => {
    setSelectedOption('Upload Chart');
    setShowUploader(true);
    setShowChartGenerator(false);
  }, []);

  useEffect(() => {
    setPendingImages(chartPreviews);
  }, [chartPreviews]);

  // Use a ref to track if we've already loaded analysis from history
  const hasLoadedAnalysisRef = useRef(false);

  // Load chat history from location state if available
  useEffect(() => {
    // Skip if we've already loaded or there's no location state
    if (!location.state) return;
    
    console.log('AIAnalysisChat mounted with state:', location.state);
    
    // Set the analysis content if available
    if (location.state.content && typeof location.state.content === 'string') {
      console.log('Setting analysis content from location state');
      hasLoadedAnalysisRef.current = true;
      
      try {
        // Try to parse the content as JSON first
        const parsedContent = JSON.parse(location.state.content);
        if (!Array.isArray(parsedContent)) {
          // If it's not an array, it's likely the actual analysis content
          setAnalysis(location.state.content);
        }
      } catch (e) {
        // If parsing fails, it's a plain text analysis
        console.log('Content is not JSON, setting as analysis');
        setAnalysis(location.state.content);
      }
    }
    
    // First priority: Check for messages array in state
    if (location.state.messages && Array.isArray(location.state.messages)) {
      console.log('Loading previous analysis conversation from messages array:', location.state.messages);
      
      // If loading from history, set the history ID
      if (location.state.analysisId) {
        console.log('Setting historyId from location state:', location.state.analysisId);
        setHistoryId(location.state.analysisId);
      } else if (location.state.historyId) {
        console.log('Setting historyId from location state:', location.state.historyId);
        setHistoryId(location.state.historyId);
      }
      
      // IMPORTANT: Reset messages first to force a re-render
      setMessages([]);
      
      // Wait for the next tick before setting messages
      setTimeout(() => {
        // Create a deep copy to ensure React detects the change
        const loadedMessages = location.state.messages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content || '',
          isTyping: false
        }));
        
        console.log('Setting messages:', loadedMessages);
        setMessages(loadedMessages);
        
        // Extract analysis from the last assistant message if we haven't already loaded it
        if (!hasLoadedAnalysisRef.current) {
          const lastAssistantMsg = loadedMessages
            .filter(msg => msg.role === 'assistant')
            .pop();
            
          if (lastAssistantMsg && lastAssistantMsg.content) {
            console.log('Setting analysis from last assistant message');
            setAnalysis(lastAssistantMsg.content);
            hasLoadedAnalysisRef.current = true;
          }
        }
      }, 50);
    }
    // Second priority: Try to parse content as JSON
    else if ((location.state.analysisId || location.state.historyId) && location.state.content) {
      console.log('Loading from history with content:', location.state.content);
      
      // Set the history ID
      if (location.state.analysisId) {
        setHistoryId(location.state.analysisId);
      } else if (location.state.historyId) {
        setHistoryId(location.state.historyId);
      }
      
      // Parse the content if it's a JSON string, otherwise use as is
      try {
        const parsedContent = JSON.parse(location.state.content);
        if (Array.isArray(parsedContent) && parsedContent.length > 0) {
          // IMPORTANT: Reset messages first to force a re-render
          setMessages([]);
          
          // Wait for the next tick before setting messages
          setTimeout(() => {
            const loadedMessages = parsedContent.map(msg => ({
              role: msg.role as 'user' | 'assistant',
              content: msg.content || '',
              isTyping: false
            }));
            
            console.log('Setting parsed messages:', loadedMessages);
            setMessages(loadedMessages);
            
            // Extract analysis from the last assistant message if we haven't already loaded it
            if (!hasLoadedAnalysisRef.current) {
              const lastAssistantMsg = loadedMessages
                .filter(msg => msg.role === 'assistant')
                .pop();
                
              if (lastAssistantMsg && lastAssistantMsg.content) {
                console.log('Setting analysis from last assistant message');
                setAnalysis(lastAssistantMsg.content);
                hasLoadedAnalysisRef.current = true;
              }
            }
          }, 50);
        } else {
          // If content is not in expected format, create a new conversation with it
          setMessages([
            { role: 'assistant', content: initialMessage },
            { role: 'assistant', content: location.state.content }
          ]);
          
          // Also set the content as the analysis
          if (!hasLoadedAnalysisRef.current) {
            setAnalysis(location.state.content);
            hasLoadedAnalysisRef.current = true;
          }
        }
      } catch (e) {
        console.log('Error parsing content, treating as plain text');
        // If content is not JSON, create a new conversation with it as assistant message
        setMessages([
          { role: 'assistant', content: initialMessage },
          { role: 'assistant', content: location.state.content }
        ]);
        
        // Also set the content as the analysis
        if (!hasLoadedAnalysisRef.current) {
          setAnalysis(location.state.content);
          hasLoadedAnalysisRef.current = true;
        }
      }
    }
    
    // Handle chat history (for backward compatibility)
    if (location.state.chatHistory && !location.state.messages) {
      console.log('Loading chat history from location state:', location.state.chatHistory);
      setChatHistory(location.state.chatHistory);
      
      // Only set messages if we haven't already set them above
      // We'll use a flag to track if we've already set messages
      const hasSetMessages = location.state.messages || 
        (location.state.analysisId || location.state.historyId) && location.state.content;
      
      if (Array.isArray(location.state.chatHistory) && !hasSetMessages) {
        console.log('Setting messages from chatHistory');
        setMessages(location.state.chatHistory);
        
        // Extract analysis from the last assistant message if we haven't already loaded it
        if (!hasLoadedAnalysisRef.current) {
          const lastAssistantMsg = location.state.chatHistory
            .filter(msg => msg.role === 'assistant')
            .pop();
            
          if (lastAssistantMsg && lastAssistantMsg.content) {
            console.log('Setting analysis from last assistant message');
            setAnalysis(lastAssistantMsg.content);
            hasLoadedAnalysisRef.current = true;
          }
        }
      }
    }
    
    // Set chart previews if available
    if (location.state.chartUrls && Array.isArray(location.state.chartUrls)) {
      console.log('Setting chart previews from location state');
      setChartPreviews(location.state.chartUrls);
    }
    
    // Set timeframe if available
    if (location.state.timeframe) {
      console.log('Setting timeframe from location state');
      setTimeframe(location.state.timeframe);
    }
    
    // Set model if available
    if (location.state.model) {
      console.log('Setting model from location state:', location.state.model);
      setSelectedModel(location.state.model);
    }
  }, [location.state, initialMessage]);

  const urlToBase64 = async (url: string): Promise<string> => {
    if (url.startsWith('data:')) return url; // Already base64
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return blobToBase64(blob);
    } catch (error) {
      throw new Error('Failed to convert URL to base64');
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleImageSelect = async (imageUrl: string) => {
    setError(null);
    
    try {
      // Store base64 for display/persistence but keep original URL for AI
      const base64Image = await urlToBase64(imageUrl);
      setImage(base64Image);
      
      // Store the original URL for later analysis and preview
      setPendingImages(prev => [...prev, imageUrl]);
      
      // Show upload prompt without analyzing
      setShowUploadPrompt(true);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process image';
      setError(errorMessage);
      
      // Clear all data regardless of error type
      setImage(null);
      setAnalysis(null);
      setError(null);
      setPendingImages([]);
      
      // Reset messages to initial state
      setMessages([{
        role: 'assistant',
        content: initialMessage
      }]);
    }
  };

  const handleChartGenerated = async (chartUrl: string) => {
    setIsGeneratingChart(true);
    setError(null);

    try {
      const base64Image = await urlToBase64(chartUrl);
      setImage(base64Image);
      
      // Update both local state and context
      const updatedImages = [...pendingImages, base64Image];
      setPendingImages(updatedImages);
      setChartPreviews(updatedImages);
      setShowUploadPrompt(true);

      // Extract timeframe from the URL for context
      const params = new URLSearchParams(chartUrl.split('?')[1]);
      const interval = params.get('interval');
      if (interval) {
        setTimeframe(interval);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate chart');
      setImage(null);
      setPendingImages([]);
      setChartPreviews([]);
    } finally {
      setIsGeneratingChart(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    const updatedImages = [...pendingImages];
    updatedImages.splice(index, 1);
    setPendingImages(updatedImages);
    setChartPreviews(updatedImages);
    sessionStorage.setItem('chartPreviews', JSON.stringify(updatedImages));

    if (updatedImages.length === 0) {
      setShowUploadPrompt(false);
      setShowUploader(true);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadMore = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleCloseUpload = () => {
    setShowUploader(false);
    setShowChartGenerator(false);
    setShowUploadPrompt(false);
  };

  const handleFileDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    try {
      const files = event.dataTransfer.files;
      const newImages: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) {
          console.log('Skipping non-image file:', file.name);
          continue;
        }

        const base64 = await convertToBase64(file);
        newImages.push(base64);
      }

      // Update both context and session storage
      const updatedPreviews = [...chartPreviews, ...newImages];
      setChartPreviews(updatedPreviews);
      setPendingImages(updatedPreviews);
      sessionStorage.setItem('chartPreviews', JSON.stringify(updatedPreviews));

      setShowUploadPrompt(true);
    } catch (err) {
      console.error('Error processing files:', err);
      handleError('Failed to process image files');
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const files = event.target.files;
      if (!files) return;
      
      const newImages: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) {
          console.log('Skipping non-image file:', file.name);
          continue;
        }

        const base64 = await convertToBase64(file);
        newImages.push(base64);
      }

      // Update both context and session storage
      const updatedPreviews = [...chartPreviews, ...newImages];
      setChartPreviews(updatedPreviews);
      setPendingImages(updatedPreviews);
      sessionStorage.setItem('chartPreviews', JSON.stringify(updatedPreviews));

      setShowUploadPrompt(true);
    } catch (err) {
      console.error('Error processing files:', err);
      handleError('Failed to process image files');
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFinishUploading = async () => {
    console.log('Starting upload and analysis process...');
    setShowUploadPrompt(false);
    setIsAnalyzing(true);
    setTotalCharts(chartPreviews.length);
    setCurrentChart(0);

    try {
      console.log(`Starting analysis of ${chartPreviews.length} charts...`);
      
      const analysisBySymbol: Record<string, { symbol: string; timeframes: string[]; analyses: string[] }> = {};

      // Analyze all charts
      for (let i = 0; i < chartPreviews.length; i++) {
        console.log(`Analyzing chart ${i + 1} of ${chartPreviews.length}`);
        setCurrentChart(i + 1);
        const imageUrl = chartPreviews[i];
        console.log('Starting image analysis...');
        const result = await analyzeImage(imageUrl, selectedModel);
        console.log('Image analysis complete. Result:', result.substring(0, 100) + '...');

        // Extract symbol and timeframe using regex
        const symbolMatch = result.match(/Symbol:\s*([^\n|]+)/i);
        const timeframeMatch = result.match(/Timeframe:\s*([^\n|]+)/i);

        const symbol = symbolMatch?.[1]?.trim() || 'Unknown';
        const timeframe = timeframeMatch?.[1]?.trim() || 'Unknown';

        // Remove symbol and timeframe lines from the analysis
        const analysisWithoutHeader = result
          .replace(/Symbol:.*\n?/i, '')
          .replace(/Timeframe:.*\n?/i, '')
          .trim();

        // Group by symbol
        if (!analysisBySymbol[symbol]) {
          analysisBySymbol[symbol] = {
            symbol,
            timeframes: [],
            analyses: []
          };
        }
        
        analysisBySymbol[symbol].timeframes.push(timeframe);
        analysisBySymbol[symbol].analyses.push(analysisWithoutHeader);
      }

      // Process each symbol group
      const finalAnalysisResults: { symbol: string; timeframe: string; analysis: string }[] = [];
      
      for (const symbol in analysisBySymbol) {
        const { timeframes, analyses } = analysisBySymbol[symbol];
        
        // If there are multiple analyses for the same symbol, combine them
        let combinedAnalysis = '';
        for (const analysis of analyses) {
          combinedAnalysis += (combinedAnalysis ? '\n\n' : '') + analysis;
        }
        
        // If we have multiple analyses for the same symbol, request a combined analysis
        if (analyses.length > 1) {
          console.log(`Requesting combined analysis for symbol: ${symbol}...`);
          const combinedPrompt = `Please provide a combined market analysis for the symbol: ${symbol} across timeframes: ${timeframes.join(', ')}. Here are the individual analyses to combine:\n\n${combinedAnalysis}`;
          
          const combinedResult = await analyzeImage(chartPreviews[0], selectedModel, combinedPrompt);
          console.log('Combined analysis received:', combinedResult.substring(0, 100) + '...');
          combinedAnalysis = combinedResult
            .replace(/Symbol:.*\n?/i, '')
            .replace(/Timeframe:.*\n?/i, '')
            .trim();
        }

        // Format the final analysis with symbol and timeframes
        const finalAnalysis = [
          `Symbol: ${symbol}`,
          '', // This empty string creates a new line
          `Timeframe: ${timeframes.join(' | ')}`,
          '',
          combinedAnalysis
        ].join('\n');

        finalAnalysisResults.push({
          symbol,
          timeframe: timeframes.join(' | '),
          analysis: finalAnalysis
        });
      }

      // Set the analysis results
      setAnalysisResults(finalAnalysisResults);
      setCurrentAnalysisIndex(0);
      
      // Set the current analysis for display
      if (finalAnalysisResults.length > 0) {
        setAnalysis(finalAnalysisResults[0].analysis);
      }
      
      console.log('All charts analyzed successfully');

      // Upload analyzed charts to Firebase if user is authenticated
      const user = auth.currentUser;
      console.log('👤 User authentication status:', { 
        isAuthenticated: !!user,
        userId: user?.uid 
      });

      const firebaseUrls: string[] = [];
      if (user) {
        console.log('🚀 Starting Firebase upload for analyzed charts...');
        for (let i = 0; i <chartPreviews.length; i++) {
          try {
            // Convert base64 to blob
            console.log(`📷 Processing chart ${i + 1}/${chartPreviews.length}...`);
            const response = await fetch(chartPreviews[i]);
            const blob = await response.blob();
            console.log('✅ Blob created:', { 
              size: blob.size, 
              type: blob.type 
            });

            // Upload to Firebase
            const imageUrl = await uploadChartImage(user.uid, blob);
            console.log('✅ Chart uploaded successfully:', {
              url: imageUrl.substring(0, 50) + '...',
              chartIndex: i + 1
            });
            firebaseUrls.push(imageUrl);
          } catch (error) {
            console.error('❌ Firebase upload failed for chart ${i + 1}:', error);
            // Keep the original URL if upload fails
            firebaseUrls.push(chartPreviews[i]);
          }
        }
        console.log('📊 All charts processed. Success rate:', 
          `${firebaseUrls.filter(url => url.includes('firebasestorage')).length}/${chartPreviews.length}`
        );

        // Use Firebase URLs if available, otherwise use original previews
        const finalChartUrls = firebaseUrls;

        // Save analysis data to Firebase
        console.log('Saving analysis data to Firebase:', {
          analysisLength: finalAnalysisResults[0]?.analysis.length,
          timeframe: finalAnalysisResults[0]?.timeframe,
          chartCount: finalChartUrls.length,
          messageCount: messages.length
        });
        
        try {
          // If we already have a history ID, update the existing record
          if (historyId && auth.currentUser) {
            try {
              console.log('Updating existing history record with analysis:', historyId);
              
              const { ref, update } = await import('firebase/database');
              const historyRef = ref(database, `users/${auth.currentUser.uid}/history/${historyId}`);
              
              await update(historyRef, {
                type: 'market-analysis',
                title: finalAnalysisResults[0]?.timeframe ? `Market Analysis - ${finalAnalysisResults[0].timeframe}` : 'Market Analysis',
                content: finalAnalysisResults[0]?.analysis,
                chartUrls: finalChartUrls,
                messages: messages.map(msg => ({
                  role: msg.role,
                  content: msg.content
                })),
                timestamp: Date.now(),
                model: selectedModel
              });
              
              console.log('Existing history record updated with analysis');
            } catch (error) {
              console.error('Error updating history with analysis:', error);
            }
          }
          // Otherwise create a new history record
          else if (auth.currentUser) {
            const savedAnalysisId = await saveChatAnalysis(auth.currentUser.uid, {
              analysis: finalAnalysisResults[0]?.analysis,
              messages: messages.map(msg => ({
                role: msg.role,
                content: msg.content
              })),
              timeframe: finalAnalysisResults[0]?.timeframe,
              chartUrls: finalChartUrls,
              timestamp: Date.now(),
              model: selectedModel
            });
            
            // Store the analysis ID for future use
            if (savedAnalysisId) {
              setHistoryId(savedAnalysisId);
              console.log('New history record created with ID:', savedAnalysisId);
            }
          }
          console.log('All analyses saved successfully');
        } catch (err) {
          console.error('Error saving analysis:', err);
        }
      }
      console.log('Process complete.');
    } catch (error) {
      console.error('Analysis failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      handleError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePreviousAnalysis = () => {
    if (currentAnalysisIndex > 0) {
      const newIndex = currentAnalysisIndex - 1;
      setCurrentAnalysisIndex(newIndex);
      setAnalysis(analysisResults[newIndex].analysis);
    }
  };

  const handleNextAnalysis = () => {
    if (currentAnalysisIndex < analysisResults.length - 1) {
      const newIndex = currentAnalysisIndex + 1;
      setCurrentAnalysisIndex(newIndex);
      setAnalysis(analysisResults[newIndex].analysis);
    }
  };

  const handleClearAnalysis = () => {
    // Use the resetAnalysis function from the AnalysisContext
    resetAnalysis();
    
    // Reset messages to initial state
    setMessages([{
      role: 'assistant',
      content: initialMessage
    }]);
    setError(null);
    
    // Clear local component state
    setPendingImages([]);
    setAnalysisResults([]);
    setCurrentAnalysisIndex(0);
    
    // Reset UI states
    setShowUploadPrompt(false);
    setShowUploader(false);
    setShowChartGenerator(false);
    
    // Reset history ID to ensure a new record is created for the next analysis
    resetHistoryId();
    
    // Clear the location state to prevent re-initializing on page refresh
    window.history.replaceState({}, document.title);
    
    // Reset the hasLoadedAnalysisRef to allow loading new analysis
    hasLoadedAnalysisRef.current = false;
    
    // Clean up any object URLs to prevent memory leaks
    chartPreviews.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    
    console.log('Analysis cleared completely, history ID reset');
  };

  const handleNewConversation = () => {
    // Clear all current state
    handleClearAnalysis();
    
    // Reset chat-specific state
    setMessages([{ role: 'assistant', content: initialMessage }]);
    setInputMessage('');
    setIsLoading(false);
    setChatHistory([]);
    
    // Reset analysis type to default
    setAnalysisType(AnalysisType.Fundamental);
    
    // Reset selected model to default
    setSelectedModel('anthropic/claude-3-opus:beta');
    
    // Reset history ID
    resetHistoryId();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send message when Enter is pressed without Shift key
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputMessage.trim()) {
        handleSendMessage();
      }
    }
  };

  const handleSendMessage = async () => {
    if (userTokens < 10) { 
      handleLowCredit();
      return;
    }
    if (!inputMessage.trim()) return;
    
    const userMessage = inputMessage.trim();
    setInputMessage('');
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    
    // Start loading state
    setIsLoading(true);
    
    try {
      // Add assistant typing indicator
      setMessages(prev => [...prev, { role: 'assistant', content: '', isTyping: true }]);
      
      // Send message to API - filter out any analysis messages to avoid confusion
      const messagesToSend = messages
        .filter(msg => msg.content !== analysis)
        .concat([{ role: 'user', content: userMessage }]);
      
      const response = await sendChatMessage(
        messagesToSend,
        selectedModel,
        analysis,
        analysisType
      );
      
      // Update chat history
      setChatHistory(prev => [...prev, userMessage, response]);
      
      // Remove typing indicator and add actual response
      const updatedMessages = [
        ...messages.filter(msg => !msg.isTyping),
        { role: 'user', content: userMessage },
        { role: 'assistant', content: response }
      ];
      
      setMessages(updatedMessages);
      
      // Save the updated chat history if a user is logged in
      if (auth.currentUser) {
        try {
          console.log('Preparing to save chat messages to Firebase:', {
            messageCount: updatedMessages.length,
            hasAnalysis: !!analysis,
            hasHistoryId: !!historyId
          });
          
          // Ensure messages are properly formatted for Firebase
          const cleanMessages = updatedMessages.map(msg => ({
            role: msg.role,
            content: msg.content,
            ...(msg.isTyping ? { isTyping: msg.isTyping } : {})
          }));
          
          // Import Firebase functions
          const { ref, update, push, set } = await import('firebase/database');
          
          // If we have an existing history ID, update it
          if (historyId) {
            console.log('Updating existing chat history with ID:', historyId);
            
            const historyRef = ref(database, `users/${auth.currentUser.uid}/history/${historyId}`);
            
            await update(historyRef, {
              messages: cleanMessages,
              lastUpdated: Date.now(),
              model: selectedModel
            });
            
            console.log('Existing chat history updated successfully');
          } 
          // If we don't have a history ID yet, create a new one
          else {
            console.log('Creating new history record for chat');
            
            // Create a new entry
            const newHistoryRef = push(ref(database, `users/${auth.currentUser.uid}/history`));
            
            await set(newHistoryRef, {
              type: 'chat-conversation',
              title: `Chat - ${new Date().toLocaleDateString()}`,
              content: cleanMessages[cleanMessages.length - 1].content,
              messages: cleanMessages,
              timestamp: Date.now(),
              id: newHistoryRef.key,
              model: selectedModel
            });
            
            // Store the new history ID
            if (newHistoryRef.key) {
              setHistoryId(newHistoryRef.key);
              console.log('New history record created with ID:', newHistoryRef.key);
            }
          }
        } catch (error) {
          console.error('Error saving chat history:', error);
        }
      }
    } catch (err) {
      console.error('Error sending message:', err);
      if (err instanceof Error && err.message.includes('Insufficient tokens')) {
        const requiredTokens = parseInt(err.message.match(/\d+/)?.[0] || '0');
        setRequiredTokens(requiredTokens);
        setIsLowCreditModalOpen(true);
      }
      // Remove typing indicator and add error message
      setMessages(prev => [
        ...prev.filter(msg => !msg.isTyping),
        { role: 'assistant', content: 'Sorry, there was an error processing your message. Please try again.' }
      ]);
    } finally {
      setIsLoading(false);
      setUserTokens(userTokens - 10);
    }
  };

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (historyId) {
      sessionStorage.setItem('currentHistoryId', historyId);
      console.log('History ID saved to sessionStorage:', historyId);
    }
  }, [historyId]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // Only clear if user logs out
        setImage(null);
        setAnalysis(null);
        setTimeframe('');
        setMessages([{
          role: 'assistant',
          content: initialMessage
        }]);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!auth.currentUser) return; // Don't load if not authenticated
    
    // Only load messages from localStorage
    const savedMessages = localStorage.getItem('messages');
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('messages', JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    const storedPreviews = sessionStorage.getItem('chartPreviews');
    if (storedPreviews) {
      const previews = JSON.parse(storedPreviews);
      setChartPreviews(previews);
      setPendingImages(previews);
    }
  }, []);

  useEffect(() => {
    const clearChat = () => {
      setMessages([{
        role: 'assistant',
        content: initialMessage
      }]);
    };

    window.addEventListener('beforeunload', clearChat);
    
    return () => {
      window.removeEventListener('beforeunload', clearChat);
    };
  }, [initialMessage]);

  useEffect(() => {
    if (location.state?.newSession) {
      console.log('Starting new Analysis session');
      
      // Reset all state variables to their initial values
      setMessages([{
        role: 'assistant',
        content: initialMessage
      }]);
      setSelectedModel(AVAILABLE_MODELS[0].id);
      setAnalysisType(AnalysisType.Fundamental);
      setImage(null);
      setPendingImages([]);
      setShowUploader(true);
      setShowUploadPrompt(false);
      setIsLoading(false);
      setError(null);
      setIsGeneratingChart(false);
      
      // Clear the location state to prevent re-initializing on page refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state, initialMessage]);

  const resetHistoryId = () => {
    setHistoryId(null);
    sessionStorage.removeItem('currentHistoryId');
    // Also reset model-specific history IDs and conversations
    setModelHistoryIds({});
    setModelConversations({});
    console.log('History ID reset for new conversation');
  };

  const [isLowCreditModalOpen, setIsLowCreditModalOpen] = useState(false);

  const handleLowCredit = () => {
    setIsLowCreditModalOpen(true);
  };

  const handlePurchaseCredits = () => {
    // Redirect to purchase page
    navigate('/purchase');
    setIsLowCreditModalOpen(false);
  };

  // Create futuristic particle animation effect
  useEffect(() => {
    if (theme !== 'dark' && particleContainerRef.current) {
      // Create and animate glowing particles
      const container = particleContainerRef.current;
      container.innerHTML = '';
      
      // Create particles
      for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'absolute rounded-full';
        
        // Random size between 2px and 6px
        const size = Math.random() * 4 + 2;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        // Random position
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        
        // Cyan glow with random opacity
        particle.style.backgroundColor = '#00e5ff';
        particle.style.opacity = `${Math.random() * 0.5 + 0.2}`;
        particle.style.boxShadow = '0 0 8px #00e5ff';
        
        // Animation duration between 10s and 20s
        const duration = Math.random() * 10 + 10;
        particle.style.animation = `float ${duration}s infinite linear`;
        
        container.appendChild(particle);
      }
      
      // Add keyframe animation dynamically if not already added
      if (!document.getElementById('particle-keyframes')) {
        const style = document.createElement('style');
        style.id = 'particle-keyframes';
        style.innerHTML = `
          @keyframes float {
            0% { transform: translate(0, 0); opacity: 0.1; }
            25% { transform: translate(5px, 10px); opacity: 0.3; }
            50% { transform: translate(-5px, 15px); opacity: 0.5; }
            75% { transform: translate(10px, 5px); opacity: 0.3; }
            100% { transform: translate(0, 0); opacity: 0.1; }
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, [theme]);
  
  // Add hero section animation effects
  useEffect(() => {
    if (theme !== 'dark' && heroRef.current) {
      const container = heroRef.current;
      container.innerHTML = '';
      
      // Create circuit-like lines
      for (let i = 0; i < 8; i++) {
        const line = document.createElement('div');
        line.className = 'absolute';
        
        // Create horizontal or vertical line randomly
        const isHorizontal = Math.random() > 0.5;
        if (isHorizontal) {
          line.style.height = '1px';
          line.style.width = `${30 + Math.random() * 30}%`;
          line.style.top = `${Math.random() * 100}%`;
          line.style.left = `${Math.random() * 70}%`;
        } else {
          line.style.width = '1px';
          line.style.height = `${30 + Math.random() * 30}%`;
          line.style.left = `${Math.random() * 100}%`;
          line.style.top = `${Math.random() * 70}%`;
        }
        
        // Styling
        line.style.backgroundColor = 'rgba(0, 229, 255, 0.3)';
        line.style.boxShadow = '0 0 5px rgba(0, 229, 255, 0.3)';
        
        // Pulse animation
        const delay = Math.random() * 5;
        line.style.animation = `linePulse 4s infinite ${delay}s`;
        
        container.appendChild(line);
      }
      
      // Create connection nodes
      for (let i = 0; i < 10; i++) {
        const node = document.createElement('div');
        node.className = 'absolute rounded-full';
        node.style.width = '4px';
        node.style.height = '4px';
        node.style.backgroundColor = '#00e5ff';
        node.style.boxShadow = '0 0 8px #00e5ff';
        node.style.left = `${Math.random() * 100}%`;
        node.style.top = `${Math.random() * 100}%`;
        
        // Pulse animation
        const delay = Math.random() * 5;
        node.style.animation = `nodePulse 3s infinite ${delay}s`;
        
        container.appendChild(node);
      }
      
      // Add keyframe animations
      if (!document.getElementById('circuit-keyframes')) {
        const style = document.createElement('style');
        style.id = 'circuit-keyframes';
        style.innerHTML = `
          @keyframes linePulse {
            0% { opacity: 0.1; }
            50% { opacity: 0.5; }
            100% { opacity: 0.1; }
          }
          
          @keyframes nodePulse {
            0% { transform: scale(1); opacity: 0.5; }
            50% { transform: scale(1.5); opacity: 1; }
            100% { transform: scale(1); opacity: 0.5; }
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, [theme]);
  
  // Add scanline animation effect
  useEffect(() => {
    if (theme !== 'dark' && scanlineRef.current) {
      const container = scanlineRef.current;
      container.innerHTML = '';
      
      // Create scanline effect
      const scanline = document.createElement('div');
      scanline.className = 'absolute left-0 right-0';
      scanline.style.height = '2px';
      scanline.style.backgroundColor = 'rgba(0, 229, 255, 0.15)';
      scanline.style.boxShadow = '0 0 8px rgba(0, 229, 255, 0.5)';
      scanline.style.animation = 'scanline 3s linear infinite';
      
      container.appendChild(scanline);
      
      // Add keyframe animation
      if (!document.getElementById('scanline-keyframes')) {
        const style = document.createElement('style');
        style.id = 'scanline-keyframes';
        style.innerHTML = `
          @keyframes scanline {
            0% { top: 0; opacity: 0; }
            5% { opacity: 0.8; }
            95% { opacity: 0.8; }
            100% { top: 100%; opacity: 0; }
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, [theme]);
  
  // Create futuristic data grid animation
  useEffect(() => {
    if (theme !== 'dark' && dataGridRef.current) {
      const container = dataGridRef.current;
      container.innerHTML = '';
      
      // Create a grid of data cells
      for (let i = 0; i < 80; i++) {
        const cell = document.createElement('div');
        cell.className = 'absolute rounded-sm';
        
        // Small cells
        cell.style.width = '2px';
        cell.style.height = '2px';
        
        // Position in a grid-like pattern
        const row = Math.floor(i / 10);
        const col = i % 10;
        cell.style.left = `${col * 10 + Math.random() * 3}%`;
        cell.style.top = `${row * 12.5 + Math.random() * 3}%`;
        
        // Cyan color with varying opacity
        cell.style.backgroundColor = '#00e5ff';
        cell.style.opacity = '0';
        
        // Pulse animation with random delay
        const delay = Math.random() * 8;
        cell.style.animation = `dataPulse 2s infinite ${delay}s`;
        
        container.appendChild(cell);
      }
      
      // Add keyframe animation dynamically if not already added
      if (!document.getElementById('data-pulse-keyframes')) {
        const style = document.createElement('style');
        style.id = 'data-pulse-keyframes';
        style.innerHTML = `
          @keyframes dataPulse {
            0% { opacity: 0; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.5); }
            100% { opacity: 0; transform: scale(1); }
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, [theme]);
  
  // Create data stream effect
  useEffect(() => {
    if (theme !== 'dark' && dataStreamRef.current) {
      const container = dataStreamRef.current;
      container.innerHTML = '';
      
      // Binary data symbols
      const symbols = ['0', '1'];
      
      // Create 5 columns of streaming data
      for (let col = 0; col < 5; col++) {
        const column = document.createElement('div');
        column.className = 'absolute top-0 bottom-0';
        column.style.width = '20px';
        column.style.left = `${15 + col * 20}%`;
        column.style.overflow = 'hidden';
        column.style.color = 'rgba(0, 229, 255, 0.5)';
        column.style.fontSize = '10px';
        column.style.fontFamily = 'monospace';
        column.style.opacity = '0.7';
        column.style.pointerEvents = 'none';
        
        // Create binary data stream
        let stream = '';
        for (let i = 0; i < 30; i++) {
          stream += symbols[Math.floor(Math.random() * symbols.length)] + '<br>';
        }
        
        column.innerHTML = stream;
        column.style.animation = `dataStream ${5 + col * 2}s linear infinite`;
        
        container.appendChild(column);
      }
      
      // Add keyframe animation dynamically if not already added
      if (!document.getElementById('data-stream-keyframes')) {
        const style = document.createElement('style');
        style.id = 'data-stream-keyframes';
        style.innerHTML = `
          @keyframes dataStream {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(100%); }
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, [theme]);
  
  // Matrix digital rain effect animation
  useEffect(() => {
    if (theme !== 'dark' && matrixRef.current) {
      const container = matrixRef.current;
      container.innerHTML = '';
      
      // Set up canvas for matrix rain
      const canvas = document.createElement('canvas');
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.opacity = '0.15';
      canvas.style.pointerEvents = 'none';
      container.appendChild(canvas);
      
      const ctx = canvas.getContext('2d');
      
      // Matrix characters
      const chars = '01100101010111001010101010'.split('');
      
      // Columns setup
      const fontSize = 10;
      const columns = Math.floor(canvas.width / fontSize);
      const drops = Array(columns).fill(1);
      
      // Drawing function
      function draw() {
        // Semi-transparent black overlay to create fade effect
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Set text color and font
        ctx.fillStyle = '#0ff';
        ctx.font = `${fontSize}px monospace`;
        
        // Loop through each drop
        for (let i = 0; i < drops.length; i++) {
          // Select a random character
          const char = chars[Math.floor(Math.random() * chars.length)];
          
          // Draw the character
          ctx.fillText(char, i * fontSize, drops[i] * fontSize);
          
          // Move drop down and reset at random if it goes off screen
          if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
          }
          
          drops[i]++;
        }
      }
      
      // Animation loop
      const interval = setInterval(draw, 33);
      
      // Clean up on unmount
      return () => {
        clearInterval(interval);
      };
    }
  }, [theme]);

  // Add a style tag for themed background that matches profile page
  useEffect(() => {
    const chatPageStyle = document.createElement('style');
    chatPageStyle.innerHTML = `
      /* Global AI chat page styling */
      .ai-chat-page-container {
        background: linear-gradient(90deg, #B0B4B9 0%, #D3D6D9 100%) !important;
        color: var(--main-title, #E3E5E7) !important;
        height: calc(100vh - 80px) !important;
        position: fixed !important;
        top: 80px !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        overflow-y: auto !important;
        box-shadow: inset 0 0 40px rgba(109, 114, 120, 0.3) !important;
        transition: padding-left 0.3s ease-in-out !important;
        z-index: 20 !important;
      }
      
      /* New AI chat page styling */
      .ai-chat-page {
        padding-top: 60px !important; /* Space for the title */
      }
      
      /* Header border styling */
      .metallic-border-bottom {
        border-bottom: 1px solid rgba(0, 133, 215, 0.3) !important;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
      }
      
      /* Center title with respect to the visible area */
      .ai-chat-title-container {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
        pointer-events: none;
      }
      
      .ai-chat-title-content {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        pointer-events: auto;
      }
      
      /* Adjust header based on sidebar state */
      @media (min-width: 768px) {
        .ai-chat-header.sidebar-expanded {
          left: 16rem !important;
          width: calc(100% - 16rem) !important;
        }
        
        .ai-chat-header.sidebar-collapsed {
          left: 4rem !important;
          width: calc(100% - 4rem) !important;
        }
      }
      
      .ai-chat-page-container.dark {
        background: linear-gradient(90deg, #B0B4B9 0%, #D3D6D9 100%) !important;
        color: #C9CCCF !important;
        box-shadow: inset 0 0 40px rgba(109, 114, 120, 0.5) !important;
      }
      
      /* Force all text elements to use the navbar blue */
      .ai-chat-page *, .ai-chat-page *::before, .ai-chat-page *::after {
        color: var(--logo-inner-blue, #00A9E0) !important;
      }
      
      /* Fix for body and html to prevent any background showing through */
      body, html {
        margin: 0 !important;
        padding: 0 !important;
        overflow-x: hidden !important;
      }
      
      /* Apply the token styling to chat elements */
      .chat-text, .ai-chat-page h1, .ai-chat-page h2, .ai-chat-page p, .ai-chat-page span,
      .ai-chat-page div, .ai-chat-page button, .ai-chat-page input,
      .ai-chat-page textarea, .ai-chat-page select, .ai-chat-page option {
        color: var(--logo-inner-blue, #00A9E0) !important;
        text-shadow: 0 0 5px rgba(0, 229, 255, 0.5) !important;
      }
      
      /* Target all icons in chat */
      .ai-chat-page svg {
        color: var(--logo-inner-blue, #00A9E0) !important;
        filter: drop-shadow(0 0 5px rgba(0, 229, 255, 0.5)) !important;
      }
      
      /* Card styling */
      .chat-card {
        background: rgba(176, 180, 185, 0.4) !important;
        border: 1.5px solid #C9CCCF !important;
        box-shadow: 0 2px 24px 0 rgba(109, 114, 120, 0.25) !important;
        backdrop-filter: blur(5px) !important;
        border-radius: 0.5rem !important;
      }
    `;
    document.head.appendChild(chatPageStyle);
    
    return () => {
      document.head.removeChild(chatPageStyle);
    };
  }, []);

  // Main render
  return (
    <div
      className={`ai-chat-page-container ai-chat-page min-h-screen w-full flex flex-col text-white silver-theme-container ${theme} silver-theme ${!isCollapsed ? 'sidebar-expanded' : 'sidebar-collapsed'}`}

      style={{
        background: 'linear-gradient(180deg, #333333 0%, #18181b 100%) !important',
        width: '100vw',
        margin: 0,
        padding: 0,
      }}
    >
      <div className="relative w-10 h-10 silver-card metallic-border metallic-glow mt-8 ml-8">
        <div className="absolute inset-2 flex items-center justify-center">
          <Code2 className="w-6 h-6" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 opacity-20 rounded-full animate-pulse"></div>
      </div>
      <h1 className="text-3xl font-bold silver-text ml-8 mt-2">
        AI Analysis
      </h1>
      {/* Global dot pattern overlay for entire page */}
      <div className="fixed inset-0 z-0" style={{
        backgroundImage: 'radial-gradient(rgba(0, 229, 255, 0.15) 2px, transparent 2px)',
        backgroundSize: '30px 30px',
        opacity: 0.3,
        pointerEvents: 'none'
      }}></div>
      
      {/* Subtle glow effects */}
      <div className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 rounded-full" style={{
          background: 'radial-gradient(circle, rgba(0, 229, 255, 0.3) 0%, transparent 70%)',
          filter: 'blur(60px)',
          transform: 'translate(-30%, -30%)'
        }}></div>
        <div className="absolute bottom-0 right-0 w-2/3 h-2/3 rounded-full" style={{
          background: 'radial-gradient(circle, rgba(0, 229, 255, 0.2) 0%, transparent 70%)',
          filter: 'blur(80px)',
          transform: 'translate(20%, 20%)'
        }}></div>
      </div>
      
      {/* Animation containers */}
      <div ref={particleContainerRef} className="fixed top-0 left-0 w-full h-full z-0" />
      <div ref={dataGridRef} className="fixed top-0 left-0 w-full h-full z-0" />
      <div ref={scanlineRef} className="fixed top-0 left-0 w-full h-full z-0" />
      <div ref={dataStreamRef} className="fixed top-0 left-0 w-full h-full z-0" />
      <div ref={heroRef} className="fixed top-0 left-0 w-full h-full z-0" />
      <div ref={matrixRef} className="fixed top-0 left-0 w-full h-full z-0" />
      <div className="max-w-full flex flex-col lg:flex-row gap-6 w-full relative z-10 px-4 py-4 mt-16">
        {/* Left side - Image Upload and Analysis Area */}
        <div className="w-full h-full flex flex-col space-y-6 px-1 sm:px-2 md:px-4 mt-0">
          {/* Upload/Generate Options */}
          <div className="flex flex-col h-full rounded-lg p-0 overflow-hidden mt-0 w-[90%] mx-auto" style={{
            background: 'linear-gradient(135deg, #444444 0%, #2a2a2a 100%)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3), 0 0 15px rgba(192, 192, 192, 0.2), 0 0 30px rgba(192, 192, 192, 0.1)',
            border: '3px solid #555555'
          }}>
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-medium silver-text flex items-center gap-2">
                <MessageSquare className="w-5 h-5" /> AI Analysis Chat
              </h3>
              <div className="flex items-center">
                <span className="text-xs mr-2 silver-text">Selected: {AVAILABLE_MODELS.find(m => m.id === selectedModel)?.name}</span>
              </div>
            </div>
            <div className="flex items-center justify-center w-full">
              <div
                className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer ${isDragging ? 'border-cyan-400' : 'border-gray-600 hover:bg-gray-700/50'}`}
                style={{
                  background: isDragging ? 'rgba(10, 25, 47, 0.5)' : 'rgba(10, 25, 47, 0.3)',
                  border: `2px dashed ${isDragging ? 'rgba(0, 229, 255, 0.8)' : 'rgba(0, 229, 255, 0.3)'}`,
                  boxShadow: isDragging ? 'inset 0 0 30px rgba(0, 229, 255, 0.3), 0 0 20px rgba(0, 229, 255, 0.2)' : 'inset 0 0 20px rgba(0, 229, 255, 0.1)'
                }}
                onDrop={handleFileDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(false);
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*"
                  multiple
                  className="hidden"
                  id="file-upload"
                />
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-8 h-8 mb-4 text-cyan-300" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                  </svg>
                  <p className="mb-2 text-sm text-cyan-200">
                    <span className="font-semibold text-cyan-100">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-cyan-300">PNG, JPG or GIF</p>
                </div>
              </div>
            </div>
          </div>

          {/* Chart Previews Section */}
          {pendingImages.length > 0 && (
            <div className="rounded-lg p-3 w-full silver-card mt-6">
              <div className="flex justify-between items-center mb-3 p-2">
                <h3 className="text-xl font-semibold silver-text">Chart Previews</h3>
                
                {/* Pagination controls */}
                {analysisResults.length > 1 && (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handlePreviousAnalysis}
                      disabled={currentAnalysisIndex === 0}
                      className={`p-1 rounded-full ${currentAnalysisIndex === 0 ? 'text-cyan-800' : 'text-cyan-400 hover:bg-cyan-900/30'} silver-card`}
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <span className="text-sm silver-text">
                      {currentAnalysisIndex + 1} / {analysisResults.length}
                    </span>
                    <button 
                      onClick={handleNextAnalysis}
                      disabled={currentAnalysisIndex === analysisResults.length - 1}
                      className={`p-1 rounded-full ${currentAnalysisIndex === analysisResults.length - 1 ? 'text-cyan-800' : 'text-cyan-400 hover:bg-cyan-900/30'} silver-card`}
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Analysis Results */}
          <div className="flex justify-between items-center mb-0 mt-4">
            <h3 className="text-xl font-semibold silver-text">Analysis Results</h3>
            <button
              onClick={handleClearAnalysis}
              className="px-4 py-2 my-1 rounded-lg silver-text transition-all duration-300 silver-card"
            >
              Clear Analysis
            </button>
          </div>
          <div className="rounded-lg p-0 mb-0 silver-card">
            {error ? (
              <div className="flex items-start space-x-2 p-4 text-red-300">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <pre className="whitespace-pre-wrap font-mono text-sm">{error}</pre>
              </div>
            ) : isAnalyzing ? (
              <div className="flex flex-col items-center justify-center space-y-4 text-cyan-200 h-full p-8">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                <div className="text-lg font-medium silver-text">Analyzing chart {currentChart}/{totalCharts}</div>
                <div className="text-sm text-cyan-300">This may take a few moments</div>
              </div>
            ) : analysis ? (
              <div className="rounded-lg p-8 mb-6 silver-card">
                {/* Header Section */}
                <div className="pb-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-3xl font-bold silver-text">Analysis Results</h2>
                    
                    {/* Pagination controls */}
                    {analysisResults.length > 1 && (
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={handlePreviousAnalysis}
                          disabled={currentAnalysisIndex === 0}
                          className={`p-1 rounded-full ${currentAnalysisIndex === 0 ? 'text-cyan-800' : 'text-cyan-400 hover:bg-cyan-900/30'} silver-card`}
                        >
                          <ChevronLeft className="w-6 h-6" />
                        </button>
                        <span className="text-sm silver-text">
                          {currentAnalysisIndex + 1} / {analysisResults.length}
                        </span>
                        <button 
                          onClick={handleNextAnalysis}
                          disabled={currentAnalysisIndex === analysisResults.length - 1}
                          className={`p-1 rounded-full ${currentAnalysisIndex === analysisResults.length - 1 ? 'text-cyan-800' : 'text-cyan-400 hover:bg-cyan-900/30'} silver-card`}
                        >
                          <ChevronRight className="w-6 h-6" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Analysis Content */}
                <div className="space-y-6 relative w-full overflow-hidden">
                  <Markdown 
                    className={`${styles.markdownContent} w-full overflow-x-auto`}
                    components={{
                      h1: ({node, ...props}) => (
                        <h1 className={styles.markdownH1} {...props} />
                      ),
                      h2: ({node, ...props}) => (
                        <h2 className={styles.markdownH2} {...props} />
                      ),
                      ul: ({node, ...props}) => (
                        <ul className={styles.markdownUl} {...props} />
                      ),
                      li: ({node, ...props}) => (
                        <li className={styles.markdownLi} {...props} />
                      ),
                      strong: ({node, ...props}) => (
                        <strong className={styles.markdownStrong} {...props} />
                      ),
                      p: ({node, ...props}) => (
                        <p className={styles.markdownP} {...props} />
                      )
                    }}
                  >
                    {analysis}
                  </Markdown>
                </div>
              </div>
            ) : (
              <div className="text-white text-center p-10 silver-text">
                Upload a chart image to see the analysis here
              </div>
            )}
          </div>
        </div>

        {/* Right side - Chat Interface */}
        <div className="w-full lg:w-6/12 shrink-0 overflow-hidden flex flex-col h-[calc(100vh-120px)] pr-8" style={{ maxHeight: 'calc(90vh - 120px)' }}>
          <div className="rounded-lg p-1 flex flex-col overflow-hidden h-full silver-card">
            {/* Header with Model Selection */}
            <div className="mb-2 p-2">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="relative w-10 h-10 silver-card">
                      <div className="absolute inset-2 flex items-center justify-center">
                        <Code2 className="w-6 h-6" />
                      </div>
                    </div>
                    <h2 className="text-lg font-medium silver-text">AI Analysis Chat</h2>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-sm silver-text truncate max-w-[150px] xl:max-w-[200px]">
                    <span className="whitespace-nowrap">Selected: </span>
                    <span className="silver-text font-medium">
                      {AVAILABLE_MODELS.find(m => m.id === selectedModel)?.name || selectedModel}
                    </span>
                  </span>
                </div>
              </div>
              <div className="mb-4">
                <select 
                  value={selectedModel} 
                  onChange={(e) => {
                    const newModel = e.target.value as ModelId;
                    
                    // Save current state for the current model
                    setModelConversations(prev => ({
                      ...prev,
                      [selectedModel]: {
                        messages,
                        analysis,
                        chartPreviews
                      }
                    }));
                    
                    // Update the selected model
                    setSelectedModel(newModel);
                    
                    // Switch to the history ID for the new model if it exists
                    if (modelHistoryIds[newModel]) {
                      setHistoryId(modelHistoryIds[newModel]);
                    } else {
                      // Reset history ID for new model conversation
                      setHistoryId(null);
                    }
                    
                    // Restore state for the new model if it exists
                    if (modelConversations[newModel]) {
                      setMessages(modelConversations[newModel].messages);
                      setAnalysis(modelConversations[newModel].analysis);
                      setChartPreviews(modelConversations[newModel].chartPreviews);
                    } else {
                      // Initialize with default state for new model
                      setMessages([{
                        role: 'assistant',
                        content: initialMessage
                      }]);
                      setAnalysis('');
                      setChartPreviews([]);
                    }
                  }}
                  className="w-full p-2 text-sm rounded transition-all duration-200 silver-card"
                >
                  <optgroup label="Premium Models">
                    {premiumModels.map(model => (
                      <option key={model.id} value={model.id}>
                        {model.name} {model.creditCost > 0 && `(${model.creditCost}x credit)`} {model.beta && '• Beta'}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Non-Premium Models">
                    {nonPremiumModels.map(model => (
                      <option key={model.id} value={model.id}>
                        {model.name} {model.creditCost > 0 && `(${model.creditCost}x credit)`} {model.beta && '• Beta'}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>

            {/* Chat Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-hide" ref={messagesContainerRef}>
              {messages.map((message, index) => (
                <ChatMessage 
                  key={index} 
                  message={message} 
                  isLoading={isLoading && index === messages.length - 1 && message.role === 'assistant'} 
                  isCurrent={index === messages.length - 1}
                />
              ))}
              
              {error && (
                <div className="p-3 rounded-lg bg-red-900/50 border border-red-700/50 text-red-200 mt-4">
                  Error: {error}
                </div>
              )}

              {isAnalyzing && (
                <div className="flex items-center mt-4">
                  <span className="mr-2 silver-text">Analyzing chart {currentChart}/{totalCharts}</span>
                  <div className="animate-bounce silver-text">.</div>
                  <div className="animate-bounce animation-delay-200 silver-text">.</div>
                  <div className="animate-bounce animation-delay-400 silver-text">.</div>
                </div>
              )}
            </div>

            {/* New Conversation Button */}
            <div className="mt-1">
              <button
                onClick={handleNewConversation}
                className="w-full mb-2 py-1 px-3 rounded-lg flex items-center justify-center silver-card transition-all duration-200"
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                <span className="silver-text">New Conversation</span>
              </button>
            </div>

            {/* Input Area */}
            <div className="flex flex-wrap md:flex-nowrap gap-1 items-end w-full min-h-[60px] mt-auto silver-card p-2 rounded-lg">
              <textarea
                placeholder="Type your message..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                rows={2}
                className="flex-1 p-2 rounded-lg w-full min-w-[200px] resize-none text-sm silver-card"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="ml-1 p-3 rounded-full flex items-center justify-center silver-card"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Upload Confirmation Modal */}
      {showUploadPrompt && (
        <UploadConfirmationModal
          onClose={handleCloseUpload}
          onUploadMore={handleUploadMore}
          onAnalyze={handleFinishUploading}
          charts={pendingImages}
          isAnalyzing={isAnalyzing}
        />
      )}
      {/* Chart Preview */}
      {selectedPreviewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="rounded-lg shadow-lg overflow-hidden max-w-4xl mx-auto silver-card">
            {/* Close button */}
            <button
              onClick={() => setSelectedPreviewUrl(null)}
              className={`absolute top-2 right-2 ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
              aria-label="Close chart preview"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h2 className="text-xl font-semibold mb-4 text-white">Chart Preview</h2>
            <img 
              src={selectedPreviewUrl} 
              alt="Chart preview" 
              className="w-full rounded-lg"
            />
          </div>
        </div>
      )}
      <LowCreditModal
        isOpen={isLowCreditModalOpen}
        onClose={() => setIsLowCreditModalOpen(false)}
        onPurchase={handlePurchaseCredits}
        requiredTokens={requiredTokens}
      />
    </div>
  );
}

export default AIAnalysisChat;
