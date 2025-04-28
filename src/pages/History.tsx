import React, { useEffect, useState, useRef, useMemo } from 'react';
import { auth, database, deleteAnalysis } from '../lib/firebase';
import { ref, onValue, update } from 'firebase/database';
import { Brain, Code2, Clock, ChevronDown, ChevronUp, ChevronRight, Copy, Pencil, Trash2, X, Check, Calendar, Loader2, AlertCircle } from 'lucide-react';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import { Button } from '../components/Button';
import { createPortal } from 'react-dom';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { formatTimeframe } from '../utils/formatters';
import { useNavigate } from 'react-router-dom';

interface HistoryItem {
  id: string;
  type: 'market-analysis' | 'ea-generator';
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
      <div 
        className="fixed inset-0 bg-black/20" 
        style={{ zIndex: 999999 }}
        onClick={onClose}
      />
      <div 
        className="fixed right-4 top-[4.5rem]"
        style={{ zIndex: 1000000 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="glass-effect gradient-border rounded-lg overflow-hidden shadow-2xl">
          <div className="p-3 border-b border-white/10">
            <h3 className="text-white/80 font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Filter by Date
            </h3>
          </div>
          <div className="p-3 bg-white/[0.02]">
            <div className="bg-white/[0.03] rounded-lg p-2">
              <DatePicker
                selected={localStartDate}
                startDate={localStartDate}
                endDate={localEndDate}
                onChange={handleDateChange}
                selectsRange
                inline
                calendarClassName="!bg-transparent"
              />
            </div>
            <div className="flex justify-end gap-2 pt-3 mt-2 border-t border-white/10">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleClear}
              >
                Clear
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleApply}
                disabled={!localStartDate || !localEndDate}
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export function History() {
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
  const [selectedTab, setSelectedTab] = useState<'all' | 'market-analysis' | 'ea-generator'>('all');

  const navigate = useNavigate();

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

        const historyItems = Object.entries(data).map(([key, value]) => {
          console.log('Processing history item:', key, value);
          return {
            id: key,
            type: value.type,
            title: value.title || 'Untitled Analysis',
            content: value.analysis || value.content || 'No content available',
            timestamp: new Date(value.timestamp).toLocaleString(),
            timeframe: value.timeframe,
            chartUrls: value.chartUrls || [],
          };
        });

        // Sort by timestamp, newest first
        historyItems.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        console.log('Processed history items:', historyItems);
        setHistory(historyItems);
      } catch (err) {
        console.error('Error loading history:', err);
        setError('Failed to load history');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleItemClick = (item: HistoryItem) => {
    if (item.type === 'ea-generator') {
      // For EA Generator items, navigate to EA Generator page with history ID
      navigate('/ea-generator', { 
        state: { 
          messages: item.analysis.messages,
          historyId: item.id
        } 
      });
    } else {
      // For market analysis, expand in place
      setExpandedItems(prev => {
        const newSet = new Set(prev);
        if (newSet.has(item.id)) {
          newSet.delete(item.id);
        } else {
          newSet.add(item.id);
        }
        return newSet;
      });
    }
  };

  const renderChartPreviews = (item: HistoryItem) => {
    if (!item.chartUrls || item.chartUrls.length === 0) return null;
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        {item.chartUrls.map((url, index) => (
          <div key={index} className="relative group">
            <img
              src={url}
              alt={`Chart ${index + 1}`}
              className="w-full h-48 object-contain rounded-lg border border-gray-700 bg-black"
              onClick={() => window.open(url, '_blank')}
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100">
              <button
                onClick={() => window.open(url, '_blank')}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                View Full Size
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const handleToggle = (id: string, e: React.MouseEvent) => {
    // Only toggle if clicking the header area, not the buttons
    const target = e.target as HTMLElement;
    if (!target.closest('button')) {
      setSelectedItem(prev => prev === id ? null : id);
    }
  };

  const handleDelete = async (item: HistoryItem) => {
    if (!auth.currentUser) return;
    
    try {
      setLoading(true);
      await deleteAnalysis(auth.currentUser.uid, item.id, item.chartUrls || []);
      setDeleteItem(null);
    } catch (error) {
      console.error('Error deleting item:', error);
      setError('Failed to delete item. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!auth.currentUser || !history.length) return;
    
    try {
      setLoading(true);
      
      // Delete all analyses and their associated chart images
      await Promise.all(history.map(item => 
        deleteAnalysis(auth.currentUser!.uid, item.id, item.chartUrls || [])
      ));
      
      setShowClearConfirmation(false);
    } catch (error) {
      console.error('Error clearing history:', error);
      setError('Failed to clear history. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = useMemo(() => {
    let filtered = [...history];
    
    // Filter by type
    if (selectedTab !== 'all') {
      filtered = filtered.filter(item => {
        return item.type === selectedTab;
      });
    }

    // Filter by date range if set
    if (startDate && endDate) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.timestamp);
        return itemDate >= startDate && itemDate <= endDate;
      });
    }

    return filtered;
  }, [history, selectedTab, startDate, endDate]);

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
      setLoading(true);
      console.log('Saving edit for item:', itemId);
      
      const itemRef = ref(database, `users/${auth.currentUser.uid}/history/${itemId}`);
      await update(itemRef, {
        title: editTitle.trim(),
        updatedAt: new Date().toISOString()
      });
      setEditingItem(null);
      setError(null);
    } catch (error) {
      console.error('Error updating item:', error);
      setError('Failed to update item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Analysis History</h1>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowDatePicker(true)}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Filter by Date
            </Button>
            {history.length > 0 && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowClearConfirmation(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear History
              </Button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-2 mb-6 border-b border-gray-700">
          <button
            className={`px-4 py-2 text-sm font-medium ${
              selectedTab === 'all'
                ? 'text-indigo-400 border-b-2 border-indigo-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
            onClick={() => setSelectedTab('all')}
          >
            All
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${
              selectedTab === 'market-analysis'
                ? 'text-indigo-400 border-b-2 border-indigo-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
            onClick={() => setSelectedTab('market-analysis')}
          >
            Market Analysis
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${
              selectedTab === 'ea-generator'
                ? 'text-indigo-400 border-b-2 border-indigo-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
            onClick={() => setSelectedTab('ea-generator')}
          >
            EA Generator
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
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
        {!loading && !error && history.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-800 rounded-full mb-4">
              <Brain className="w-6 h-6 text-indigo-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No Analysis History</h3>
            <p className="text-gray-400">Start analyzing charts to see your history here.</p>
          </div>
        )}

        {/* History List */}
        {!loading && !error && history.length > 0 && (
          <div className="space-y-4">
            {filteredHistory.map(item => (
              <div 
                key={item.id} 
                className="glass-effect border border-white/[0.08] hover:border-white/20 rounded-xl overflow-hidden transition-all shadow-md"
              >
                <div 
                  className="flex items-center justify-between p-4 cursor-pointer"
                  onClick={(e) => toggleExpand(item.id, e)}
                >
                  <div className="flex items-start flex-grow space-x-4">
                    <div className={`p-2 rounded-lg ${item.type === 'ea-generator' ? 'bg-purple-500/10 text-purple-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                      {item.type === 'ea-generator' ? (
                        <Code2 className="w-5 h-5 text-purple-400" />
                      ) : (
                        <Brain className="w-5 h-5 text-indigo-400" />
                      )}
                    </div>
                    <div>
                      {editingItem === item.id ? (
                        <input
                          ref={editInputRef}
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveEdit(item.id);
                            } else if (e.key === 'Escape') {
                              setEditingItem(null);
                            }
                          }}
                          className="bg-gray-800 text-white px-3 py-1.5 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <h3 className="text-lg font-medium">{item.title}</h3>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                        <Clock className="w-4 h-4" />
                        {item.timestamp}
                        {item.timeframe && (
                          <span className="text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded text-xs">
                            {item.timeframe}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {editingItem === item.id ? (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingItem(null);
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveEdit(item.id);
                          }}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleEdit(item);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                          <span className="ml-2">Edit</span>
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDeleteItem(item);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="ml-2">Delete</span>
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleExpand(item.id, e);
                          }}
                        >
                          {expandedItems.has(item.id) ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                          <span className="ml-2">
                            {expandedItems.has(item.id) ? 'Hide' : 'View'}
                          </span>
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedItems.has(item.id) && (
                  <div className="p-4 border-t border-gray-700/50">
                    {renderChartPreviews(item)}
                    <div className="font-mono text-sm bg-black/30 rounded-lg p-4 whitespace-pre-wrap overflow-x-auto space-y-4">
                      {item.type === 'ea-generator' ? (
                        item.messages && item.messages.length > 0 ? (
                          // Only show the last 4 messages
                          item.messages.slice(-4).map((msg, i) => (
                            <div key={i} className={`p-3 rounded-lg ${msg.role === 'assistant' ? 'bg-gray-800/50' : 'bg-gray-700/50'}`}>
                              <div className="text-xs text-gray-400 mb-1">{msg.role === 'assistant' ? '🤖 AI' : '👤 You'}</div>
                              {msg.content}
                            </div>
                          ))
                        ) : (
                          <div className="text-gray-400">No messages available</div>
                        )
                      ) : (
                        item.content
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Modals */}
        {showDatePicker && createPortal(
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onDatesChange={handleDatesChange}
            onClose={() => setShowDatePicker(false)}
          />,
          document.body
        )}

        {showClearConfirmation && (
          <DeleteConfirmationModal
            isOpen={showClearConfirmation}
            onClose={() => setShowClearConfirmation(false)}
            onConfirm={handleClearHistory}
            title="Clear History"
            message="Are you sure you want to clear all analysis history? This action cannot be undone."
          />
        )}

        {deleteItem && (
          <DeleteConfirmationModal
            isOpen={!!deleteItem}
            onClose={() => setDeleteItem(null)}
            onConfirm={() => handleDelete(deleteItem)}
            title="Delete Analysis"
            message="Are you sure you want to delete this analysis? This action cannot be undone."
          />
        )}
      </div>
    </div>
  );
}