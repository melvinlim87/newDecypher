import React, { useEffect, useState, useRef, useMemo } from 'react';
import { auth, database, deleteAnalysis } from '../lib/firebase';
import { ref, onValue, update } from 'firebase/database';
import { Brain, Clock, ChevronDown, ChevronUp, Copy, Pencil, Trash2, X, Check, Calendar, Loader2, AlertCircle, BarChart2 } from 'lucide-react';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import { Button } from '../components/Button';
import { createPortal } from 'react-dom';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { formatTimeframe } from '../utils/formatters';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

interface HistoryItem {
  id: string;
  type: 'market-analysis' | 'chat-conversation';  // Add 'chat-conversation' here
  title: string;
  content?: string;
  timestamp: string;
  model?: string;
  timeframe?: string;
  chartUrls?: string[];  
  analysis?: string;
  messages?: Array<{role: string; content: string; image?: string}>;     
}

const DateRangePicker = ({ 
  startDate, 
  endDate, 
  onDatesChange, 
  onClose 
}: { 
  startDate: Date | null;
  endDate: Date | null;
  onDatesChange: (start: Date | null, end: Date | null) => void;
  onClose: () => void;
}) => {
  const [localStartDate, setLocalStartDate] = useState<Date | null>(startDate);
  const [localEndDate, setLocalEndDate] = useState<Date | null>(endDate);

  const handleDateChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    setLocalStartDate(start);
    setLocalEndDate(end);
  };

  const handleApply = () => {
    onDatesChange(localStartDate, localEndDate);
    onClose();
  };

  const handleClear = () => {
    setLocalStartDate(null);
    setLocalEndDate(null);
    onDatesChange(null, null);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose}></div>
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 p-4 rounded-lg shadow-lg z-50 w-80">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-white">Filter by Date</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <DatePicker
              selected={localStartDate}
              onChange={handleDateChange}
              startDate={localStartDate}
              endDate={localEndDate}
              selectsRange
              inline
              className="bg-gray-700 text-white border border-gray-600 rounded p-2 w-full"
            />
          </div>
          <div className="flex justify-between">
            <Button 
              variant="secondary" 
              onClick={handleClear}
            >
              Clear
            </Button>
            <Button 
              variant="primary" 
              onClick={handleApply}
              disabled={!localStartDate || !localEndDate}
            >
              Apply
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export function AnalysisHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteItem, setDeleteItem] = useState<HistoryItem | null>(null);
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const navigate = useNavigate();
  const { theme } = useTheme();

  useEffect(() => {
    if (!auth.currentUser) {
      console.log('No authenticated user');
      return;
    }

    console.log('Setting up Firebase listener for user:', auth.currentUser.uid);
    const userHistoryRef = ref(database, `users/${auth.currentUser.uid}/history`);
    
    const unsubscribe = onValue(userHistoryRef, (snapshot) => {
      try {
        setLoading(true);
        const data = snapshot.val();
        console.log('Received Firebase data:', data);
        
        if (!data) {
          console.log('No history data found');
          setHistory([]);
          setLoading(false);
          return;
        }
        
        const historyItems = Object.entries(data)
          .map(([id, item]: [string, any]) => ({
            id,
            ...item,
          }))
          .filter(item => item.type === 'market-analysis' || item.type === 'chat-conversation')
          .sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
        
        console.log('Processed history items:', historyItems);
        setHistory(historyItems);
      } catch (error) {
        console.error('Error fetching history:', error);
        setError('Failed to load history. Please try again.');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Apply date filter
  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      const itemDate = new Date(item.timestamp);
      
      if (startDate && itemDate < startDate) {
        return false;
      }
      
      if (endDate && itemDate > endDate) {
        return false;
      }
      
      return true;
    });
  }, [history, startDate, endDate]);

  const handleDelete = (item: HistoryItem) => {
    setDeleteItem(item);
  };

  const confirmDelete = async () => {
    if (!deleteItem || !auth.currentUser) return;
    
    try {
      await deleteAnalysis(auth.currentUser.uid, deleteItem.id);
      setDeleteItem(null);
    } catch (error) {
      console.error('Error deleting item:', error);
      setError('Failed to delete item. Please try again.');
    }
  };

  const handleClearAll = () => {
    setShowClearConfirmation(true);
  };

  const confirmClearAll = async () => {
    if (!auth.currentUser) return;
    
    try {
      const updates: Record<string, null> = {};
      
      history.forEach(item => {
        updates[`users/${auth.currentUser!.uid}/history/${item.id}`] = null;
      });
      
      await update(ref(database), updates);
      setShowClearConfirmation(false);
    } catch (error) {
      console.error('Error clearing history:', error);
      setError('Failed to clear history. Please try again.');
    }
  };

  const handleDateFilterClick = () => {
    setShowDatePicker(true);
  };

  const handleDatesChange = (start: Date | null, end: Date | null) => {
    if (start) {
      const startOfDay = new Date(start);
      startOfDay.setHours(0, 0, 0, 0);
      setStartDate(startOfDay);
    } else {
      setStartDate(null);
    }

    if (end) {
      const endOfDay = new Date(end);
      endOfDay.setHours(23, 59, 59, 999);
      setEndDate(endOfDay);
    } else {
      setEndDate(null);
    }
  };

  const toggleExpand = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleEdit = async (item: HistoryItem) => {
    if (!auth.currentUser) return;
    
    try {
      console.log('Starting edit for item:', item.id);
      setEditingItem(item.id);
      setEditTitle(item.title || 'Market Analysis');
      setError(null);
      
      // Focus the input after a short delay to ensure the input is rendered
      setTimeout(() => {
        if (editInputRef.current) {
          editInputRef.current.focus();
          editInputRef.current.select();
        }
      }, 50);
    } catch (error) {
      console.error('Error setting edit mode:', error);
      setError('Failed to enter edit mode');
    }
  };

  const handleSaveEdit = async (itemId: string) => {
    if (!auth.currentUser || !editTitle.trim()) return;
    
    try {
      await update(ref(database, `users/${auth.currentUser.uid}/history/${itemId}`), {
        title: editTitle.trim()
      });
      
      setEditingItem(null);
    } catch (error) {
      console.error('Error updating title:', error);
      setError('Failed to update title. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, itemId: string) => {
    if (e.key === 'Enter') {
      handleSaveEdit(itemId);
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleItemClick = (item: HistoryItem) => {
    // First, check if the content is already in JSON format (messages array)
    let messagesData = item.messages;
    
    // If no messages property but we have content, try to parse it
    if ((!messagesData || messagesData.length === 0) && item.content) {
      try {
        const parsedContent = JSON.parse(item.content);
        if (Array.isArray(parsedContent) && parsedContent.length > 0) {
          messagesData = parsedContent;
        }
      } catch (e) {
        // If parsing fails, content is not in JSON format
        console.log('Content is not in JSON format:', e);
      }
    }
    
    // Route based on the item type
    if (item.type === 'market-analysis' || item.type === 'chat-conversation') {
      // Navigate to the AI chat page for market analysis or chat
      navigate('/ai-chat', { 
        state: { 
          analysisId: item.id,
          content: item.content,
          messages: messagesData,
          timeframe: item.timeframe || null,
          chartUrls: item.chartUrls || [],
          analysisData: item.analysisData || null,
          model: item.model || 'anthropic/claude-3-opus:beta' // Include the model information
        } 
      });
    } else {
      // For any other type (like EA generator items), go to EA generator page
      console.log('DEBUG - EA Generator item in AnalysisHistory:', item);
      console.log('DEBUG - Model being passed from AnalysisHistory:', item.model || 'anthropic/claude-3-opus:beta');
      
      const navigationState = {
        historyId: item.id,
        content: item.content,
        messages: messagesData,
        model: item.model || 'anthropic/claude-3-opus:beta' // Include the model information
      };
      
      console.log('DEBUG - Full navigation state from AnalysisHistory:', navigationState);
      
      navigate('/ea-generator', { state: navigationState });
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-black'} p-6 md:p-12 lg:p-24`}
         style={{
           background: `
             linear-gradient(135deg, rgba(226, 232, 240, 0.01) 0%, rgba(203, 213, 225, 0.005) 100%),
             radial-gradient(circle at 50% 0%, rgba(226, 232, 240, 0.01) 0%, transparent 75%),
             radial-gradient(circle at 0% 50%, rgba(203, 213, 225, 0.005) 0%, transparent 50%),
             radial-gradient(circle at 100% 50%, rgba(203, 213, 225, 0.005) 0%, transparent 50%),
             linear-gradient(to bottom,
               rgba(24, 24, 27, 0.98) 0%,
               rgba(39, 39, 42, 0.95) 50%,
               rgba(24, 24, 27, 0.98) 100%
             )
           `,
           minHeight: '100vh'
         }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center app-text">
            <BarChart2 className="mr-2 app-icon" /> Analysis History
          </h1>
          <div className="flex items-center space-x-2">
            {filteredHistory.length > 0 && (
              <>
                <Button
                  variant="outline"
                  onClick={handleDateFilterClick}
                  className="flex items-center"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  {startDate && endDate ? (
                    <span>
                      {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                    </span>
                  ) : (
                    <span>Filter by Date</span>
                  )}
                </Button>
                <Button
                  variant="danger"
                  onClick={handleClearAll}
                  className="flex items-center bg-red-500/20 border border-red-500/30 text-red-400"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredHistory.length === 0 && (
          <div className={`rounded-lg p-8 text-center ${
            theme === 'dark' 
              ? 'bg-gray-800/50 border border-gray-700' 
              : 'bg-white border border-gray-200'
          }`}
          style={theme === 'light' ? {
            background: 'rgba(10, 94, 112, 0.4)',
            border: '1px solid rgba(0, 229, 255, 0.3)',
            boxShadow: '0 0 30px rgba(0, 229, 255, 0.2)',
            backdropFilter: 'blur(5px)'
          } : {}}>
            <Brain className={`w-12 h-12 mx-auto mb-4 ${theme === 'dark' ? 'text-cyan-600' : 'text-cyan-400'}`} 
                  style={theme === 'light' ? {filter: 'drop-shadow(0 0 8px rgba(0, 229, 255, 0.5))'} : {}} />
            <h3 className={`text-xl font-medium mb-2 ${theme === 'dark' ? 'text-cyan-400' : 'text-cyan-300'}`}
                style={theme === 'light' ? {textShadow: '0 0 5px rgba(0, 229, 255, 0.5)'} : {}}>
              No Analysis History Found
            </h3>
            <p className={`mb-4 ${theme === 'dark' ? 'text-cyan-500' : 'text-cyan-500'}`}>
              {startDate || endDate
                ? "No analyses match your date filter. Try adjusting your filter criteria."
                : "You haven't created any market analyses yet. Start by analyzing a chart!"}
            </p>
            {(startDate || endDate) && (
              <Button
                variant="outline"
                onClick={() => handleDatesChange(null, null)}
                className="mx-auto"
              >
                Clear Filters
              </Button>
            )}
            {!startDate && !endDate && (
              <Button
                variant="primary"
                onClick={() => navigate('/ai-chat')}
                className="mx-auto"
              >
                Start New Analysis
              </Button>
            )}
          </div>
        )}

        {/* History List */}
        {!loading && !error && filteredHistory.length > 0 && (
          <div className="space-y-4">
            {filteredHistory.map((item) => (
              <div
                key={item.id}
                className={`rounded-lg overflow-hidden transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-800/70 border border-cyan-800/50 hover:border-cyan-500/50'
                    : 'bg-white border border-gray-200 hover:border-blue-500/50 shadow-sm'
                }`}
                style={theme === 'light' ? {
                  background: 'rgba(10, 94, 112, 0.4)',
                  border: '1px solid rgba(0, 229, 255, 0.3)',
                  boxShadow: '0 0 15px rgba(0, 229, 255, 0.2)',
                  backdropFilter: 'blur(5px)'
                } : {}}
              >
                <div 
                  className="p-4 cursor-pointer"
                  onClick={() => handleItemClick(item)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      {editingItem === item.id ? (
                        <div className="flex items-center space-x-2">
                          <input
                            ref={editInputRef}
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, item.id)}
                            className={`rounded px-2 py-1 w-full ${
                              theme === 'dark'
                                ? 'bg-gray-700 border border-gray-600 text-white'
                                : 'bg-gray-100 border border-gray-300 text-gray-900'
                            }`}
                            style={theme === 'light' ? {
                              background: 'rgba(10, 94, 112, 0.4)',
                              border: '1px solid rgba(0, 229, 255, 0.3)',
                              boxShadow: 'inset 0 0 10px rgba(0, 229, 255, 0.1)',
                              color: '#e0ffff',
                              caretColor: '#00e5ff',
                            } : {}}
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveEdit(item.id);
                            }}
                            className="text-green-500 hover:text-green-400"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelEdit();
                            }}
                            className="text-red-500 hover:text-red-400"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <h3 className={`text-lg font-medium truncate ${theme === 'dark' ? 'text-cyan-300' : 'text-cyan-300'}`}
                              style={theme === 'light' ? {textShadow: '0 0 5px rgba(0, 229, 255, 0.5)'} : {}}>
                            {item.title || 'Market Analysis'}
                          </h3>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(item);
                            }}
                            className={`ml-2 text-gray-400 hover:${theme === 'dark' ? 'text-cyan-400' : 'text-cyan-400'}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      <div className={`flex items-center mt-1 text-sm ${
                        theme === 'dark' ? 'text-cyan-500' : 'text-cyan-500'
                      }`}>
                        <Clock className="w-4 h-4 mr-1" />
                        {new Date(item.timestamp).toLocaleString()}
                        {item.timeframe && (
                          <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                            theme === 'dark'
                              ? 'bg-cyan-900/50 text-cyan-300'
                              : 'bg-gray-700 text-white' // Changed from bg-blue-100 text-blue-700
                          }`}
                          style={theme === 'light' ? {
                            background: 'rgba(0, 229, 255, 0.15)',
                            boxShadow: '0 0 5px rgba(0, 229, 255, 0.3)',
                            textShadow: '0 0 2px rgba(0, 229, 255, 0.5)'
                          } : {}}>
                            {formatTimeframe(item.timeframe)}
                          </span>
                        )}
                        {item.model && (
                          <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                            theme === 'dark' 
                              ? 'bg-gray-700 text-gray-300' 
                              : 'bg-gray-200 text-gray-700'
                          }`}
                          style={theme === 'light' ? {
                            background: 'rgba(0, 229, 255, 0.1)',
                            border: '1px solid rgba(0, 229, 255, 0.2)',
                            boxShadow: '0 0 5px rgba(0, 229, 255, 0.2)'
                          } : {}}>
                            {item.model}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(item);
                          }}
                          className={`text-gray-400 hover:${theme === 'dark' ? 'text-red-500' : 'text-red-600'}`}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(item.id, e);
                          }}
                          className={`text-gray-400 hover:${theme === 'dark' ? 'text-cyan-400' : 'text-cyan-400'}`}
                        >
                          {expandedItems.has(item.id) ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {expandedItems.has(item.id) && (
                  <div className={`border-t p-4 ${
                    theme === 'dark' 
                      ? 'border-cyan-800/30 bg-gray-800/50' 
                      : 'bg-gray-50'
                  }`}
                  style={theme === 'light' ? {
                    background: 'rgba(10, 25, 47, 0.5)',
                    borderTop: '1px solid rgba(0, 229, 255, 0.2)',
                    boxShadow: 'inset 0 5px 10px rgba(0, 0, 0, 0.1)'
                  } : {}}>
                    <div className={`prose prose-sm max-w-none ${
                      theme === 'dark' ? 'prose-invert' : ''
                    }`}>
                      <div className={`p-4 rounded text-sm max-h-[400px] overflow-y-auto whitespace-pre-wrap ${
                        theme === 'dark' 
                          ? 'bg-gray-700/50 text-cyan-300' 
                          : 'bg-white text-gray-800 border border-gray-200'
                      }`}
                      style={theme === 'light' ? {
                        background: 'rgba(10, 25, 47, 0.7)',
                        border: '1px solid rgba(0, 229, 255, 0.2)',
                        color: '#e0ffff',
                        boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.2)'
                      } : {}}>
                        {/* Format the analysis content with better readability */}
                        {item.content && (
                          <div className="space-y-3">
                            {item.content.split('---').map((section, index) => {
                              // Skip empty sections
                              if (!section.trim()) return null;
                              
                              return (
                                <div key={index} className="pb-2">
                                  {/* Apply styling to section headers */}
                                  {section.includes('**') ? (
                                    <div>
                                      {section.split('\n').map((line, lineIndex) => {
                                        // Style headers and important information
                                        if (line.includes('**')) {
                                          return (
                                            <div key={lineIndex} className={`font-medium mb-1 ${
                                              theme === 'dark' ? 'text-cyan-300' : 'text-cyan-300'
                                            }`}
                                            style={theme === 'light' ? {textShadow: '0 0 5px rgba(0, 229, 255, 0.5)'} : {}}>
                                              {line.replace(/\*\*/g, '')}
                                            </div>
                                          );
                                        }
                                        
                                        // Style bullet points
                                        if (line.trim().startsWith('•')) {
                                          return (
                                            <div key={lineIndex} className="ml-4 mb-1 flex">
                                              <span className={`mr-2 ${
                                                theme === 'dark' ? 'text-cyan-400' : 'text-cyan-400'
                                              }`}>•</span>
                                              <span>{line.trim().substring(1)}</span>
                                            </div>
                                          );
                                        }
                                        
                                        // Regular lines
                                        return (
                                          <div key={lineIndex} className="mb-1">
                                            {line}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <div>{section}</div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) || item.analysis || 'No content available'}
                      </div>
                      
                      {/* Display chat messages preview for any item type that has messages */}
                      {item.messages && item.messages.length > 0 && (
                        <div className="mt-4">
                          <h4 className={`text-sm font-medium mb-2 ${
                            theme === 'dark' ? 'text-cyan-300' : 'text-cyan-300'
                          }`}
                          style={theme === 'light' ? {textShadow: '0 0 5px rgba(0, 229, 255, 0.5)'} : {}}>
                            Chat Messages:
                          </h4>
                          <div className={`rounded-lg border overflow-hidden ${
                            theme === 'dark' 
                              ? 'bg-gray-800/70 border-cyan-800/50' 
                              : 'bg-white border-gray-200'
                          }`}
                          style={theme === 'light' ? {
                            background: 'rgba(10, 94, 112, 0.4)',
                            border: '1px solid rgba(0, 229, 255, 0.3)',
                            boxShadow: '0 0 15px rgba(0, 229, 255, 0.2)',
                            backdropFilter: 'blur(5px)'
                          } : {}}>
                            <div className="max-h-[300px] overflow-y-auto">
                              {item.messages.map((message, index) => (
                                <div 
                                  key={index} 
                                  className={`p-3 border-b ${
                                    theme === 'dark'
                                      ? 'border-cyan-800/30 last:border-0'
                                      : 'border-gray-200 last:border-0'
                                  } ${
                                    message.role === 'assistant'
                                      ? theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'
                                      : ''
                                  }`}
                                  style={theme === 'light' && message.role === 'assistant' ? {
                                    background: 'rgba(10, 25, 47, 0.5)',
                                    borderBottom: '1px solid rgba(0, 229, 255, 0.2)'
                                  } : {}}
                                >
                                  <div className={`text-xs font-medium mb-1 ${
                                    message.role === 'assistant'
                                      ? theme === 'dark' ? 'text-cyan-300' : 'text-cyan-300'
                                      : theme === 'dark' ? 'text-cyan-400' : 'text-cyan-400'
                                  }`}
                                  style={theme === 'light' ? {textShadow: '0 0 3px rgba(0, 229, 255, 0.3)'} : {}}>
                                    {message.role === 'assistant' ? 'AI' : 'You'}
                                  </div>
                                  <div className={`text-sm ${
                                    theme === 'dark' ? 'text-cyan-100' : 'text-cyan-100'
                                  }`}
                                  style={theme === 'light' ? {color: '#e0ffff'} : {}}>
                                    {message.content}
                                  </div>
                                  {message.image && (
                                    <div className="mt-2">
                                      <img 
                                        src={message.image} 
                                        alt="Chat image" 
                                        className={`max-w-[200px] rounded border ${
                                          theme === 'dark' ? 'border-cyan-800/50' : 'border-cyan-300/30'
                                        }`}
                                        style={theme === 'light' ? {
                                          boxShadow: '0 0 10px rgba(0, 229, 255, 0.3)'
                                        } : {}}
                                        loading="lazy"
                                      />
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {item.chartUrls && item.chartUrls.length > 0 && (
                        <div className="mt-4">
                          <h4 className={`text-sm font-medium mb-2 ${
                            theme === 'dark' ? 'text-cyan-300' : 'text-cyan-300'
                          }`}
                          style={theme === 'light' ? {textShadow: '0 0 5px rgba(0, 229, 255, 0.5)'} : {}}>
                            Chart Images:
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {item.chartUrls.map((url, index) => (
                              <img
                                key={index}
                                src={url}
                                alt={`Chart ${index + 1}`}
                                className={`rounded border max-h-40 object-contain ${
                                  theme === 'dark' 
                                    ? 'border-cyan-800/50 bg-black/70' 
                                    : 'border-cyan-300/30 bg-white'
                                }`}
                                style={theme === 'light' ? {
                                  boxShadow: '0 0 15px rgba(0, 229, 255, 0.3)'
                                } : {}}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-4 flex justify-end">
                        <Button
                          variant="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleItemClick(item);
                          }}
                          className="flex items-center"
                          style={theme === 'light' ? {
                            background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.2), rgba(0, 229, 255, 0.4))',
                            border: '1px solid rgba(0, 229, 255, 0.5)',
                            boxShadow: '0 0 15px rgba(0, 229, 255, 0.3)',
                            color: '#00e5ff',
                            textShadow: '0 0 5px rgba(0, 229, 255, 0.5)',
                            fontWeight: 'bold'
                          } : {}}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Load Analysis
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteItem && (
        <DeleteConfirmationModal
          isOpen={true}
          onClose={() => setDeleteItem(null)}
          onConfirm={confirmDelete}
          title="Delete Analysis"
          message={`Are you sure you want to delete "${deleteItem.title || 'this analysis'}"? This action cannot be undone.`}
        />
      )}

      {/* Clear All Confirmation Modal */}
      {showClearConfirmation && (
        <DeleteConfirmationModal
          isOpen={true}
          onClose={() => setShowClearConfirmation(false)}
          onConfirm={confirmClearAll}
          title="Clear All History"
          message="Are you sure you want to delete all your analysis history? This action cannot be undone."
        />
      )}

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onDatesChange={handleDatesChange}
          onClose={() => setShowDatePicker(false)}
        />
      )}
    </div>
  );
}
