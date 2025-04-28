// Fix for ensuring the same history ID is used throughout the conversation

// 1. First, add a state variable to track the analysis ID
const [analysisHistoryId, setAnalysisHistoryId] = useState<string | null>(
  location.state?.analysisId || sessionStorage.getItem('currentAnalysisId')
);

// 2. Add an effect to save the analysis ID to sessionStorage
useEffect(() => {
  if (analysisHistoryId) {
    sessionStorage.setItem('currentAnalysisId', analysisHistoryId);
    console.log('Saved analysis ID to sessionStorage:', analysisHistoryId);
  }
}, [analysisHistoryId]);

// 3. Modify the saveChatAnalysis call to capture and store the generated ID
// In the try block where you call saveChatAnalysis (around line 833)
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

// 4. Modify the handleSendMessage function to use the stored analysis ID
// In the handleSendMessage function, replace the Firebase saving logic with:

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
    const { ref, update } = await import('firebase/database');
    
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
    // Otherwise, we shouldn't create a new record here since the analysis should have already created one
    else {
      console.log('No analysis ID found. Messages will be saved when analysis is created.');
    }
  } catch (error) {
    console.error('Error saving chat history:', error);
  }
}

// 5. Modify the firebase.ts saveChatAnalysis function to return the ID
// In firebase.ts, update the saveChatAnalysis function:

export const saveChatAnalysis = async (userId: string, data: AnalysisData): Promise<string | null> => {
  if (!userId) return null;

  const { ref, push, set } = await import('firebase/database');
  const analysisRef = push(ref(database, `users/${userId}/history`));

  try {
    await set(analysisRef, {
      type: 'market-analysis',
      title: data.timeframe ? `Market Analysis - ${data.timeframe}` : 'Market Analysis',
      content: data.analysis,
      chartUrls: data.chartUrls,
      messages: data.messages || [],
      timestamp: data.timestamp,
      id: analysisRef.key
    });
    console.log('Data saved successfully:', analysisRef.key);
    return analysisRef.key; // Return the ID
  } catch (error) {
    console.error('Error saving analysis to Firebase:', error);
    return null;
  }
};
