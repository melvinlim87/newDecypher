// Fixed handleSendMessage function for AIAnalysisChat.tsx

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
    setMessages(prev => [
      ...prev.slice(0, prev.length - 1),
      { role: 'assistant', content: response }
    ]);
  } catch (err) {
    console.error('Error sending message:', err);
    // Remove typing indicator and add error message
    setMessages(prev => [
      ...prev.slice(0, prev.length - 1),
      { role: 'assistant', content: 'Sorry, there was an error processing your message. Please try again.' }
    ]);
  } finally {
    setIsLoading(false);
  }
};
