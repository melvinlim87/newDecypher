// This file contains the fix for the database reference error in AIAnalysisChat.tsx

// 1. Make sure the database is properly imported at the top of AIAnalysisChat.tsx:
import { database } from '../lib/firebase';

// 2. Update the handleSendMessage function to use the imported database variable:
const handleSendMessage = async () => {
  if (!inputMessage.trim()) return;
  
  const userMessage = inputMessage.trim();
  setInputMessage('');
  
  // Add user message to chat
  setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
  
  // Start loading state
  setIsLoading(true);
  
  try {
    // Add assistant typing indicator
    setMessages(prev => [...prev, { role: 'assistant', content: '', isTyping: true }]);
    
    // Send message to API - filter out any analysis messages to avoid confusion
    const messagesToSend = messages
      .filter(msg => msg.content !== analysis)
      .concat([{ role: 'user', content: userMessage }]);
    
    const response = await sendChatMessage(
      messagesToSend,
      selectedModel,
      analysis,
      analysisType
    );
    
    // Update chat history
    setChatHistory(prev => [...prev, userMessage, response]);
    
    // Remove typing indicator and add actual response
    const updatedMessages = [
      ...messages.filter(msg => !msg.isTyping),
      { role: 'user', content: userMessage },
      { role: 'assistant', content: response }
    ];
    
    setMessages(updatedMessages);
    
    // Save the updated chat history if a user is logged in
    if (auth.currentUser) {
      try {
        console.log('Preparing to save chat messages to Firebase:', {
          messageCount: updatedMessages.length,
          hasAnalysis: !!analysis,
          hasAnalysisId: !!location.state?.analysisId
        });
        
        // Ensure messages are properly formatted for Firebase
        const cleanMessages = updatedMessages.map(msg => ({
          role: msg.role,
          content: msg.content,
          ...(msg.isTyping ? { isTyping: msg.isTyping } : {})
        }));
        
        // Import Firebase functions inside the try block to ensure they're available
        const { ref, update, push, set } = await import('firebase/database');
        
        // Case 1: If we have an existing analysis ID, update it
        if (location.state?.analysisId) {
          console.log('Updating existing chat history:', {
            analysisId: location.state.analysisId,
            messageCount: cleanMessages.length
          });
          
          // Use the imported database variable from firebase.ts
          const historyRef = ref(database, `users/${auth.currentUser.uid}/history/${location.state.analysisId}`);
          
          await update(historyRef, {
            messages: cleanMessages,
            lastUpdated: Date.now()
          });
          
          console.log('Existing chat history updated successfully');
        } 
        // Case 2: If we have analysis but no analysisId, create a new analysis record
        else if (analysis) {
          console.log('Creating new analysis with chat history:', {
            messageCount: cleanMessages.length,
            chartCount: chartPreviews.length
          });
          
          // Create a new analysis entry
          const newAnalysisRef = push(ref(database, `users/${auth.currentUser.uid}/history`));
          
          await set(newAnalysisRef, {
            type: 'market-analysis',
            title: timeframe ? `Market Analysis - ${timeframe}` : 'Market Analysis',
            content: analysis,
            chartUrls: chartPreviews.length > 0 ? chartPreviews : [],
            messages: cleanMessages,
            timestamp: Date.now(),
            id: newAnalysisRef.key
          });
          
          // Update location state with the new analysisId for future updates
          if (newAnalysisRef.key) {
            navigate(location.pathname, { 
              state: { ...location.state, analysisId: newAnalysisRef.key },
              replace: true
            });
            console.log('New analysis created with ID:', newAnalysisRef.key);
          }
        }
        // Case 3: No analysis yet, but we still want to save the conversation
        else if (cleanMessages.length > 1) {
          console.log('Saving chat conversation without analysis');
          
          // Create a new conversation entry
          const newConversationRef = push(ref(database, `users/${auth.currentUser.uid}/history`));
          
          await set(newConversationRef, {
            type: 'chat-conversation',
            title: `Chat - ${new Date().toLocaleDateString()}`,
            content: cleanMessages[cleanMessages.length - 1].content,
            messages: cleanMessages,
            timestamp: Date.now(),
            id: newConversationRef.key
          });
          
          // Update location state with the new conversationId for future updates
          if (newConversationRef.key) {
            navigate(location.pathname, { 
              state: { ...location.state, analysisId: newConversationRef.key },
              replace: true
            });
            console.log('New conversation created with ID:', newConversationRef.key);
          }
        }
      } catch (error) {
        console.error('Error saving chat history:', error);
      }
    }
  } catch (err) {
    console.error('Error sending message:', err);
    // Remove typing indicator and add error message
    setMessages(prev => [
      ...prev.filter(msg => !msg.isTyping),
      { role: 'assistant', content: 'Sorry, there was an error processing your message. Please try again.' }
    ]);
  } finally {
    setIsLoading(false);
  }
};
