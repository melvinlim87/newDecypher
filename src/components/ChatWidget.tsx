import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Minus, Send, Loader2, Bot } from 'lucide-react';
import { auth } from '../lib/firebase';
import { ref, query, orderByChild, get } from 'firebase/database';
import { database } from '../lib/firebase';
import {
  ChatMessage, 
  ChatSession,
  getOrCreateChatSession,
  sendMessage, 
  subscribeToMessages,
  subscribeToSession,
  markMessagesAsRead,
  closeChatSession
} from '../lib/chat';

// Constants for localStorage keys
const CHAT_STATE_KEY = 'chatWidgetState';
const CHAT_LAST_ACTIVE = 'chatLastActive';

// Get stored chat state
// Check if chat should be open based on stored state
const getShouldBeOpen = () => {
  try {
    const stored = localStorage.getItem(CHAT_STATE_KEY);
    const lastActive = Number(localStorage.getItem(CHAT_LAST_ACTIVE) || 0);
    const isExpired = Date.now() - lastActive > 24 * 60 * 60 * 1000;
    return stored === 'true' && !isExpired && !!auth.currentUser;
  } catch (e) {
    return false;
  }
};

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(getShouldBeOpen);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastMessageTime, setLastMessageTime] = useState(0);
  const [chatState, setChatState] = useState<'idle' | 'connecting' | 'connected' | 'error'>(
    getShouldBeOpen() ? 'connecting' : 'idle'
  );
  const [retryTimeout, setRetryTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const initAttempts = useRef(0);
  const maxRetries = 3;

  const initializeChat = useCallback(async () => {
    if (!auth.currentUser) {
      console.error('User is not authenticated.');
      setError('User is not authenticated.');
      return;
    }
    if (chatState !== 'connecting') return;
    
    const formatError = (error: unknown): string => {
      if (error instanceof Error) {
        if (error.message.includes('indexOn')) {
          return 'Initializing chat system...';
        }
        return error.message.replace('Firebase: ', '').replace(/\([^)]*\)/, '');
      }
      return 'An unexpected error occurred';
    };

    // Clear any existing retry timeout
    if (retryTimeout) {
      clearTimeout(retryTimeout);
      setRetryTimeout(null);
    }

    try {
      console.log('Initializing chat session...', {
        attempt: initAttempts.current + 1,
        maxRetries
      });

      // First check for existing active session
      const userId = auth.currentUser.uid;
      const sessionsRef = ref(database, `users/${userId}/chatSessions`);
      const sessionsQuery = query(
        sessionsRef,
        orderByChild('startedAt')
      );

      const snapshot = await get(sessionsQuery);
      let sessionId: string | null = null;

      if (snapshot.exists()) {
        // Find most recent active session
        const sessions = Object.entries(snapshot.val());
        const activeSession = sessions.find(([_, session]: [string, any]) => {
          const isActive = session.status === 'active';
          const isRecent = Date.now() - session.startedAt < 24 * 60 * 60 * 1000;
          return isActive && isRecent;
        });

        if (activeSession) {
          sessionId = activeSession[0];
          console.log('Found existing active session:', sessionId);
        }
      }

      // If no active session found, create new one
      if (!sessionId) {
        sessionId = await getOrCreateChatSession();
      }

      if (!sessionId) {
        throw new Error('No session ID returned');
      }

      console.log('Chat session initialized:', sessionId);
      
      // Subscribe to session updates
      const unsubSession = subscribeToSession(sessionId, setSession);
      
      // Subscribe to messages
      const unsubMessages = subscribeToMessages(sessionId, setMessages);
      
      setChatState('connected');
      setError(null);
      initAttempts.current = 0;

      return () => {
        unsubSession();
        unsubMessages();
      };
    } catch (err) {
      console.error('Failed to create chat session:', err);
      setError(formatError(err));
      
      if (initAttempts.current < maxRetries) {
        initAttempts.current++;
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, initAttempts.current - 1), 8000);
        console.log(`Retrying in ${delay}ms...`);
        
        const timeout = setTimeout(() => {
          if (chatState === 'connecting') {
            initializeChat();
          }
        }, delay);
        setRetryTimeout(timeout);
      }
    }
  }, [chatState]);

  // Cleanup retry timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [retryTimeout]);

  // Persist chat state
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STATE_KEY, isOpen.toString());
      if (isOpen) {
        localStorage.setItem(CHAT_LAST_ACTIVE, Date.now().toString());
      }
    } catch (e) {
      console.error('Error saving chat state:', e);
    }
  }, [isOpen]);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Initialize chat session
  useEffect(() => {
    if (!isOpen || chatState !== 'connecting') {
      return undefined;
    }

    let unsubscribe: (() => void) | undefined;
    
    initializeChat().then(cleanup => {
      unsubscribe = cleanup;
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isOpen, chatState, initializeChat]);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      // Close the session if it exists
      if (session?.id && !isClosing) {
        setIsClosing(true);
        closeChatSession(session.id)
          .then(() => {
            console.log('Chat session closed:', session.id);
          })
          .catch(error => {
            console.error('Error closing chat session:', error);
          })
          .finally(() => {
            setIsClosing(false);
          });
      }

      setChatState('idle');
      setSession(null);
      setMessages([]);
      setError(null);
    }
  }, [isOpen, session?.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    const messagesContainer = messagesEndRef.current?.parentElement;
    if (!messagesContainer) return;
    
    const { scrollHeight, clientHeight, scrollTop } = messagesContainer;
    const maxScroll = scrollHeight - clientHeight;
    const isNearBottom = maxScroll - scrollTop < 100;
    
    if (isNearBottom) {
      scrollToBottom();
    }
  }, [messages]);

  // Mark messages as read when chat is opened
  useEffect(() => {
    if (isOpen && session?.id) {
      const markRead = async (sessionId: string) => {
        try {
          await markMessagesAsRead(sessionId);
        } catch (error) {
          console.error('Error marking messages as read:', error);
        }
      };

      markRead(session.id);
      
      // Set up interval to periodically mark messages as read
      const interval = setInterval(() => markRead(session.id), 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen, session?.id]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isLoading || !session?.id) return;
    
    if (!auth.currentUser) {
      setError('Please sign in to send messages');
      return;
    }

    // Check rate limiting
    const now = Date.now();
    if (now - lastMessageTime < 500) {
      setError('Please wait before sending another message');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await sendMessage(session.id, trimmedMessage);
      setLastMessageTime(now);
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!auth.currentUser) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col items-end" id="chat-widget">
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => {
            if (isClosing) return;
            setIsOpen(true);
            setIsMinimized(false);
            setError(null);
            setChatState('connecting');
            initAttempts.current = 0;
          }}
          className="group flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 hover:from-indigo-600 hover:via-purple-600 hover:to-indigo-600 text-white rounded-full shadow-lg transition-all duration-300 relative"
        >
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-white/20"></div>
            <Bot className="w-5 h-5 relative z-10 group-hover:scale-110 transition-transform" />
          </div>
          <span className="font-medium">Chat Support</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`bg-gray-900 border border-gray-800 rounded-lg shadow-2xl transition-all duration-300 ${
            isMinimized ? 'h-14' : 'h-[500px] max-h-[calc(100vh-6rem)]'
          } w-[380px] max-w-[calc(100vw-2rem)] flex flex-col`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-r from-indigo-500/20 to-purple-500/20">
                <Bot className="w-5 h-5 text-indigo-400" />
              </div>
              <span className="font-medium text-white">Chat Support</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 hover:bg-gray-800 rounded-lg transition-colors group"
              >
                <Minus className="w-4 h-4 text-gray-400 group-hover:text-gray-300 transition-colors" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-800 rounded-lg transition-colors group"
                disabled={isClosing}
                onMouseDown={(e) => e.preventDefault()} 
              >
                <X className="w-4 h-4 text-gray-400 group-hover:text-gray-300 transition-colors" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600">
                {error && (
                  <div className="bg-red-500/10 text-red-400 p-3 rounded-lg text-sm flex items-center gap-2">
                    {chatState === 'error' && (
                      <button 
                      onClick={() => {
                        setError(null);
                        initAttempts.current = 0;
                        setChatState('connecting');
                      }}
                      className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded text-sm transition-colors"
                    >
                      Retry
                      </button>
                    )}
                    {chatState === 'connecting' && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    {chatState === 'error' && <AlertCircle className="w-4 h-4 mr-2" />}
                    {error}
                  </div>
                )}
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        msg.sender === 'user'
                          ? 'bg-indigo-500 text-white'
                          : msg.sender === 'system'
                          ? 'bg-gray-700 text-white'
                          : 'bg-gray-800 text-white'
                      }`}
                    >
                      <p className="text-sm">{msg.text}</p>
                      <span className="text-xs opacity-75 mt-1 flex items-center gap-1">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                        {msg.sender === 'user' && (
                          <span className={`w-2 h-2 rounded-full ${
                            msg.status === 'sent' ? 'bg-gray-400' : // Single check
                            msg.status === 'delivered' ? 'bg-blue-400' : // Double check
                            msg.status === 'read' ? 'bg-green-400' : // Double check with color
                            'bg-gray-400'
                          }`} />
                        )}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSubmit} className="p-4 border-t border-gray-800 bg-gray-900">
                <div className="flex gap-2">
                  <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                    placeholder="Type a message..."
                    className="flex-1 bg-gray-800 text-white placeholder-gray-400 rounded-lg px-3 py-2 resize-none max-h-32 min-h-[38px]"
                    rows={1}
                  />
                  <button
                    type="submit"
                    disabled={!message.trim() || isLoading || chatState !== 'connected'}
                    className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}