// Complete fixed handleSendMessage function
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
    
    // Save the updated chat history if we have an analysis and a user is logged in
    if (analysis && auth.currentUser) {
      try {
        // Ensure messages are properly formatted for Firebase
        const cleanMessages = updatedMessages.map(msg => ({
          role: msg.role,
          content: msg.content,
          ...(msg.isTyping ? { isTyping: msg.isTyping } : {})
        }));
        
        // Case 1: If we have an existing analysis ID, update it
        if (location.state?.analysisId) {
          console.log('Updating existing chat history:', {
            analysisId: location.state.analysisId,
            messageCount: cleanMessages.length
          });
          
          const { ref, update } = await import('firebase/database');
          const historyRef = ref(database, `users/${auth.currentUser.uid}/history/${location.state.analysisId}`);
          
          await update(historyRef, {
            messages: cleanMessages,
            lastUpdated: Date.now()
          });
          
          console.log('Existing chat history updated successfully');
        } 
        // Case 2: If we have analysis but no analysisId, this might be a new analysis that hasn't been saved yet
        else if (chartPreviews.length > 0) {
          console.log('Creating new analysis with chat history:', {
            messageCount: cleanMessages.length,
            chartCount: chartPreviews.length
          });
          
          // Save as a new analysis
          const analysisId = await saveChatAnalysis(auth.currentUser.uid, {
            analysis: analysis,
            messages: cleanMessages,
            timeframe: timeframe || null,
            chartUrls: chartPreviews,
            timestamp: Date.now()
          });
          
          // Update location state with the new analysisId for future updates
          if (analysisId) {
            navigate(location.pathname, { 
              state: { ...location.state, analysisId },
              replace: true
            });
          }
          
          console.log('New analysis with chat history saved successfully:', { analysisId });
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
