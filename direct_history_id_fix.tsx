// Direct fix for the history ID issue

// 1. First, add this state variable to your component
// Add this right after your other useState declarations
const [historyId, setHistoryId] = useState<string | null>(
  location.state?.analysisId || sessionStorage.getItem('currentHistoryId')
);

// 2. Add this effect to track the history ID
// Add this with your other useEffect hooks
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

// 3. Update the saveChatAnalysis call in the analysis function
// Find the code where you call saveChatAnalysis (around line 833) and replace it with:

// Save the analysis data
try {
  // If we already have a history ID, update the existing record
  if (historyId && auth.currentUser) {
    console.log('Updating existing history record with analysis:', historyId);
    
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
  }
  // Otherwise create a new history record
  else if (auth.currentUser) {
    console.log('Creating new history record for analysis');
    
    const { ref, push, set } = await import('firebase/database');
    const newHistoryRef = push(ref(database, `users/${auth.currentUser.uid}/history`));
    
    await set(newHistoryRef, {
      type: 'market-analysis',
      title: result.timeframe ? `Market Analysis - ${result.timeframe}` : 'Market Analysis',
      content: result.analysis,
      chartUrls: finalChartUrls,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
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
  console.error('Error saving analysis:', error);
}

// 4. Update the handleSendMessage function
// Replace the Firebase saving logic in handleSendMessage with:

// Save the updated chat history if a user is logged in
if (auth.currentUser) {
  try {
    console.log('Preparing to save chat messages to Firebase:', {
      messageCount: updatedMessages.length,
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
      console.log('Updating existing chat history with ID:', historyId);
      
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

// 5. Add a reset function for the "New Conversation" button
const resetHistoryId = () => {
  setHistoryId(null);
  sessionStorage.removeItem('currentHistoryId');
  navigate(location.pathname, { 
    state: { ...location.state, analysisId: null },
    replace: true
  });
  console.log('History ID reset for new conversation');
};

// 6. Update your "New Conversation" button handler
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
