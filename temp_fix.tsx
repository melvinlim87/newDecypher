// This is a temporary file to hold the fixed code
// Replace lines 480-495 with this:

useEffect(() => {
  // We don't want to add the analysis to the chat messages
  // Just display it in the analysis section
  if (analysis) {
    console.log('Analysis loaded and displayed in analysis section only');
  }
}, [analysis]);

// Fix for the chat functionality
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
    
    // Send message to API
    const response = await sendChatMessage(
      [...messages.filter(msg => msg.content !== analysis), { role: 'user', content: userMessage }],
      selectedModel,
      analysis ? `The following is a market analysis that was previously generated: ${analysis}` : undefined
    );
    
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
