// Comprehensive fix for bidirectional history ID tracking

// 1. First, add a state variable to track the history ID
const [historyId, setHistoryId] = useState<string | null>(
  location.state?.analysisId || sessionStorage.getItem('currentHistoryId')
);

// 2. Add an effect to save the history ID to sessionStorage
useEffect(() => {
  if (historyId) {
    sessionStorage.setItem('currentHistoryId', historyId);
    console.log('Saved history ID to sessionStorage:', historyId);
  }
}, [historyId]);

// 3. Update the handleAnalyzeImage function to use the existing history ID or create a new one
// In the handleAnalyzeImage function where you save the analysis (around line 833)

// If we already have a history ID, use it to update the existing record
if (historyId && auth.currentUser) {
  try {
    console.log('Updating existing history record with analysis:', {
      historyId,
      analysisLength: result.analysis.length,
      timeframe: result.timeframe,
      chartCount: finalChartUrls.length
    });
    
    const { ref, update } = await import('firebase/database');
    const historyRef = ref(database, `users/${auth.currentUser.uid}/history/${historyId}`);
    
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
    
    console.log('Existing history record updated with analysis');
  } catch (error) {
    console.error('Error updating history with analysis:', error);
  }
}
// Otherwise create a new history record
else if (auth.currentUser) {
  try {
    const savedAnalysisId = await saveChatAnalysis(auth.currentUser.uid, {
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
      
      // Also update location state
      navigate(location.pathname, { 
        state: { ...location.state, analysisId: savedAnalysisId },
        replace: true
      });
      
      console.log('New history record created with ID:', savedAnalysisId);
    }
  } catch (error) {
    console.error('Error creating new history record:', error);
  }
}

// 4. Update the handleSendMessage function to use the existing history ID or create a new one
// In the handleSendMessage function where you save messages to Firebase

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
        
        // Also update location state
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

// 5. Add a cleanup function to clear the history ID when navigating away
// Add this to your component
useEffect(() => {
  // Cleanup function to clear the history ID when navigating away
  return () => {
    sessionStorage.removeItem('currentHistoryId');
  };
}, []);

// 6. Add a function to reset the history ID when starting a new conversation
// This can be called when clearing the chat or starting a new analysis
const resetHistoryId = () => {
  setHistoryId(null);
  sessionStorage.removeItem('currentHistoryId');
  navigate(location.pathname, { 
    state: { ...location.state, analysisId: null },
    replace: true
  });
  console.log('History ID reset for new conversation');
};
