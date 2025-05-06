import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Cloud, Upload, BarChart2, HelpCircle, TrendingUp, RefreshCw, Activity, ClipboardCheck, User, Bot } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import '../styles/metallicBrushTheme.css';
import { sendChatMessageBackend, getAvailableModels } from '../services/backendApi';

type ChatMessage = {
  id?: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
};

type Model = {
  id: string;
  name: string;
  description: string;
  premium: boolean;
  creditCost: number;
  beta: boolean;
};

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



const MetallicBrushAnalyzerUI: React.FC = () => {
  const location = useLocation();
  const locationState = location.state as {
    analysisId?: string;
    content?: string;
    messages?: any[];
    timeframe?: string | null;
    chartUrls?: string[];
    model?: string;
    loadTime?: number;
  } | null;

  // Initialize with either history messages or a welcome message
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    // If we have history messages from navigation state, use those
    if (locationState?.messages && Array.isArray(locationState.messages)) {
      // Convert the messages to our ChatMessage format
      return locationState.messages
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .map(msg => ({
          sender: msg.role as 'user' | 'assistant',
          text: msg.content || ''
        }));
    }
    // Otherwise use the default welcome message
    return [{ 
      sender: 'assistant', 
      text: 'Upload an image and I\'ll help you analyze afterwards' 
    }];
  });

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>(locationState?.model || '');
  const [isUploading, setIsUploading] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<string | null>(
    locationState?.content || null
  );
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(
    // If we have chart URLs from history, use the first one
    locationState?.chartUrls && locationState.chartUrls.length > 0 
      ? locationState.chartUrls[0] 
      : null
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom of messages when they change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle history loading confirmation
  useEffect(() => {
    // If we loaded from history, add a confirmation message
    if (locationState?.analysisId && locationState?.content) {
      console.log('Loading history data:', locationState);
      
      // Force immediate update of all states from location state
      if (locationState.messages && Array.isArray(locationState.messages)) {
        const formattedMessages = locationState.messages
          .filter(msg => msg.role === 'user' || msg.role === 'assistant')
          .map(msg => ({
            sender: msg.role as 'user' | 'assistant',
            text: msg.content || ''
          }));
        
        // Add confirmation message directly to the formatted messages
        formattedMessages.push({
          sender: 'assistant',
          text: 'Analysis history successfully loaded! 📊'
        });
          
        // Set messages immediately with the confirmation included
        setMessages(formattedMessages);
      }
      
      // Set other states from location state
      if (locationState.content) {
        setAnalysisResults(locationState.content);
      }
      
      if (locationState.chartUrls && locationState.chartUrls.length > 0) {
        setUploadedImage(locationState.chartUrls[0]);
      }
      
      if (locationState.model) {
        setSelectedModel(locationState.model);
      }
    }
  }, [locationState?.loadTime]); // Using loadTime as dependency to ensure it runs when history is loaded


  useEffect(() => {
    (async () => {
      try {
        const data = await getAvailableModels();
        if (Array.isArray(data)) {
          setModels(data);
          
          // If we have a model from history, use that
          if (locationState?.model) {
            setSelectedModel(locationState.model);
          } else if (data.length > 0) {
            // Otherwise use the first available model
            setSelectedModel(data[0].id);
          }
        } else {
          setModels([]);
        }
      } catch (err) {
        setModels([]);
      }
    })();
  }, [locationState?.model]); // Add locationState.model as dependency

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    setIsLoading(true);
    const userMessage: ChatMessage = { sender: 'user', text: inputMessage };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    try {
      // Always include the latest analysisResults as a system message for context
      let chatHistory = [...messages, userMessage].map(({ sender, text }) => ({ role: sender, content: text }));
      if (analysisResults) {
        chatHistory = [
          { role: 'system', content: `Analysis Result:\n${analysisResults}` },
          ...chatHistory
        ];
      }
      const response = await sendChatMessageBackend(
        chatHistory,
        selectedModel
      );
      // Assume response is a string or { reply: string }
      const assistantText = typeof response === 'string' ? response : (response.reply || '');
      setMessages((prev) => [...prev, { sender: 'assistant', text: assistantText }]);
    } catch (err) {
      setMessages((prev) => [...prev, { sender: 'assistant', text: 'Sorry, there was an error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };


  const handleNewConversation = (addWelcomeMessage = true) => {
    // Clear all state instead of reloading the page
    if (addWelcomeMessage) {
      setMessages([{ 
        sender: 'assistant', 
        text: 'Upload an image and I\'ll help you analyze it.' 
      }]);
    } else {
      // Just clear the messages without adding a welcome message
      setMessages([]);
    }
    
    setInputMessage('');
    setAnalysisResults(null);
    setUploadedImage(null);
    setUploadError(null);
    setIsAnalyzing(false);
    setIsUploading(false);
    
    // Reset any file inputs by clearing their value
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
      const fileInput = input as HTMLInputElement;
      fileInput.value = '';
    });
    
    // Clear the location state by replacing the current URL without state
    window.history.replaceState({}, document.title, window.location.pathname);
    
    // Force a re-render of any components that might be caching state
    setTimeout(() => {
      // This small timeout helps ensure the UI is fully updated
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Handle file input change for image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Only image files are supported.');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      setUploadedImage(base64);
      setIsAnalyzing(true);
      setAnalysisResults(null);
      try {
        const result = await import('../services/backendApi').then(api => api.analyzeImageBackend(base64, selectedModel));
        setAnalysisResults(result);
setMessages((prev) => [...prev, { sender: 'assistant', text: 'Analyzing complete. You can now ask questions about the analysis result.' }]);
      } catch (err) {
        setUploadError('Failed to analyze image. Please try again.');
        setAnalysisResults(null);
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.onerror = () => {
      setUploadError('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    setAnalysisResults(null);
    setUploadError(null);
  };


  return (
    <div className="metallic-brush-theme metallic-brush-container" style={{ marginTop: 0, position: 'relative', zIndex: 30, height: 'calc(100vh - 64px)' }}>
      {/* Main Content */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', position: 'relative', overflow: 'hidden' }}>
        {/* Fixed Header - Always visible */}
        <div style={{ position: 'sticky', top: 0, zIndex: 50, backgroundColor: 'rgba(30, 41, 59, 0.95)', borderBottom: '1px solid rgba(148, 163, 184, 0.3)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)' }}>
          <div className="metallic-brush-main-header" style={{ padding: '1.25rem 1.5rem' }}>
            <div className="metallic-brush-main-title">
              <BarChart2 size={24} className="mr-2" />
              <span>AI Chart Analyzer</span>
            </div>
          </div>
        </div>
        
        {/* Scrollable Content Area - Fixed height, no scrolling */}
        <div style={{ flex: 1, overflow: 'hidden', paddingTop: '10px', position: 'relative', zIndex: 30, height: 'calc(100vh - 64px - 60px)', maxHeight: 'calc(100vh - 64px - 60px)' }} className="scrollbar-hide">
          <div className="metallic-brush-content" style={{ display: 'flex', flexWrap: 'nowrap', height: '100%', maxHeight: '100%' }}>
          {/* Left Panel - Chart Upload */}
          <div className="metallic-brush-left-panel scrollbar-hide" style={{ flex: '6', minWidth: '0', overflow: 'auto', position: 'relative', zIndex: 20, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Chart Upload</h2>
              {/* Close button removed */}
            </div>
            
            <div className="metallic-brush-instructions">
              <p><strong>AI Chart Analyzer Instructions:</strong></p>
              <div className="instructions-grid" style={{ maxWidth: '100%', overflow: 'hidden' }}>
                <div className="instructions-column" style={{ width: '100%' }}>
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

            {/* Chart Upload Section - moved here */}
            <div className="metallic-brush-upload-outer">
              <div className="metallic-brush-upload-dropzone">
                {!uploadedImage && (
                  <label className="metallic-brush-upload-label">
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleImageUpload}
                      disabled={isAnalyzing}
                    />
                    <div className="metallic-brush-upload-center">
                      <Cloud size={48} className="metallic-brush-upload-cloud" />
                      <div className="metallic-brush-upload-text-main">Click to upload or drag and drop</div>
                      <div className="metallic-brush-upload-text-sub">PNG, JPG or GIF</div>
                    </div>
                  </label>
                )}
                {uploadedImage && (
                  <div className="metallic-brush-upload-preview">
                    <img src={uploadedImage} alt="Uploaded Chart" className="metallic-brush-image-preview" />
                    <button className="metallic-brush-remove-btn" onClick={handleRemoveImage} disabled={isAnalyzing}>
                      Remove
                    </button>
                  </div>
                )}
                {uploadError && <div className="metallic-brush-error">{uploadError}</div>}
              </div>
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
                    onClick={() => handleNewConversation(false)}
                  >
                    Clear Analysis
                  </button>
                )}
              </div>
              <div className="metallic-brush-analysis-content" style={{ height: '300px', maxHeight: '300px' }}>
                {isAnalyzing && (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
                    <p>Analyzing chart...</p>
                  </div>
                )}
                {!isAnalyzing && analysisResults && (
                  <div style={{ maxWidth: '100%', overflow: 'hidden', wordBreak: 'break-word', height: '100%' }}>
                    <pre className="whitespace-pre-wrap text-sm" style={{ maxWidth: '100%', height: '100%' }}>{(typeof analysisResults === 'string' ? analysisResults : String(analysisResults)).replace(/##?\s?/g, '').replace(/\*\*/g, '')}</pre>
                  </div>
                )}
                {!isAnalyzing && !analysisResults && (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <p>Upload a chart image to see the analysis here</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Chat */}
          <div className="metallic-brush-right-panel scrollbar-hide" style={{ flex: '4', minWidth: '320px', maxWidth: '520px', overflow: 'hidden', display: 'flex', flexDirection: 'column', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div className="metallic-brush-chat-header">
              <h2 className="text-xl font-semibold">Chat Analysis</h2>
              <div className="metallic-brush-model-selector">
                <div className="flex items-center">
                  <span>Model:</span>
                  <select
                    className="ml-2 px-2 py-1 rounded bg-gray-700 text-white border border-gray-500"
                    value={selectedModel}
                    onChange={e => setSelectedModel(e.target.value)}
                  >
                    {models.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name} {model.premium ? '⭐' : ''}
                      </option>
                    ))}
                  </select>
                  {models.find(m => m.id === selectedModel)?.premium && (
                    <span className="metallic-brush-premium-badge ml-2">Premium</span>
                  )}
                </div>
                <div className="text-xs text-gray-400">
                  {models.find(m => m.id === selectedModel)?.description || ''}
                </div>
              </div>
            </div>
            


            <div className="metallic-brush-chat-messages scrollbar-hide" style={{ height: '300px', maxHeight: '545px', overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <div className="chat-messages-container" style={{ maxWidth: '100%' }}>
                {messages.map((message, index) => (
                  <div 
                    key={message.id || index}
                    className={`metallic-brush-message ${message.sender} ${message.sender === 'user' ? 'right' : 'left'}`}
                    style={{ maxWidth: '90%', wordBreak: 'break-word' }}
                  >
                    <span className="chat-icon">
                      {message.sender === 'user' ? <User size={20} className="user-icon" /> : <Bot size={20} className="ai-icon" />}
                    </span>
                    <span className="chat-text" style={{ maxWidth: '100%', overflowWrap: 'break-word' }}>{(typeof message.text === 'string' ? message.text : String(message.text || '')).replace(/##?\s?/g, '').replace(/\*\*/g, '')}</span>
                  </div>
                ))}
                {isLoading && (
                  <div className="metallic-brush-message assistant metallic-brush-thinking">
                    <span className="thinking-dot">Thinking<span className="dot-1">.</span><span className="dot-2">.</span><span className="dot-3">.</span></span>
                  </div>
                )}
              </div>
              <div ref={messagesEndRef} style={{ height: 0, overflow: 'hidden' }} />
            </div>

            <div className="metallic-brush-new-conversation" onClick={() => handleNewConversation(true)}>
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
                disabled={isLoading}
              />
              <button 
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
              >
                <Send size={18} />
              </button>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetallicBrushAnalyzerUI;
