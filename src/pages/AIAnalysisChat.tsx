import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Cloud, Upload, BarChart2, HelpCircle, TrendingUp, RefreshCw, Activity, ClipboardCheck } from 'lucide-react';
import '../styles/metallicBrushTheme.css';
import { sendChatMessageBackend, getAvailableModels } from '../services/backendApi';

type ChatMessage = {
  id?: string;
  sender: 'user' | 'assistant';
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);



  useEffect(() => {
    (async () => {
      try {
        const data = await getAvailableModels();
        if (Array.isArray(data)) {
          setModels(data);
          if (data.length > 0) setSelectedModel(data[0].id);
        } else {
          setModels([]);
        }
      } catch (err) {
        setModels([]);
      }
    })();
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    setIsLoading(true);
    const userMessage: ChatMessage = { sender: 'user', text: inputMessage };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    try {
      const response = await sendChatMessageBackend(
        [...messages, userMessage].map(({ sender, text }) => ({ role: sender, content: text })),
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


  const handleNewConversation = () => {
    window.location.reload(); // Simple way to reset session and state
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
                    onClick={() => setAnalysisResults(null)}
                  >
                    Clear Analysis
                  </button>
                )}
              </div>
              <div className="metallic-brush-analysis-content">
                {isAnalyzing && (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
                    <p>Analyzing chart...</p>
                  </div>
                )}
                {!isAnalyzing && analysisResults && (
                  <pre className="whitespace-pre-wrap text-sm">{(analysisResults || '').replace(/##?\s?/g, '').replace(/\*\*/g, '')}</pre>
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
          <div className="metallic-brush-right-panel">
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
            


            <div className="metallic-brush-chat-messages">
              {messages.map((message, index) => (
                <div 
                  key={message.id || index} 
                  className={`metallic-brush-message ${message.sender}`}
                >
                  {message.text}
                </div>
              ))}
              <div ref={messagesEndRef} />
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
  );
};

export default MetallicBrushAnalyzerUI;
