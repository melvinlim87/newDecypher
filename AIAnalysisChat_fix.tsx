// This is a reference file with the fix for the chat-conversation loading issue
// Replace the code in AIAnalysisChat.tsx around line 1130-1134 with this version:

            if (historyData.content) {
              // Only set analysis content for market-analysis type
              if (historyData.type === 'market-analysis') {
                setAnalysis(historyData.content);
                setAnalysisType(historyData.analysisType || AnalysisType.Technical);
              } else if (historyData.type === 'chat-conversation') {
                // For chat conversations, explicitly set analysis to null
                setAnalysis(null);
                setAnalysisType(AnalysisType.Technical);
              }
              
              // Load saved messages if they exist
