import '../styles/EAGenerator.css';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '../components/Button';
import { AnimatedIntro } from '../components/AnimatedIntro';
import { generateEACode } from '../lib/api';
import { Send, Copy, Image as ImageIcon, Bot, ArrowRight, ChevronDown, ChevronUp, Code2, Paperclip, X } from 'lucide-react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { saveEAHistory } from '../lib/firebase';
import { useLocation } from 'react-router-dom';
import { AVAILABLE_MODELS, type ModelId } from '../services/modelUtils';
import { useTheme } from '../contexts/ThemeContext';
import { useSidebarState } from '../contexts/SidebarContext';

export function EAGenerator() {
  const location = useLocation();
  const { state } = location;
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
  const { theme } = useTheme();
  const { isCollapsed } = useSidebarState();

  const [isGuideExpanded, setIsGuideExpanded] = useState(true);
  const [hasSeenIntro, setHasSeenIntro] = useState(true);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [messages, setMessages] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
    image?: string;
  }>>([]);
  // Initialize with the model from location state if available, otherwise use default
  const [selectedModel, setSelectedModel] = useState(() => {
    // Check if we have a model in location state
    console.log('DEBUG - Location state at initialization:', location.state);
    console.log('DEBUG - Available models:', AVAILABLE_MODELS.map(m => m.id));
    if (location.state?.model) {
      console.log('DEBUG - Initializing with model from location state:', location.state.model);
      return location.state.model;
    }
    // Otherwise use the default model
    console.log('DEBUG - No model in location state, using default:', AVAILABLE_MODELS[0].id);
    return AVAILABLE_MODELS[0].id;
  });
 
   // Helper function to extract title from conversation
   const extractTitle = (messages: Array<{role: string; content: string}>) => {
     // Look for strategy description in user messages
     for (const msg of messages) {
       if (msg.role === 'user') {
         // Look for common strategy indicators
         const content = msg.content.toLowerCase();
         if (content.includes('strategy') || 
             content.includes('ea') || 
             content.includes('indicator') ||
             content.includes('trading')) {
           // Extract first meaningful sentence
           const sentences = msg.content.split(/[.!?]+/);
           const firstSentence = sentences[0].trim();
           if (firstSentence.length > 10 && firstSentence.length < 100) {
             return `EA Generator - ${firstSentence}`;
           }
         }
       }
     }
     return 'EA Generator - Custom Strategy';
   };

  // Dedicated effect for model selection that runs after component mount
  useEffect(() => {
    if (location.state?.model) {
      console.log('MODEL SELECTION EFFECT - Setting model from location state:', location.state.model);
      // Use a timeout to ensure this runs after the component is fully mounted
      setTimeout(() => {
        setSelectedModel(location.state.model);
      }, 500);
    }
  }, []); // Empty dependency array ensures this only runs once after mount

   // Load previous conversation if available
   useEffect(() => {
     console.log('EAGenerator mounted with state:', state);
     
     // If this is a new session, reset everything
     if (state?.newSession) {
       console.log('Starting new EA Generator session');
       setMessages([{
         role: 'assistant',
         content: `Welcome! I'm ready to help you create your Expert Advisor.\n\nLet me help you develop a complete trading strategy. Please provide details about:\n\n1. INDICATOR SETTINGS\n   - Which indicators do you want to use?\n   - Specific periods and parameters?\n\n2. ENTRY RULES\n   - What conditions trigger a buy/sell?\n   - Required confirmations?\n   - Specific price patterns?\n\n3. EXIT RULES\n   - Take profit targets?\n   - Stop loss placement?\n   - Trailing stop rules?\n\n4. RISK MANAGEMENT\n   - Risk per trade?\n   - Trading sessions?\n   - Maximum spread?\n\nExample: "I want to trade using 20 EMA and 50 SMA with RSI(14). Buy when EMA crosses above SMA and RSI > 40. Sell when EMA crosses below SMA and RSI < 60. Use 2% risk per trade, 50 pip SL, 100 pip TP. Only trade during London/NY overlap with max 5 pip spread."`,
       }]);
       setCurrentHistoryId(null);
       setInput('');
       setAttachedFile(null);
       setAttachedImage(null);
       setImagePreview(null);
       return;
     }
     
     // First priority: Check for messages array in state
     if (state?.messages && Array.isArray(state.messages)) {
       console.log('Loading previous EA conversation from messages array:', state.messages);
       
       // If loading from history, set the history ID from state
       if (state.historyId) {
         setCurrentHistoryId(state.historyId);
       }
       
       // IMPORTANT FIX: Reset messages first to force a re-render
       setMessages([]);
       
       // Wait for the next tick before setting messages
       setTimeout(() => {
         // Create a deep copy to ensure React detects the change
         const loadedMessages = state.messages.map(msg => ({
           role: msg.role as 'user' | 'assistant',
           content: msg.content || '',
           image: msg.image
         }));
         
         console.log('Setting messages:', loadedMessages);
         setMessages(loadedMessages);
       }, 50);
     } 
     // Second priority: Try to parse content as JSON (for backward compatibility)
     else if (state?.historyId && state?.content) {
       console.log('Loading from history with content:', state.content);
       setCurrentHistoryId(state.historyId);
       
       // Parse the content if it's a JSON string, otherwise use as is
       try {
         const parsedContent = JSON.parse(state.content);
         if (Array.isArray(parsedContent) && parsedContent.length > 0) {
           // IMPORTANT FIX: Reset messages first to force a re-render
           setMessages([]);
           
           // Wait for the next tick before setting messages
           setTimeout(() => {
             const loadedMessages = parsedContent.map(msg => ({
               role: msg.role as 'user' | 'assistant',
               content: msg.content || '',
               image: msg.image
             }));
             
             console.log('Setting parsed messages:', loadedMessages);
             setMessages(loadedMessages);
           }, 50);
         } else {
           // If content is not in expected format, create a new conversation with it
           setMessages([
             {
               role: 'assistant',
               content: `Welcome! I'm ready to help you create your Expert Advisor.`,
             },
             {
               role: 'user',
               content: state.content,
             }
           ]);
         }
       } catch (e) {
         console.log('Error parsing content, treating as plain text');
         // If content is not JSON, create a new conversation with it as user message
         setMessages([
           {
             role: 'assistant',
             content: `Welcome! I'm ready to help you create your Expert Advisor.`,
           },
           {
             role: 'user',
             content: state.content,
           }
         ]);
       }
     } 
     // Default: Add welcome message if no messages exist
     else if (messages.length === 0) {
       // Add welcome message only after intro animation completes
       if (hasSeenIntro) {
         setMessages([{
           role: 'assistant',
           content: `Welcome! I'm ready to help you create your Expert Advisor.\n\nLet me help you develop a complete trading strategy. Please provide details about:\n\n1. INDICATOR SETTINGS\n   - Which indicators do you want to use?\n   - Specific periods and parameters?\n\n2. ENTRY RULES\n   - What conditions trigger a buy/sell?\n   - Required confirmations?\n   - Specific price patterns?\n\n3. EXIT RULES\n   - Take profit targets?\n   - Stop loss placement?\n   - Trailing stop rules?\n\n4. RISK MANAGEMENT\n   - Risk per trade?\n   - Trading sessions?\n   - Maximum spread?\n\nExample: "I want to trade using 20 EMA and 50 SMA with RSI(14). Buy when EMA crosses above SMA and RSI > 40. Sell when EMA crosses below SMA and RSI < 60. Use 2% risk per trade, 50 pip SL, 100 pip TP. Only trade during London/NY overlap with max 5 pip spread."`,
         }]);
       }
     }
     
     return () => {
       console.log('EAGenerator unmounting');
     };
   }, [hasSeenIntro, state]);
 
   // Add this effect to log messages changes (for debugging)
   useEffect(() => {
     console.log('Messages updated:', messages.length, 'messages');
   }, [messages]);
 
   useEffect(() => {
     // Add welcome message only after intro animation completes
     if (hasSeenIntro && messages.length === 0) {
       setMessages([{
         role: 'assistant',
         content: `Welcome! I'm ready to help you create your Expert Advisor.\n\nLet me help you develop a complete trading strategy. Please provide details about:\n\n1. INDICATOR SETTINGS\n   - Which indicators do you want to use?\n   - Specific periods and parameters?\n\n2. ENTRY RULES\n   - What conditions trigger a buy/sell?\n   - Required confirmations?\n   - Specific price patterns?\n\n3. EXIT RULES\n   - Take profit targets?\n   - Stop loss placement?\n   - Trailing stop rules?\n\n4. RISK MANAGEMENT\n   - Risk per trade?\n   - Trading sessions?\n   - Maximum spread?\n\nExample: "I want to trade using 20 EMA and 50 SMA with RSI(14). Buy when EMA crosses above SMA and RSI > 40. Sell when EMA crosses below SMA and RSI < 60. Use 2% risk per trade, 50 pip SL, 100 pip TP. Only trade during London/NY overlap with max 5 pip spread."`,
       }]);
     }
   }, [hasSeenIntro]);
 
   const [input, setInput] = useState('');
   const [isGenerating, setIsGenerating] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
   const [hasClipboardImage, setHasClipboardImage] = useState(false);
   const messagesEndRef = useRef<HTMLDivElement>(null);
 
   // Save message history when messages change
   useEffect(() => {
     const saveHistory = async () => {
       console.log('Attempting to save history:', {
         messageCount: messages.length,
         currentHistoryId,
         hasUser: !!auth.currentUser
       });
 
       // Skip if we only have the welcome message
       if (messages.length <= 1) return;
 
       const lastMessage = messages[messages.length - 1];
       const secondLastMessage = messages[messages.length - 2];
 
       console.log('Last messages:', {
         lastMessage: {
           role: lastMessage?.role,
           contentLength: lastMessage?.content.length
         },
         secondLastMessage: {
           role: secondLastMessage?.role,
           contentLength: secondLastMessage?.content.length
         }
       });
       
       const user = auth.currentUser;
       if (!user) {
         console.log('No authenticated user, skipping save');
         return;
       }
 
       // Extract title from the conversation
       const title = extractTitle(messages);
       console.log('Generated title:', title);
 
       try {
         // Save or update history in Firebase
         console.log('Saving to Firebase:', {
           messageCount: messages.length,
           historyId: currentHistoryId,
           title
         });
 
         const historyId = await saveEAHistory(user.uid, {
           messages,
           timestamp: Date.now(),
           title,
           historyId: currentHistoryId, // Pass existing history ID if available
           model: selectedModel // Include the selected model
         });
 
         console.log('Save successful:', { newHistoryId: historyId });
         
         // Update current history ID if this is a new conversation
         if (!currentHistoryId && historyId) {
           console.log('Setting new history ID:', historyId);
           setCurrentHistoryId(historyId);
         }
       } catch (error) {
         console.error('Error saving EA history:', error);
       }
     };
 
     saveHistory();
   }, [messages, currentHistoryId]);
 
   useEffect(() => {
     return () => {
       // Cleanup function to reset state when component unmounts
       setMessages([]);
       setInput('');
       setIsGenerating(false);
       setAttachedFile(null);
       setAttachedImage(null);
       setImagePreview(null);
     };
   }, []);
 
   const scrollToBottom = () => {
     const messagesContainer = messagesEndRef.current?.parentElement;
     if (!messagesContainer) return;
     
     const { scrollHeight, clientHeight, scrollTop } = messagesContainer;
     const maxScroll = scrollHeight - clientHeight;
     
     // Only auto-scroll if we're already near the bottom
     const isNearBottom = maxScroll - scrollTop < 100;
     if (isNearBottom) {
       messagesContainer.scrollTo({
         top: maxScroll,
         behavior: 'smooth'
       });
     }
   };
 
   useEffect(() => {
     // Scroll to top when messages are first loaded
     if (messages.length === 1) {
       messagesEndRef.current?.parentElement?.scrollTo(0, 0);
     } else {
       // Only scroll for new messages
       scrollToBottom();
     }
   }, [messages]);
 
   useEffect(() => {
    // Scroll to bottom of messages when new messages are added
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  }, [messages, isGenerating]);
  
  // Apply theme fixes to elements that are being overwritten
  useEffect(() => {
    // Fix styling issues by directly applying styles to problematic elements
    const styleFixScript = document.createElement('style');
    styleFixScript.innerHTML = `
      /* Force override any conflicting styles */
      .ea-generator-page .message-content,
      .ea-generator-page .message-content div,
      .ea-generator-page .message-content span,
      .ea-generator-page .message-content p,
      .ea-generator-page .message-content li {
        color: #E3E5E7 !important;
        text-shadow: none !important;
      }
      
      /* Fix form elements */
      .ea-generator-page textarea,
      .ea-generator-page select,
      .ea-generator-page option,
      .ea-generator-page optgroup {
        color: white !important;
        text-shadow: none !important;
        background-color: rgba(10, 25, 47, 0.6) !important;
        border: 1px solid rgba(0, 229, 255, 0.2) !important;
      }
      
      /* Fix form container */
      .ea-generator-page form {
       
        border-top: 1px solid rgba(0, 229, 255, 0.3) !important;
      }
      
      /* Fix form text elements */
      .ea-generator-page form span,
      .ea-generator-page form div:not(.ea-generator-card):not(.message-content pre):not(.message-content code) {
        color: #E3E5E7 !important;
        text-shadow: none !important;
      }
      
      /* Fix buttons in form */
      .ea-generator-page form button {
        color: white !important;
        text-shadow: none !important;
      }
      
      /* Fix send button */
      .ea-generator-page form button[type="submit"] {
        background: linear-gradient(to right, #00A9E0, #147BC1) !important;
        border: 1px solid rgba(0, 229, 255, 0.3) !important;
      }
    `;
    document.head.appendChild(styleFixScript);
    
    return () => {
      document.head.removeChild(styleFixScript);
    };
  }, []);
 
   const handlePaste = useCallback(async (e: ClipboardEvent) => {
     const items = Array.from(e.clipboardData?.items || []);
     const imageItem = items.find(item => item.type.startsWith('image/'));
     
     if (imageItem) {
       e.preventDefault();
       const file = imageItem.getAsFile();
       if (!file) {
         return;
       }
       
       try {
         const reader = new FileReader();
         reader.onload = async (event) => {
           const imageData = event.target?.result as string;
           
           // Create user message with image context
           const newUserMessage = {
             role: 'user' as const,
             content: `[Screenshot Analysis Request]\n${input || 'Please analyze this screenshot and help create/fix the EA code.'}`,
             image: imageData,
           };
           setMessages(prev => [...prev, newUserMessage]);
           setInput('');
           
           try {
             const response = await generateEACode({
               message: newUserMessage.content,
               imageData,
               previousMessages: messages.slice(1).slice(-4),
               signal: new AbortController().signal,
               modelId: selectedModel
             });
             
             if (!response.success) {
               throw new Error(response.error || 'Failed to analyze screenshot');
             }
 
             if (response.content) {
               setMessages(prev => [...prev, {
                 role: 'assistant',
                 content: response.content
               }]);
             }
           } catch (error) {
             setMessages(prev => [...prev, {
               role: 'assistant',
               content: error instanceof Error ? error.message : 'Failed to analyze screenshot'
             }]);
           } finally {
             setIsGenerating(false);
           }
         };
         reader.onerror = (error) => {
         };
         reader.readAsDataURL(file);
       } catch (error) {
         setMessages(prev => [...prev, {
           role: 'assistant',
           content: 'Failed to process the image. Please try again.'
         }]);
       }
     }
   }, [input, selectedModel]);
 
   const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (file) {
       if (file.type.startsWith('image/')) {
         try {
           const reader = new FileReader();
           reader.onload = (event) => {
             const imageData = event.target?.result as string;
             setAttachedImage(imageData);
             setImagePreview(imageData);
           };
           reader.readAsDataURL(file);
         } catch (error) {
           console.error('Error reading image file:', error);
         }
       } else {
         setAttachedFile(file);
       }
       // Reset the input value to allow selecting the same file again
       e.target.value = '';
     }
   };
 
   const handleRemoveFile = () => {
     setAttachedFile(null);
     setAttachedImage(null);
     setImagePreview(null);
     setHasClipboardImage(false);
   };
 
   const handleSubmit = async (e: React.FormEvent, imageData?: string) => {
     e.preventDefault();
     if ((!input.trim() && !attachedImage) || isGenerating) {
       return;
     }
 
     setIsGenerating(true);
     const newUserMessage = { 
       role: 'user' as const, 
       content: input.trim() || 'Please analyze this chart',
       image: attachedImage || imageData
     };
 
     setInput('');
     setMessages(prev => [...prev, newUserMessage]);
 
     // Clear the attached image after sending
     if (attachedImage) {
       setAttachedImage(null);
       setImagePreview(null);
     }
 
     // Get previous messages for context, excluding the welcome message
     const contextMessages = messages.slice(1).slice(-4);
 
     try {
       const response = await generateEACode({
         message: newUserMessage.content,
         imageData: newUserMessage.image,
         previousMessages: contextMessages,
         signal: new AbortController().signal,
         modelId: selectedModel
       });
       
       if (!response.success) {
         throw new Error(response.error || 'Failed to analyze trading strategy');
       }
 
       if (response.content) {
         const newAssistantMessage = { role: 'assistant' as const, content: response.content };
         setMessages(prev => [...prev, newAssistantMessage]);
       } else {
         throw new Error('No analysis was generated. Please provide more details about your trading strategy.');
       }
     } catch (error) {
       const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
       setMessages(prev => [...prev, { 
         role: 'assistant', 
         content: `${errorMessage}\n\nTo help you better, please provide complete strategy details:\n
 1. INDICATOR SETTINGS\n   - Moving Average periods (SMA/EMA)\n   - RSI period and levels\n   - Bollinger Bands settings
 
 2. ENTRY RULES\n   - Specific buy/sell conditions\n   - Required confirmations\n   - Price action patterns
 
 3. EXIT RULES\n   - Take profit targets\n   - Stop loss placement\n   - Trailing stop rules
 
 4. RISK MANAGEMENT\n   - Risk per trade\n   - Trading sessions\n   - Maximum spread
 
 Example: "I want to trade using 20 EMA and 50 SMA with RSI(14). Buy when EMA crosses above SMA and RSI > 40. Sell when EMA crosses below SMA and RSI < 60. Use 2% risk per trade, 50 pip SL, 100 pip TP. Only trade during London/NY overlap with max 5 pip spread."`
       }]);
     } finally {
       setIsGenerating(false);
     }
   };
 
   const copyToClipboard = (text: string) => {
     const codeMatch = text.match(/```(?:mql4|mql5)?\n([\s\S]*?)```/);
     if (codeMatch) {
       navigator.clipboard.writeText(codeMatch[1]);
     }
   };
 
   const downloadCode = (text: string) => {
     const codeContent = extractCodeBlock(text);
     const blob = new Blob([codeContent], { type: 'text/plain' });
     const url = URL.createObjectURL(blob);
     
     // Create temporary link and trigger download
     const link = document.createElement('a');
     link.href = url;
     
     // Determine file extension based on code content
     let fileName = 'trading_strategy';
     if (codeContent.includes('//@version=')) {
       fileName += '.pine';  // PineScript
     } else if (codeContent.includes('#property copyright') && codeContent.includes('void OnInit()')) {
       if (codeContent.includes('#property version  "5.')) {
         fileName += '.mq5';  // MQL5
       } else {
         fileName += '.mq4';  // MQL4
       }
     } else {
       fileName += '.txt';  // Default
     }
     
     link.setAttribute('download', fileName);
     document.body.appendChild(link);
     link.click();
     
     // Clean up
     document.body.removeChild(link);
     URL.revokeObjectURL(url);
   };
 
   const extractCodeBlock = (text: string) => {
     // Extract code inside ```
     const matches = text.match(/```(?:\w*\n)?([\s\S]*?)```/);
     return matches ? matches[1] : text;
   };
 
   const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
     const newModel = event.target.value;
     setSelectedModel(newModel);
     
     // If we have a history ID, update the model in history
     if (currentHistoryId && auth.currentUser) {
       console.log('Updating model in history:', newModel);
       // Save the current conversation with the new model
       saveEAHistory(auth.currentUser.uid, {
         messages,
         timestamp: Date.now(),
         title: extractTitle(messages),
         historyId: currentHistoryId,
         model: newModel // Update the model in history
       }).then(() => {
         console.log('Model updated in history successfully');
       }).catch(error => {
         console.error('Error updating model in history:', error);
       });
     }
   };
 
   const handleAIResponse = useCallback(async (response: string) => {
     try {
       setIsGenerating(true);
       
       // Add the AI response to messages
       setMessages(prev => [
         ...prev,
         {
           role: 'assistant',
           content: response,
         }
       ]);
 
       // Log successful response addition
       console.log('AI response added successfully:', {
         contentLength: response.length,
         messageCount: messages.length + 1
       });
     } catch (error) {
       console.error('Error handling AI response:', error);
       
       // Add error message to conversation
       setMessages(prev => [
         ...prev,
         {
           role: 'assistant',
           content: 'Sorry, there was an error processing your request. Please try again.',
         }
       ]);
     } finally {
       setIsGenerating(false);
     }
   }, [messages]);
 
   const handleSend = useCallback(async () => {
     if (!input.trim()) return;

     try {
       // Create a new AbortController for this request
       abortControllerRef.current = new AbortController();
       const signal = abortControllerRef.current.signal;

       // Add user message
       const userMessage = {
         role: 'user',
         content: input,
       };
       setMessages(prev => [...prev, userMessage]);
       setInput('');

       // Generate AI response with the abort signal
       const response = await generateEACode({
         message: input,
         previousMessages: messages,
         signal,
         modelId: selectedModel
       });
       
       // Only process the response if we haven't aborted
       if (!signal.aborted) {
         await handleAIResponse(response.content || 'Error generating response. Please try again.');
       }
     } catch (error) {
       // Check if this was an abort error
       if (error instanceof Error && error.name === 'AbortError') {
         console.log('Request was cancelled');
       } else {
         console.error('Error in handleSend:', error);
         await handleAIResponse('Error generating response. Please try again.');
       }
     }
   }, [input, selectedModel, handleAIResponse]);
 
   return (
     <div 
      className={`ea-generator-page-container ${theme} ea-generator-page min-h-screen w-full flex flex-col p-0 m-0 ${isCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}
     >
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
      
    
      
               <div className="w-full max-w-[99%] lg:max-w-[98%] xl:max-w-[97%] 2xl:max-w-[96%] mx-auto px-1 sm:px-2 md:px-3 py-2 sm:py-3">
         <div className="flex flex-col items-center justify-center mb-4 sm:mb-6 md:mb-8 fade-in">
           <div className="relative mb-4 sm:mb-6 flex justify-center items-center w-16 sm:w-20 h-16 sm:h-20">
             <div className="absolute inset-0" style={{ transform: 'rotate(44.598deg)' }}>
               <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 opacity-100 rounded-full animate-spin-slow"></div>
             </div>
             <div className="absolute inset-0" style={{ transform: 'rotate(-187.464deg)' }}>
               <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 opacity-100 rounded-full animate-reverse-spin"></div>
             </div>
             <div className="absolute inset-2 bg-gray-900 rounded-full"></div>
             <div className="absolute inset-4 flex items-center justify-center">
               <Code2 className="w-6 sm:w-8 h-6 sm:h-8 text-cyan-400" />
             </div>
             <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 opacity-20 rounded-full animate-pulse"></div>
           </div>
           <h1 className="text-4xl sm:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 transition-all duration-500">
             EA Generator
           </h1>
         </div>
         <div className="space-y-2 sm:space-y-3 md:space-y-4">
           {/* Collapsible Guide Section */}
           <div className="p-3 sm:p-4 md:p-5 relative ea-generator-card" style={{ borderRadius: '0.75rem', overflow: 'hidden' }}>
              <button
                onClick={() => setIsGuideExpanded(!isGuideExpanded)}
                className={`w-full flex items-center justify-between relative z-10 ${
                  theme === 'light' ? 'text-white' : 'text-white'
                }`}
                style={theme === 'light' ? {textShadow: '0 0 8px rgba(0, 229, 255, 0.5)'} : {}}
              >
                <h2 className="text-xl font-semibold">Strategy Guide</h2>
                {isGuideExpanded ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>
              {isGuideExpanded && (
               <div className="mt-2 sm:mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 relative z-0">
                 {[
                   {
                     title: '1. Indicator Settings',
                     items: [
                       'Moving Average periods (SMA/EMA)',
                       'RSI period and levels',
                       'Bollinger Bands settings'
                     ]
                   },
                   {
                     title: '2. Entry Rules',
                     items: [
                       'Indicator crossovers',
                       'Price action patterns',
                       'Support/resistance levels'
                     ]
                   },
                   {
                     title: '3. Exit Rules',
                     items: [
                       'Take profit levels',
                       'Stop loss placement',
                       'Trailing stop settings'
                     ]
                   },
                   {
                     title: '4. Risk Management',
                     items: [
                       'Position sizing',
                       'Maximum open positions',
                       'Trading sessions'
                     ]
                   }
                 ].map((section, index) => (
                   <div key={index} className="space-y-2">
                     <h3 className={`font-medium ${theme === 'light' ? 'text-white' : 'text-indigo-300'}`}
                       style={theme === 'light' ? {textShadow: '0 0 8px rgba(0, 229, 255, 0.5)'} : {}}>
                       {section.title}
                     </h3>
                     <ul className="space-y-1">
                       {section.items.map((item, idx) => (
                         <li key={idx} className={`flex items-start ${theme === 'light' ? 'text-white' : 'text-gray-300'}`}>
                           <span className="mr-2">•</span>
                           <span>{item}</span>
                         </li>
                       ))}
                     </ul>
                   </div>
                 ))}
               </div>
             )}
           </div>
           {/* Chat Window */}
           <div className="rounded-xl ea-generator-card overflow-hidden w-full">
             <div className="flex items-center justify-between p-3 sm:p-4 md:p-5 border-b border-cyan-500/30">
               <h2 className="text-xl font-semibold ea-generator-text">Trading Strategy Analyzer</h2>
               <div className="flex items-center gap-2">
                 <Bot className="w-4 h-4" />
                 <span className="text-sm ea-generator-text">AI-Powered</span>
               </div>
             </div>
             {/* Messages */}
             <div className="p-2 sm:p-3 md:p-4 min-h-[400px] max-h-[60vh] overflow-y-auto custom-scrollbar"
             ref={messagesEndRef}>
               <div className="space-y-2 sm:space-y-3 md:space-y-4">
                 {(messages.length > 1 || hasSeenIntro) && (
                   messages.map((message, index) => (
                     <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                       <div className={`max-w-[80%] rounded-lg p-4 ${message.role === 'user' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 border border-cyan-500/30' : 'bg-gradient-to-r  to-cyan-900/70 border border-cyan-500/20'}`} style={{
                         boxShadow: message.role === 'user' 
                           ? '0 0 15px rgba(0, 229, 255, 0.3)' 
                           : '0 0 10px rgba(0, 229, 255, 0.15)'
                       }}>
                         {message.image && (
                           <div className="mb-2">
                             <img 
                               src={message.image} 
                               alt="Attached chart" 
                               className="rounded-lg max-w-full max-h-[300px] object-contain"
                             />
                           </div>
                         )}
                         <div className="whitespace-pre-wrap message-content">
                           {message.content.split('```').map((part, i) => {
                             // If this is an even-indexed part, it's normal text
                             if (i % 2 === 0) {
                               return (
                                 <div key={i} className="mb-2 last:mb-0 ea-generator-text">
                                   {part}
                                 </div>
                               );
                             }
                             
                             // If this is an odd-indexed part, it's code
                             const codeLines = part.split('\n');
                             const language = codeLines[0] || '';
                             const code = codeLines.slice(1).join('\n');
                             
                             return (
                               <div key={i} className="mb-4 last:mb-0 relative group">
                                 <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity ea-generator-text">
                                   <button
                                     onClick={() => navigator.clipboard.writeText(code)}
                                     className="p-1 rounded-md hover:bg-cyan-800/50"
                                     title="Copy code"
                                   >
                                     <Copy className="w-4 h-4" />
                                   </button>
                                 </div>
                                 <pre className="p-4 rounded-md overflow-x-auto bg-gray-900/70 text-white border border-cyan-500/20" style={{
                                   boxShadow: 'inset 0 0 10px rgba(0, 229, 255, 0.1)'
                                 }}>
                                   <code>{code}</code>
                                 </pre>
                               </div>
                             );
                           })}
                         </div>
                       </div>
                     </div>
                   ))
                 )}
                 
                 {isGenerating && (
                   <div className="flex justify-start">
                     <div className="max-w-[80%] rounded-lg p-4 bg-gradient-to-r from-gray-900/70 to-cyan-900/70 border border-cyan-500/20" style={{
                       boxShadow: '0 0 10px rgba(0, 229, 255, 0.15)'
                     }}>
                       <div className="flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
                         <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse delay-75"></div>
                         <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse delay-150"></div>
                         <span className="text-cyan-200 ea-generator-text">
                           Generating strategy...
                         </span>
                       </div>
                     </div>
                   </div>
                 )}
               </div>
             </div>
             
             {/* Input Form */}
             <form onSubmit={handleSubmit} className="p-2 sm:p-3 md:p-4 border-t border-cyan-500/30" style={{
             }}>
                <div className="flex flex-wrap items-center mb-2 sm:mb-3">
                  <span className="text-sm flex items-center ea-generator-text">
                    Model: {AVAILABLE_MODELS.find(model => model.id === selectedModel)?.name}
                    {AVAILABLE_MODELS.find(model => model.id === selectedModel)?.creditCost === 0 && 
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-cyan-900/70 text-cyan-200 border border-cyan-500/30">Free</span>
                    }
                    {AVAILABLE_MODELS.find(model => model.id === selectedModel)?.creditCost > 0 && 
                      <span className="ml-2 text-xs ea-generator-text">
                        {AVAILABLE_MODELS.find(model => model.id === selectedModel)?.creditCost}x credit
                      </span>
                    }
                    {AVAILABLE_MODELS.find(model => model.id === selectedModel)?.beta && 
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-900/60 text-white border border-cyan-500/30">Beta</span>
                    }
                  </span>
                  <select 
                    id="model-select" 
                    value={selectedModel} 
                    onChange={handleModelChange} 
                    className="p-2 rounded-lg border ml-auto bg-gray-900/70 border-cyan-500/30 text-white"
                    style={{
                      boxShadow: '0 0 10px rgba(0, 229, 255, 0.2)'
                    }}
                  >
                   <optgroup label="Premium Models">
                     {AVAILABLE_MODELS.filter(model => model.premium).map((model) => (
                       <option key={model.id} value={model.id}>
                         {model.name} {model.creditCost > 0 && `(${model.creditCost}x credit)`} {model.beta && '• Beta'}
                       </option>
                     ))}
                   </optgroup>
                   <optgroup label="Non-Premium Models">
                     {AVAILABLE_MODELS.filter(model => !model.premium).map((model) => (
                       <option key={model.id} value={model.id}>
                         {model.name} {model.creditCost > 0 && `(${model.creditCost}x credit)`} {model.beta && '• Beta'}
                       </option>
                     ))}
                   </optgroup>
                 </select>
               </div>
               <textarea
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter') {
                     // If Shift+Enter, allow new line
                     if (e.shiftKey) {
                       return;
                     }
                     // Otherwise prevent default (new line) and submit if possible
                     e.preventDefault();
                     if (!isGenerating && input.trim()) {
                       handleSubmit(e as unknown as React.FormEvent);
                     }
                   }
                 }}
                 placeholder="Type your strategy"
                 className={`w-full h-32 sm:h-36 md:h-40 p-3 sm:p-4 rounded-lg focus:outline-none focus:ring-1 resize-none ${
                   theme === 'light'
                     ? 'bg-gray-50 border border-gray-300 text-gray-800 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500'
                     : 'bg-gray-800/30 border border-gray-700 text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-indigo-500'
                 }`}
                 disabled={isGenerating}
                 onPaste={(e) => {
                   const items = Array.from(e.clipboardData.items);
                   const imageItem = items.find(item => item.type.startsWith('image/'));
                   
                   if (imageItem) {
                     const file = imageItem.getAsFile();
                     if (file) {
                       const reader = new FileReader();
                       reader.onload = (event) => {
                         const imageData = event.target?.result as string;
                         setAttachedImage(imageData);
                         setImagePreview(imageData);
                         setHasClipboardImage(true);
                       };
                       reader.readAsDataURL(file);
                     }
                   }
                 }}
               />
                {/* File Attachment Section */}
                {attachedFile && (
                  <div className={`mt-2 mb-4 flex items-center gap-2 rounded-lg p-2 border ${
                    theme === 'light'
                      ? 'bg-gray-900/70 border border-cyan-500/30 text-cyan-200'
                      : 'bg-gray-900/70 border border-cyan-500/30 text-cyan-200'
                  }`} style={{
                    boxShadow: '0 0 10px rgba(0, 229, 255, 0.15)'
                  }}>
                    <ImageIcon className="w-4 h-4 text-cyan-400" />
                    <span style={{textShadow: '0 0 3px rgba(0, 229, 255, 0.3)'}}>File attached: {attachedFile.name}</span>
                  </div>
                )}
                
                {/* Image Preview Section */}
                {imagePreview && (
                  <div className="mt-2 mb-4 rounded-lg overflow-hidden border border-cyan-500/50"
                       style={{
                         boxShadow: '0 0 15px rgba(0, 229, 255, 0.25)',
                       }}>
                    <div className="flex justify-between items-center p-2 bg-gray-900/80">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-cyan-400" style={{filter: 'drop-shadow(0 0 3px rgba(0, 229, 255, 0.5))'}} />
                        <span className="text-cyan-200" style={{textShadow: '0 0 3px rgba(0, 229, 255, 0.3)'}}>Image Preview</span>
                      </div>
                    </div>
                    <div className="relative">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="max-h-[200px] w-auto mx-auto cursor-pointer"
                        onClick={() => setZoomedImage(imagePreview)}
                      />
                      <button 
                        onClick={() => {
                          setImagePreview(null);
                          setAttachedImage(null);
                          setHasClipboardImage(false);
                        }}
                        className="absolute top-2 right-2 p-1 bg-gray-900/80 rounded-full hover:bg-red-900/80 transition-colors"
                        style={{boxShadow: '0 0 10px rgba(0, 229, 255, 0.2)'}}
                      >
                        <X className="w-4 h-4 text-cyan-200" style={{filter: 'drop-shadow(0 0 2px rgba(0, 229, 255, 0.5))'}} />
                      </button>
                    </div>
                  </div>
                )}
               
               <div className="flex items-center justify-between mt-4">
                 <div className="flex items-center gap-4">
                   <input
                     type="file"
                     ref={fileInputRef}
                     onChange={handleFileSelect}
                     accept=".mq4,.mq5,.ex4,.ex5,.txt,image/*"
                     className="hidden"
                   />
                   <button
                     type="button"
                     onClick={() => fileInputRef.current?.click()}
                     className={`flex items-center gap-2 text-sm transition-colors ${
                       theme === 'light'
                         ? 'text-white hover:text-cyan-200'
                         : 'text-white hover:text-cyan-200'
                     }`}
                     style={{textShadow: '0 0 5px rgba(0, 229, 255, 0.5)'}}
                   >
                     {/* <Paperclip className="w-4 h-4" style={{filter: 'drop-shadow(0 0 3px rgba(0, 229, 255, 0.5))'}} />
                     <span className="text-cyan-200">Attach file</span> */}
                   </button>
                 </div>
                 <div className="flex items-center gap-4">
                   </div>
                    {(hasClipboardImage && !attachedImage) ? (
                      <div className={`text-sm flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                        theme === 'light'
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-gray-900/70 border border-cyan-500/30 text-cyan-200'
                      }`} style={{boxShadow: '0 0 10px rgba(0, 229, 255, 0.15)'}}>
                        <ImageIcon className="w-4 h-4 text-cyan-400" />
                        <span>Image detected - Press Enter to analyze</span>
                      </div>
                    ) : null}
                 
                 {isGenerating ? (
                   <Button
                     type="button"
                     onClick={() => {
                       // Cancel the ongoing request
                       if (abortControllerRef.current) {
                         abortControllerRef.current.abort();
                         abortControllerRef.current = null;
                       }
                       
                       // Update UI state
                       setIsGenerating(false);
                       setMessages(prev => [
                         ...prev,
                         {
                           role: 'assistant',
                           content: 'Generation cancelled by user.',
                         }
                       ]);
                     }}
                     className="min-w-[120px] bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
                     style={{textShadow: '0 0 3px rgba(255, 100, 100, 0.5)'}}
                     icon={<X className="w-4 h-4" style={{filter: 'drop-shadow(0 0 3px rgba(255, 100, 100, 0.5))'}} />}
                   >
                     Cancel
                   </Button>
                 ) : (
                   <Button
                     type="submit"
                     disabled={(!input.trim() && !attachedImage) || !input.trim()}
                     icon={<Send className="w-4 h-4" style={{filter: 'drop-shadow(0 0 3px rgba(0, 229, 255, 0.5))'}} />}
                     className="min-w-[120px] bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                     style={{textShadow: '0 0 3px rgba(0, 229, 255, 0.5)'}}
                   >
                     Send
                   </Button>
                 )}
               </div>
             </form>
           </div>
           
           {/* Image Zoom Modal */}
           {zoomedImage && (
             <div 
               className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
               onClick={() => setZoomedImage(null)}
               style={{
                 backdropFilter: 'blur(3px)',
                 backgroundImage: 'radial-gradient(circle at center, rgba(0, 229, 255, 0.1) 0%, rgba(10, 25, 47, 0.95) 100%)'
               }}
             >
               <div className="relative max-w-[90vw] max-h-[90vh]">
                 <button
                   onClick={() => setZoomedImage(null)}
                   className="absolute -top-4 -right-4 p-2 bg-gray-900 border border-cyan-500/50 rounded-full hover:bg-blue-900 transition-colors"
                   style={{
                     boxShadow: '0 0 10px rgba(0, 229, 255, 0.3)'
                   }}
                 >
                   <X className="w-5 h-5 text-white" style={{filter: 'drop-shadow(0 0 2px rgba(0, 229, 255, 0.5))'}} />
                 </button>
                 <img 
                   src={zoomedImage} 
                   alt="Zoomed Chart" 
                   className="max-w-full max-h-[90vh] rounded-lg border border-cyan-500/30"
                   onClick={(e) => e.stopPropagation()}
                   style={{
                     boxShadow: '0 0 20px rgba(0, 229, 255, 0.2)'
                   }}
                 />
               </div>
             </div>
           )}
         </div>
       </div>
     </div>
   );
 }
