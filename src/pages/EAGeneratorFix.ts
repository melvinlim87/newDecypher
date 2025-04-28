/**
 * Fix for EA Generator conversation loading issue
 * 
 * This fix patches the issue where EA conversations are loaded from history
 * but not displayed in the UI. The problem occurs because React doesn't 
 * properly detect the state change when navigating with the same message structure.
 */

import { useEffect } from 'react';

/**
 * Hook to force a re-render when EA conversation is loaded from history
 * @param messages The current messages state array
 * @param setMessages Function to update the messages state
 * @param location The current router location object
 */
export function useEAHistoryLoader(
  messages: Array<{role: string; content: string; image?: string}>,
  setMessages: (messages: Array<{role: string; content: string; image?: string}>) => void,
  location: any
) {
  useEffect(() => {
    const { state } = location;
    
    // Only run this effect when loading from history
    if (state?.messages && Array.isArray(state.messages) && state.messages.length > 0) {
      console.log('EA History Loader: Processing loaded messages:', state.messages.length);
      
      // Force React to recognize this as a new state by:
      // 1. First clearing the messages array
      setMessages([]);
      
      // 2. Then after a short delay, setting the actual messages
      const timer = setTimeout(() => {
        // Create a deep copy of the message objects to ensure state change is detected
        const messagesClone = state.messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content || '',
          image: msg.image
        }));
        
        console.log('EA History Loader: Setting messages state with:', messagesClone.length, 'messages');
        setMessages(messagesClone);
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [location, setMessages]);
}
