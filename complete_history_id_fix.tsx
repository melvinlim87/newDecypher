// Complete fix for ensuring the same history ID is used throughout the conversation

// 1. First, add this state variable to your AIAnalysisChat.tsx component:
const [analysisHistoryId, setAnalysisHistoryId] = useState<string | null>(
  location.state?.analysisId || sessionStorage.getItem('currentAnalysisId')
);

// 2. Add this effect to save the analysis ID to sessionStorage:
useEffect(() => {
  if (analysisHistoryId) {
    sessionStorage.setItem('currentAnalysisId', analysisHistoryId);
    console.log('Saved analysis ID to sessionStorage:', analysisHistoryId);
  }
}, [analysisHistoryId]);

// 3. Update the saveChatAnalysis call in the handleAnalyzeImage function (around line 833):
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
  setAnalysisHistoryId(savedAnalysisId);
  
  // Also update location state
  navigate(location.pathname, { 
    state: { ...location.state, analysisId: savedAnalysisId },
    replace: true
  });
  
  console.log('Analysis saved with ID:', savedAnalysisId);
}

// 4. Update the handleSendMessage function to use the stored analysis ID:
// Replace the Firebase saving logic in handleSendMessage with this:

// Save the updated chat history if a user is logged in
if (auth.currentUser) {
  try {
    console.log('Preparing to save chat messages to Firebase:', {
      messageCount: updatedMessages.length,
      hasAnalysis: !!analysis,
      hasAnalysisId: !!analysisHistoryId
    });
    
    // Ensure messages are properly formatted for Firebase
    const cleanMessages = updatedMessages.map(msg => ({
      role: msg.role,
      content: msg.content,
      ...(msg.isTyping ? { isTyping: msg.isTyping } : {})
    }));
    
    // Import Firebase functions
    const { ref, update, push, set } = await import('firebase/database');
    
    // If we have an existing analysis ID, update it
    if (analysisHistoryId) {
      console.log('Updating existing chat history:', {
        analysisId: analysisHistoryId,
        messageCount: cleanMessages.length
      });
      
      const historyRef = ref(database, `users/${auth.currentUser.uid}/history/${analysisHistoryId}`);
      
      await update(historyRef, {
        messages: cleanMessages,
        lastUpdated: Date.now()
      });
      
      console.log('Existing chat history updated successfully');
    } 
    // If we don't have an analysis ID yet, create a new conversation
    else {
      console.log('No analysis ID found, creating a new conversation');
      
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
      
      // Store the new conversation ID
      if (newConversationRef.key) {
        setAnalysisHistoryId(newConversationRef.key);
        
        // Also update location state
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
