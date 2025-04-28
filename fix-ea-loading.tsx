/**
 * Fix for EA Generator conversation loading issue
 * 
 * Instructions:
 * 1. Replace the useEffect hook that handles state data in EAGenerator.tsx
 * 2. The issue is that React doesn't detect the state change correctly when navigating
 *    from the history page with the same message structure
 */

// ======== PASTE THIS CODE INTO EAGenerator.tsx ========

// First, make sure this is at the top of your imports:
import { useLocation, useNavigate } from 'react-router-dom';

// Then replace the useEffect that handles loading the conversation with this one:

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
