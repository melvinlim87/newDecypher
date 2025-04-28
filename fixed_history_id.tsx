// This file contains the fix for ensuring all messages in a conversation use the same history ID

// 1. First, add a state variable to track the current history ID near the top of your component:
const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(
  location.state?.analysisId || null
);

// 2. Add an effect to initialize the history ID from the URL or sessionStorage when the component mounts:
useEffect(() => {
  // If we have an analysisId in the URL, use that
  if (location.state?.analysisId) {
    setCurrentHistoryId(location.state.analysisId);
    console.log('Using history ID from URL:', location.state.analysisId);
  } 
  // Otherwise check if we have one in sessionStorage
  else {
    const storedId = sessionStorage.getItem('currentChatHistoryId');
    if (storedId) {
      setCurrentHistoryId(storedId);
      console.log('Using history ID from sessionStorage:', storedId);
      
      // Update location state for consistency
      navigate(location.pathname, { 
        state: { ...location.state, analysisId: storedId },
        replace: true
      });
    }
  }
}, []);

// 3. Add an effect to save the current history ID to sessionStorage whenever it changes:
useEffect(() => {
  if (currentHistoryId) {
    sessionStorage.setItem('currentChatHistoryId', currentHistoryId);
    console.log('Saved history ID to sessionStorage:', currentHistoryId);
  }
}, [currentHistoryId]);

// 4. Modify the handleSendMessage function to use currentHistoryId instead of location.state.analysisId:
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
          hasHistoryId: !!currentHistoryId
        });
        
        // Ensure messages are properly formatted for Firebase
        const cleanMessages = updatedMessages.map(msg => ({
          role: msg.role,
          content: msg.content,
          ...(msg.isTyping ? { isTyping: msg.isTyping } : {})
        }));
        
        // Import Firebase functions
        const { ref, update, push, set } = await import('firebase/database');
        
        // Case 1: If we have an existing history ID, update it
        if (currentHistoryId) {
          console.log('Updating existing chat history:', {
            historyId: currentHistoryId,
            messageCount: cleanMessages.length
          });
          
          const historyRef = ref(database, `users/${auth.currentUser.uid}/history/${currentHistoryId}`);
          
          await update(historyRef, {
            messages: cleanMessages,
            lastUpdated: Date.now()
          });
          
          console.log('Existing chat history updated successfully');
        } 
        // Case 2: No existing ID, create a new record
        else {
          console.log('Creating new history record');
          
          // Create a new entry
          const newHistoryRef = push(ref(database, `users/${auth.currentUser.uid}/history`));
          
          const newRecord = {
            type: analysis ? 'market-analysis' : 'chat-conversation',
            title: analysis 
              ? (timeframe ? `Market Analysis - ${timeframe}` : 'Market Analysis')
              : `Chat - ${new Date().toLocaleDateString()}`,
            content: analysis || cleanMessages[cleanMessages.length - 1].content,
            messages: cleanMessages,
            timestamp: Date.now(),
            id: newHistoryRef.key
          };
          
          // Add chart URLs if available
          if (analysis && chartPreviews.length > 0) {
            newRecord.chartUrls = chartPreviews;
          }
          
          await set(newHistoryRef, newRecord);
          
          // Update state with the new ID for future updates
          if (newHistoryRef.key) {
            setCurrentHistoryId(newHistoryRef.key);
            
            // Also update location state for consistency
            navigate(location.pathname, { 
              state: { ...location.state, analysisId: newHistoryRef.key },
              replace: true
            });
            console.log('New history record created with ID:', newHistoryRef.key);
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
