import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { auth, saveChatAnalysis, uploadChartImage, getUserAnalyses } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface AnalysisContextType {
  image: string | null;
  setImage: (image: string | null) => void;
  analysis: string | null;
  setAnalysis: (analysis: string | null) => void;
  timeframe: string | null;
  setTimeframe: (timeframe: string | null) => void;
  chartPreviews: string[];
  setChartPreviews: (previews: string[]) => void;
  saveCurrentAnalysis: (userMessage: string) => Promise<void>;
  loadAnalyses: () => Promise<void>;
  initialMessage: string;
  setInitialMessage: (message: string) => void;
  resetAnalysis: () => void;
  analyses: Array<{
    id: string;
    analysis: string;
    timeframe: string;
    chartUrls: string[];
    timestamp: number;
    messages: Array<{
      role: string;
      content: string;
    }>;
  }>;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

export const AnalysisProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<string | null>(null);
  const [chartPreviews, setChartPreviews] = useState<string[]>([]);
  const [initialMessage, setInitialMessage] = useState("Hello! I can help you analyze market conditions and trading opportunities. Select an AI model and analysis type to begin.");
  const [analyses, setAnalyses] = useState<Array<{
    id: string;
    analysis: string;
    timeframe: string;
    chartUrls: string[];
    timestamp: number;
    messages: Array<{
      role: string;
      content: string;
    }>;
  }>>([]);

  // Clear analysis state on page refresh
  useEffect(() => {
    const clearState = () => {
      setImage(null);
      setAnalysis(null);
      setTimeframe(null);
      setChartPreviews([]);
      setInitialMessage("Hello! I can help you analyze market conditions and trading opportunities. Select an AI model and analysis type to begin.");
    };

    window.addEventListener('beforeunload', clearState);
    
    // Also clear on mount
    clearState();

    return () => {
      window.removeEventListener('beforeunload', clearState);
    };
  }, []);

  // Load user's analyses when authenticated
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await loadAnalyses();
      } else {
        setAnalyses([]);
        setImage(null);
        setAnalysis(null);
        setTimeframe(null);
        setChartPreviews([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadAnalyses = async () => {
    if (!auth.currentUser) return;
    
    try {
      const userAnalyses = await getUserAnalyses(auth.currentUser.uid);
      setAnalyses(userAnalyses);
    } catch (error) {
      console.error('Error loading analyses:', error);
    }
  };

  const saveCurrentAnalysis = async (userMessage: string) => {
    if (!auth.currentUser || !analysis) return;

    try {
      // Convert base64 images to blobs and upload to Firebase Storage
      const uploadPromises = chartPreviews.map(async (preview) => {
        if (preview.startsWith('data:image')) {
          // Convert base64 to blob
          const response = await fetch(preview);
          const blob = await response.blob();
          return uploadChartImage(auth.currentUser!.uid, blob);
        }
        return preview; // If it's already a URL, keep it as is
      });

      const chartUrls = await Promise.all(uploadPromises);

      // Only save if we have valid Firebase URLs
      if (chartUrls.some(url => url.includes('firebasestorage'))) {
        await saveChatAnalysis(auth.currentUser.uid, {
          analysis,
          timeframe,
          chartUrls,
          timestamp: Date.now()
        });

        // Reload analyses to get the latest data
        await loadAnalyses();
      } else {
        console.log('No valid Firebase URLs found, skipping save');
      }
    } catch (error) {
      console.error('Error saving analysis:', error);
      throw error;
    }
  };

  // Keep session storage synchronized for temporary state
  useEffect(() => {
    if (image) {
      sessionStorage.setItem('analysisImage', image);
    } else {
      sessionStorage.removeItem('analysisImage');
    }
  }, [image]);

  useEffect(() => {
    if (analysis) {
      sessionStorage.setItem('analysis', analysis);
    } else {
      sessionStorage.removeItem('analysis');
    }
  }, [analysis]);

  useEffect(() => {
    if (timeframe) {
      sessionStorage.setItem('timeframe', timeframe);
    } else {
      sessionStorage.removeItem('timeframe');
    }
  }, [timeframe]);

  useEffect(() => {
    if (chartPreviews.length > 0) {
      sessionStorage.setItem('chartPreviews', JSON.stringify(chartPreviews));
    } else {
      sessionStorage.removeItem('chartPreviews');
    }
  }, [chartPreviews]);

  const resetAnalysis = () => {
    // Clear state in memory
    setImage(null);
    setAnalysis(null);
    setTimeframe(null);
    setChartPreviews([]);
    
    // Also clear sessionStorage to prevent data from persisting across page refreshes
    sessionStorage.removeItem('analysisImage');
    sessionStorage.removeItem('analysis');
    sessionStorage.removeItem('timeframe');
    sessionStorage.removeItem('chartPreviews');
    sessionStorage.removeItem('currentHistoryId');
    
    console.log('Analysis state and sessionStorage cleared');
  };

  return (
    <AnalysisContext.Provider value={{ 
      image, 
      setImage, 
      analysis, 
      setAnalysis,
      timeframe,
      setTimeframe,
      chartPreviews,
      setChartPreviews,
      saveCurrentAnalysis,
      loadAnalyses,
      analyses,
      initialMessage,
      setInitialMessage,
      resetAnalysis
    }}>
      {children}
    </AnalysisContext.Provider>
  );
};

export const useAnalysisContext = () => {
  const context = useContext(AnalysisContext);
  if (!context) {
    throw new Error('useAnalysisContext must be used within an AnalysisProvider');
  }
  return context;
};
