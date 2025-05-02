import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Cloud, Upload, BarChart2, HelpCircle, TrendingUp, RefreshCw, Activity, ClipboardCheck } from 'lucide-react';
import '../styles/metallicBrushTheme.css';

// Removed sidebar mock data as it's no longer needed

// Mock data for supported indicators
const supportedIndicators = [
  'Simple Moving Average',
  'Fibonacci retracements',
  'Bollinger Bands',
  'Relative Strength Index',
  'Stochastic Oscillator',
  'Exponential Moving Average',
  'Average True Range',
  'Standard Deviation Indicator',
  'Average Directional Index (ADX)',
  'Moving Average Convergence Divergence (MACD)'
];

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const MetallicBrushAnalyzerUI: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  // Model displayed in the UI - used in the JSX below
  const selectedModel = 'GPT-4o';
  // Always visible now that we removed the close button
  const [isUploading, setIsUploading] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<string | null>(null);

  // Initialize with welcome message
  useEffect(() => {
    setMessages([
      {
        role: 'assistant' as const,
        content: "Hello! I can help you analyze market conditions and trading opportunities. Select an AI model and analysis type to begin."
      }
    ]);
  }, []);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    // Add user message
    const newMessages = [...messages, { role: 'user' as const, content: inputMessage }];
    setMessages(newMessages);
    setInputMessage('');

    // Simulate AI response after a delay
    setTimeout(() => {
      setMessages([
        ...newMessages,
        {
          role: 'assistant' as const,
          content: "I'll analyze that for you. Based on the current market conditions, we're seeing a bullish trend with strong support at the $45.70 level. The RSI is at 65, indicating moderate bullish momentum, while the MACD is showing a positive divergence. Would you like me to provide more specific details about any particular indicator?"
        }
      ]);
    }, 1500);
  };

  const handleNewConversation = () => {
    setMessages([
      {
        role: 'assistant' as const,
        content: "Hello! I can help you analyze market conditions and trading opportunities. Select an AI model and analysis type to begin."
      }
    ]);
    setAnalysisResults(null);
  };

  const handleUploadChart = () => {
    setIsUploading(true);
    
    // Simulate chart upload and analysis
    setTimeout(() => {
      setIsUploading(false);
      setAnalysisResults(`
      🤖 **AI ANALYSIS**
      Symbol: EURUSD
      Timeframe: 4H
      ---
      📊 **MARKET SUMMARY**
      - **Current Price:** 1.0842
      - **Support Levels:** 1.0820, 1.0795
      - **Resistance Levels:** 1.0865, 1.0890
      - **Market Structure:** Sideways consolidation
      - **Volatility:** Moderate
      ---
      📈 **TECHNICAL ANALYSIS**
      - **Price Movement:** EURUSD is trading within a tight range between 1.0820 and 1.0865, showing signs of consolidation after a recent downtrend. Price is currently testing the upper boundary of this range.
      
      **TECHNICAL INDICATORS**
      
      - 🎯 **RSI INDICATOR**
      - **Current Values:** 52.8
      - **Signal:** Neutral
      - **Analysis:** RSI is in neutral territory, suggesting balanced buying and selling pressure
      
      - 📊 **MACD INDICATOR**
      - **Current Values:** MACD line: -0.0012, Signal line: -0.0018, Histogram: 0.0006
      - **Signal:** Bullish divergence
      - **Analysis:** MACD histogram turning positive, indicating potential upward momentum
      ---
      💡 **TRADING SIGNAL**
      - **Action:** BUY
      - **Entry Price:** 1.0845
      - **Stop Loss:** 1.0815
      - **Take Profit:** 1.0885
      ---
      📈**Signal Reasoning:**
      - Price bouncing off support with increasing momentum
      - MACD showing bullish divergence
      - Price structure forming higher lows
      - Volume increasing on upward movements
      ---
      ⚠️**Risk Assessment:**
      - Keep position size limited to 2% of capital
      - Be aware of upcoming ECB announcement
      - Major resistance at 1.0890 could limit upside
      ---
      Confidence Level: 68%
      `);
    }, 2000);
  };

  return (
    <div className="metallic-brush-theme metallic-brush-container">
      {/* Main Content */}
      <div className="metallic-brush-main">
        {/* Main Header */}
        <div className="metallic-brush-main-header">
          <div className="metallic-brush-main-title">
            <BarChart2 size={24} className="mr-2" />
            <span>AI Chart Analyzer</span>
          </div>
        </div>
        
        {/* Removed redundant header */}

        {/* Content Area */}
        <div className="metallic-brush-content">
          {/* Left Panel - Chart Upload */}
          <div className="metallic-brush-left-panel">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Chart Upload</h2>
              {/* Close button removed */}
            </div>
            
            <div className="metallic-brush-instructions">
              <p><strong>AI Chart Analyzer Instructions:</strong></p>
              <div className="instructions-grid">
                <div className="instructions-grid">
                  <div className="instruction-item">
                    <div className="instruction-icon upload">
                      <Upload size={18} className="animated-icon" />
                    </div>
                    <span className="instruction-text">1. Upload your trading chart image (PNG, JPG, or GIF)</span>
                  </div>
                  <div className="instruction-item">
                    <div className="instruction-icon analyze">
                      <BarChart2 size={18} className="animated-icon" />
                    </div>
                    <span className="instruction-text">2. AI analyze the chart for patterns and indicators</span>
                  </div>
                  <div className="instruction-item">
                    <div className="instruction-icon review">
                      <ClipboardCheck size={18} className="animated-icon" />
                    </div>
                    <span className="instruction-text">3. Review the analysis results below after processing</span>
                  </div>
                  <div className="instruction-item">
                    <div className="instruction-icon chat">
                      <MessageSquare size={18} className="animated-icon" />
                    </div>
                    <span className="instruction-text">4. Ask questions in the chat panel on the right</span>
                  </div>
                </div>
              </div>
            </div>

            <div 
              className="metallic-brush-upload-area"
              onClick={handleUploadChart}
            >
              <Cloud size={48} className="metallic-brush-upload-icon" />
              <p className="text-center">Click to upload or drag and drop</p>
              <p className="text-sm text-gray-400 mt-2 text-center">PNG, JPG or GIF</p>
            </div>

            <div className="metallic-brush-indicators-list">
              <h3 className="text-sm font-medium">Supported Technical Indicators:</h3>
              <p className="text-xs text-gray-400 mb-2">The analyzer has been optimized for these specific indicators:</p>
              <div className="indicators-grid">
                <div className="indicators-column">
                  {supportedIndicators.slice(0, 5).map((indicator, index) => (
                    <div key={index} className="indicator-item">{index + 1}. {indicator}</div>
                  ))}
                </div>
                <div className="indicators-column">
                  {supportedIndicators.slice(5, 10).map((indicator, index) => (
                    <div key={index} className="indicator-item">{index + 6}. {indicator}</div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">Other indicators may not work as expected.</p>
            </div>

            <div className="metallic-brush-analysis-results">
              <div className="metallic-brush-analysis-header">
                <h2 className="text-xl font-semibold">Analysis Results</h2>
                {analysisResults && (
                  <button 
                    className="metallic-brush-btn metallic-brush-btn-secondary text-xs"
                    onClick={() => setAnalysisResults(null)}
                  >
                    Clear Analysis
                  </button>
                )}
              </div>
              <div className="metallic-brush-analysis-content">
                {isUploading ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
                    <p>Analyzing chart...</p>
                  </div>
                ) : analysisResults ? (
                  <pre className="whitespace-pre-wrap text-sm">{analysisResults}</pre>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <p>Upload a chart image to see the analysis here</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Chat */}
          <div className="metallic-brush-right-panel">
            <div className="metallic-brush-chat-header">
              <h2 className="text-xl font-semibold">Chat Analysis</h2>
              <div className="metallic-brush-model-selector">
                <div className="flex items-center">
                  <span>Selected Model:</span>
                  <span className="metallic-brush-model-badge">{selectedModel}</span>
                  <span className="metallic-brush-premium-badge">Premium</span>
                </div>
                <div className="text-xs text-gray-400">
                  {selectedModel} (1.25x credit)
                </div>
              </div>
            </div>
            
            <div className="metallic-brush-instructions">
              <p><strong>AI Chat Instructions:</strong></p>
              <div className="instructions-grid">
                <div className="instruction-item">
                  <div className="instruction-icon question">
                    <HelpCircle size={18} className="animated-icon" />
                  </div>
                  <span className="instruction-text">1. Ask specific questions about the chart analysis</span>
                </div>
                <div className="instruction-item">
                  <div className="instruction-icon strategy">
                    <TrendingUp size={18} className="animated-icon" />
                  </div>
                  <span className="instruction-text">2. Request trading strategies or risk assessments</span>
                </div>
                <div className="instruction-item">
                  <div className="instruction-icon indicator">
                    <Activity size={18} className="animated-icon" />
                  </div>
                  <span className="instruction-text">3. Inquire about specific indicators or patterns</span>
                </div>
                <div className="instruction-item">
                  <div className="instruction-icon refresh">
                    <RefreshCw size={18} className="animated-icon" />
                  </div>
                  <span className="instruction-text">4. Click "New Conversation" to start fresh</span>
                </div>
              </div>
            </div>

            <div className="metallic-brush-chat-messages">
              {messages.map((message, index) => (
                <div 
                  key={index} 
                  className={`metallic-brush-message ${message.role}`}
                >
                  {message.content}
                </div>
              ))}
            </div>

            <div className="metallic-brush-new-conversation" onClick={handleNewConversation}>
              <MessageSquare size={16} />
              <span>New Conversation</span>
            </div>

            <div className="metallic-brush-chat-input">
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
              />
              <button 
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetallicBrushAnalyzerUI;
