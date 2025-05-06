import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, database } from '../lib/firebase';
import { ref, onValue, query, limitToLast, orderByChild } from 'firebase/database';
import { ChevronDown, ChevronRight, Circle } from 'lucide-react';
import { LoadHistoryModal } from './LoadHistoryModal';
import { useAnalysisContext } from '../context/AnalysisContext';
import { useTheme } from '../contexts/ThemeContext';

interface HistoryItem {
  id: string;
  type: 'market-analysis' | 'ea-generator' | 'chat-conversation';
  title: string;
  content: string;
  timestamp: string;
  timeframe?: string;
  chartUrls?: string[];
  messages?: any[]; // Changed from string[] to any[] to support message objects
  model?: string; // Added model property
}

interface HistoryListProps {
  isCollapsed: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  historyType: 'market-analysis' | 'ea-generator' | 'chat-conversation';
  label: string;
  compact?: boolean;
}

export function HistoryList({ isCollapsed, isExpanded, onToggle, historyType, label, compact = false }: HistoryListProps) {
  const [recentHistory, setRecentHistory] = useState<HistoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { setAnalysis, setTimeframe, setChartPreviews, setInitialMessage } = useAnalysisContext();

  useEffect(() => {
    if (!auth.currentUser || !isExpanded) return;

    const userHistoryRef = query(
      ref(database, `users/${auth.currentUser.uid}/history`),
      orderByChild('timestamp'),
      limitToLast(10)
    );

    const unsubscribe = onValue(userHistoryRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const historyItems = Object.entries(data)
          .map(([id, item]: [string, any]) => ({
            id,
            ...item,
          }))
          .filter(item => {
            // For market-analysis, also include chat-conversation items
            if (historyType === 'market-analysis') {
              return item.type === 'market-analysis' || item.type === 'chat-conversation';
            }
            // For other types, filter as normal
            return item.type === historyType;
          })
          .sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
        setRecentHistory(historyItems.slice(0, 5)); // Only show 5 most recent items
      } else {
        setRecentHistory([]);
      }
    });

    return () => unsubscribe();
  }, [isExpanded, historyType]);

  const handleItemClick = (item: HistoryItem) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleConfirm = () => {
    if (selectedItem) {
      // First, check if the content is already in JSON format (messages array)
      let messagesData = selectedItem.messages;
      
      // If no messages property but we have content, try to parse it
      if ((!messagesData || messagesData.length === 0) && selectedItem.content) {
        try {
          const parsedContent = JSON.parse(selectedItem.content);
          if (Array.isArray(parsedContent) && parsedContent.length > 0) {
            messagesData = parsedContent;
          }
        } catch (e) {
          // If parsing fails, content is not in JSON format
          console.log('Content is not in JSON format:', e);
        }
      }

      // Add a confirmation message to the messages array
      if (messagesData && Array.isArray(messagesData)) {
        // Add a system message confirming history was loaded
        messagesData.push({
          role: 'assistant',
          content: selectedItem.type === 'market-analysis' 
            ? 'Analysis history successfully loaded! 🔄' 
            : 'Chat conversation loaded! 💬'
        });
      }

      if (selectedItem.type === 'market-analysis') {
        // Load the history content into the analysis context
        setAnalysis(selectedItem.content);
        setTimeframe(selectedItem.timeframe || null);
        setChartPreviews(selectedItem.chartUrls || []);
        setInitialMessage("Analysis history successfully loaded! 🔄");
        
        // Navigate to the chat page with all necessary data
        navigate('/ai-chat', { 
          state: { 
            analysisId: selectedItem.id,
            content: selectedItem.content,
            messages: messagesData,
            timeframe: selectedItem.timeframe || null,
            chartUrls: selectedItem.chartUrls || [],
            model: selectedItem.model || 'anthropic/claude-3-opus:beta', // Include the model information
            loadTime: new Date().getTime() // Add timestamp to force state update
          } 
        });
      } else if (selectedItem.type === 'chat-conversation') {
        // For chat conversations, navigate to the chat page with all necessary data
        setInitialMessage("Chat conversation loaded! 💬");
        
        navigate('/ai-chat', { 
          state: { 
            analysisId: selectedItem.id,
            content: selectedItem.content,
            messages: messagesData,
            timeframe: selectedItem.timeframe || null,
            chartUrls: selectedItem.chartUrls || [],
            model: selectedItem.model || 'anthropic/claude-3-opus:beta', // Include the model information
            loadTime: new Date().getTime() // Add timestamp to force state update
          } 
        });
      } else if (selectedItem.type === 'ea-generator') {
        // Debug logging for EA generator navigation
        console.log('DEBUG - EA Generator history item:', selectedItem);
        console.log('DEBUG - Model being passed:', selectedItem.model || 'anthropic/claude-3-opus:beta');
        
        // Navigate to the EA generator page with the history ID
        const navigationState = { 
          historyId: selectedItem.id,
          content: selectedItem.content,
          messages: messagesData,
          model: selectedItem.model || 'anthropic/claude-3-opus:beta' // Include the model information
        };
        
        console.log('DEBUG - Full navigation state:', navigationState);
        
        navigate('/ea-generator', { state: navigationState });
      }
      
      setShowModal(false);
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setSelectedItem(null);
  };

  if (isCollapsed) return null;

  if (recentHistory.length === 0) {
    return (
      <div className={`text-sm text-white italic px-4 py-2`}
           style={theme === 'light' ? {textShadow: '0 0 3px rgba(0, 229, 255, 0.3)'} : {}}>
        No {label.toLowerCase()} yet
      </div>
    );
  }

  return (
    <>
      {!compact && (
        <button 
          onClick={onToggle} 
          className="flex items-center justify-between w-full px-4 py-2 rounded-lg hover:bg-gray-800/30 transition-colors cursor-pointer"
        > 
          <div className="flex items-center"> 
            {isExpanded ? ( 
              <ChevronDown className="w-4 h-4 mr-2 text-white" /> 
            ) : ( 
              <ChevronRight className="w-4 h-4 mr-2 text-white" /> 
            )} 
            <span className="text-sm font-medium text-white">{label}</span> 
          </div> 
          <span className="text-xs text-white opacity-80"> 
            {recentHistory.length} 
          </span> 
        </button>
      )}

      {isExpanded && (
        <div className={`${compact ? '' : 'pl-6'} space-y-1`}>
          {recentHistory.map((item) => (
            <div
              key={item.id}
              onClick={() => handleItemClick(item)}
              className="flex items-center px-4 py-2 text-sm cursor-pointer rounded hover:bg-gray-800/30 transition-colors"
            >
              <Circle className="w-2 h-2 mr-2 text-white" />
              <div className="truncate flex-1 text-white">
                {item.title || formatTimestamp(item.timestamp)}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && selectedItem && (
        <LoadHistoryModal
          item={selectedItem}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </>
  );
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}