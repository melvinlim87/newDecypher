// Complete fix for the history ID issue

// 1. First, add this state variable to track the history ID
const [historyId, setHistoryId] = useState<string | null>(
  location.state?.analysisId || sessionStorage.getItem('currentHistoryId')
);

// 2. Add an effect to save the history ID to sessionStorage and update location state
useEffect(() => {
  if (historyId) {
    // Save to sessionStorage
    sessionStorage.setItem('currentHistoryId', historyId);
    
    // Update location state if it doesn't match
    if (location.state?.analysisId !== historyId) {
      navigate(location.pathname, { 
        state: { ...location.state, analysisId: historyId },
        replace: true
      });
    }
    
    console.log('History ID tracked and saved:', historyId);
  }
}, [historyId, location.state, navigate]);

// 3. Replace the saveChatAnalysis call in handleAnalyzeImage (around line 833)
// Replace this:
await saveChatAnalysis(user.uid, {
  analysis: result.analysis,
  messages: messages.map(msg => ({
    role: msg.role,
    content: msg.content
  })),
  timeframe: result.timeframe,
  chartUrls: finalChartUrls,
  timestamp: Date.now()
});

// With this:
// If we already have a history ID, update the existing record
if (historyId) {
  try {
    const { ref, update } = await import('firebase/database');
    const historyRef = ref(database, `users/${user.uid}/history/${historyId}`);
    
    await update(historyRef, {
      type: 'market-analysis',
      title: result.timeframe ? `Market Analysis - ${result.timeframe}` : 'Market Analysis',
      content: result.analysis,
      chartUrls: finalChartUrls,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      lastUpdated: Date.now()
    });
    
    console.log('Updated existing history record with ID:', historyId);
  } catch (error) {
    console.error('Error updating existing history record:', error);
  }
}
// Otherwise create a new history record
else {
  try {
    const savedAnalysisId = await saveChatAnalysis(user.uid, {
      analysis: result.analysis,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      timeframe: result.timeframe,
      chartUrls: finalChartUrls,
      timestamp: Date.now()
    });
    
    // Store the analysis ID for future use
    if (savedAnalysisId) {
      setHistoryId(savedAnalysisId);
      console.log('Created new history record with ID:', savedAnalysisId);
    }
  } catch (error) {
    console.error('Error creating new history record:', error);
  }
}

// 4. Replace the Firebase saving logic in handleSendMessage (around line 993-1050)
// Replace all of that code with this:

// Save the updated chat history if a user is logged in
if (auth.currentUser) {
  try {
    console.log('Preparing to save chat messages to Firebase:', {
      messageCount: updatedMessages.length,
      hasAnalysis: !!analysis,
      hasHistoryId: !!historyId
    });
    
    // Ensure messages are properly formatted for Firebase
    const cleanMessages = updatedMessages.map(msg => ({
      role: msg.role,
      content: msg.content,
      ...(msg.isTyping ? { isTyping: msg.isTyping } : {})
    }));
    
    // Import Firebase functions
    const { ref, update, push, set } = await import('firebase/database');
    
    // If we have an existing history ID, update it
    if (historyId) {
      console.log('Updating existing chat history:', {
        historyId,
        messageCount: cleanMessages.length
      });
      
      const historyRef = ref(database, `users/${auth.currentUser.uid}/history/${historyId}`);
      
      await update(historyRef, {
        messages: cleanMessages,
        lastUpdated: Date.now()
      });
      
      console.log('Existing chat history updated successfully');
    } 
    // If we don't have a history ID yet, create a new one
    else {
      console.log('Creating new history record for chat');
      
      // Create a new entry
      const newHistoryRef = push(ref(database, `users/${auth.currentUser.uid}/history`));
      
      await set(newHistoryRef, {
        type: 'chat-conversation',
        title: `Chat - ${new Date().toLocaleDateString()}`,
        content: cleanMessages[cleanMessages.length - 1].content,
        messages: cleanMessages,
        timestamp: Date.now(),
        id: newHistoryRef.key
      });
      
      // Store the new history ID
      if (newHistoryRef.key) {
        setHistoryId(newHistoryRef.key);
        console.log('New history record created with ID:', newHistoryRef.key);
      }
    }
  } catch (error) {
    console.error('Error saving chat history:', error);
  }
}

// 5. Add a cleanup function to reset the history ID when starting a new conversation
// Add this function to your component:
const resetHistoryId = () => {
  setHistoryId(null);
  sessionStorage.removeItem('currentHistoryId');
  navigate(location.pathname, { 
    state: { ...location.state, analysisId: null },
    replace: true
  });
  console.log('History ID reset for new conversation');
};

// 6. Call resetHistoryId in your "New Conversation" button handler
// Find your New Conversation button and update its onClick handler:
<Button onClick={() => {
  resetHistoryId();
  setMessages([{ role: 'assistant', content: 'Hello! I can help you analyze market conditions and trading opportunities. Select an AI model and analysis type to begin.' }]);
  setAnalysis('');
  setChartPreviews([]);
  // Any other state resets you need
}}>
  + New Conversation
</Button>
