// Replace the handleItemClick function in AnalysisHistory.tsx with this code:

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
    // Navigate to the main analysis page for market analysis or chat
    navigate('/', { 
      state: { 
        analysisId: item.id,
        content: item.content,
        messages: messagesData
      } 
    });
  } else {
    // For any other type (like EA generator items), go to EA generator page
    navigate('/ea-generator', { 
      state: { 
        historyId: item.id,
        content: item.content,
        messages: messagesData
      } 
    });
  }
};
