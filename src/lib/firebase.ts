import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import { ref, set, push, get, update, serverTimestamp } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyAlWSNcqOYJRrttlL2cYNUvZaMoCc5F2j4",
  authDomain: "ai-crm-windsurf.firebaseapp.com",
  databaseURL: "https://ai-crm-windsurf-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ai-crm-windsurf",
  storageBucket: "ai-crm-windsurf.firebasestorage.app",
  messagingSenderId: "473319817958",
  appId: "1:473319817958:web:7e6e03b8419ac16f8b7127"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
export const storage = getStorage(app);

// Helper function to save EA generator conversation history
export const saveEAHistory = async (userId: string, data: {
  messages: Array<{role: string; content: string; image?: string}>;
  timestamp: number;
  title?: string;
  historyId?: string | null;
  chartUrls?: string[];
  timeframe?: string;
  model?: string; // Add model parameter
}) => {
  console.log('saveEAHistory called with:', {
    userId,
    messageCount: data.messages.length,
    historyId: data.historyId,
    title: data.title,
    model: data.model || 'No model provided',
    timestamp: new Date(data.timestamp).toISOString()
  });

  if (!userId) return;
  if (!data.messages || data.messages.length === 0) {
    console.log('No messages provided, skipping save');
    return;
  }

  const { ref, set, push, get } = await import('firebase/database');

  // If we have a history ID, update existing conversation
  if (data.historyId) {
    const historyRef = ref(database, `users/${userId}/history/${data.historyId}`);
    console.log('Updating existing EA history:', {
      path: `users/${userId}/history/${data.historyId}`,
      messageCount: data.messages.length,
      lastMessage: {
        role: data.messages[data.messages.length - 1].role,
        contentLength: data.messages[data.messages.length - 1].content.length
      }
    });

    // Clean messages array by removing undefined image properties
    const cleanMessages = data.messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      ...(msg.image ? { image: msg.image } : {})
    }));

    // Extract chart URLs from message images if not provided directly
    const chartUrls = data.chartUrls || [];
    
    // If there are images in messages but no chartUrls provided, extract them
    if (chartUrls.length === 0) {
      for (const msg of data.messages) {
        if (msg.image && !chartUrls.includes(msg.image)) {
          chartUrls.push(msg.image);
        }
      }
    }
    
    await set(historyRef, {
      type: 'ea-generator',
      title: data.title,
      messages: cleanMessages, // Keep all messages in the array but cleaned
      content: data.messages[data.messages.length - 1].content, // Store latest message as content
      timestamp: data.timestamp,
      id: data.historyId,
      chartUrls: chartUrls.length > 0 ? chartUrls : null,
      timeframe: data.timeframe || null,
      model: data.model || 'anthropic/claude-3-opus:beta' // Save the model information
    });

    console.log('Successfully updated existing history:', data.historyId);
    return data.historyId;
  } else {
    // Create new conversation
    const title = data.title || (
      data.messages[0].content.length > 50 
        ? `EA Generator - ${data.messages[0].content.substring(0, 50)}...`
        : `EA Generator - ${data.messages[0].content}`
    );

    const eaHistoryRef = push(ref(database, `users/${userId}/history`));
    console.log('Creating new EA history:', {
      path: `users/${userId}/history/${eaHistoryRef.key}`,
      messageCount: data.messages.length,
      title,
      firstMessage: {
        role: data.messages[0].role,
        contentLength: data.messages[0].content.length
      },
      lastMessage: {
        role: data.messages[data.messages.length - 1].role,
        contentLength: data.messages[data.messages.length - 1].content.length
      }
    });

    // Clean messages array by removing undefined image properties
    const cleanMessages = data.messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      ...(msg.image ? { image: msg.image } : {})
    }));

    // Extract chart URLs from message images if not provided directly
    const chartUrls = data.chartUrls || [];
    
    // If there are images in messages but no chartUrls provided, extract them
    if (chartUrls.length === 0) {
      for (const msg of data.messages) {
        if (msg.image && !chartUrls.includes(msg.image)) {
          chartUrls.push(msg.image);
        }
      }
    }
    
    await set(eaHistoryRef, {
      type: 'ea-generator',
      title: title,
      messages: cleanMessages, // Keep all messages in the array but cleaned
      content: data.messages[data.messages.length - 1].content, // Store latest message as content
      timestamp: data.timestamp,
      id: eaHistoryRef.key,
      chartUrls: chartUrls.length > 0 ? chartUrls : null,
      timeframe: data.timeframe || null,
      model: data.model || 'anthropic/claude-3-opus:beta' // Save the model information
    });
  
    console.log('Successfully created new history:', eaHistoryRef.key);
    return eaHistoryRef.key;
  }
};

// Helper function to save chat analysis data
export const saveChatAnalysis = async (userId: string, data: {
  analysis: string | null;
  messages?: Array<{role: string; content: string; image?: string}>;
  timeframe: string | null;
  chartUrls: string[];
  timestamp: number;
  model?: string;
}): Promise<string | null> => {
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
      id: analysisRef.key,
      model: data.model || 'anthropic/claude-3-opus:beta' // Default model if not provided
    });
    console.log('Data saved successfully:', analysisRef.key);
    return analysisRef.key;
  } catch (error) {
    console.error('Error saving analysis to Firebase:', error);
    return null;
  }
};

// Helper function to upload chart image
export const uploadChartImage = async (userId: string, imageBlob: Blob): Promise<string> => {
  if (!userId) throw new Error('User ID is required');
  console.log('Starting uploadChartImage:', { 
    userId, 
    blobSize: imageBlob.size, 
    blobType: imageBlob.type,
    storageBucket: storage.app.options.storageBucket 
  });

  try {
    const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
    console.log('Firebase storage modules imported');
    
    // Create a unique filename with timestamp and random string
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const filename = `${timestamp}-${randomString}.png`;
    console.log('Generated filename:', filename);
    
    // Store in user-specific folder
    const imageRef = ref(storage, `users/${userId}/charts/${filename}`);
    console.log('Created storage reference:', {
      fullPath: imageRef.fullPath,
      bucket: imageRef.bucket,
      name: imageRef.name
    });
    
    // Upload the image
    console.log('Starting upload to Firebase Storage...');
    const snapshot = await uploadBytes(imageRef, imageBlob);
    console.log('Upload completed:', {
      bytesTransferred: snapshot.bytesTransferred,
      totalBytes: snapshot.totalBytes,
      fullPath: snapshot.ref.fullPath,
      metadata: snapshot.metadata
    });
    
    // Get the HTTPS download URL
    console.log('Getting download URL...');
    const httpsUrl = await getDownloadURL(imageRef);
    console.log('Got download URL:', httpsUrl.substring(0, 50) + '...');
    
    return httpsUrl;
  } catch (error) {
    console.error('Error in uploadChartImage:', error);
    throw error instanceof Error ? error : new Error('Failed to upload chart image');
  }
};

// Helper function to convert gs:// URL to HTTPS URL
export const getHttpsUrl = async (gsUrl: string): Promise<string> => {
  if (!gsUrl.startsWith('gs://')) return gsUrl;
  
  const { ref, getDownloadURL } = await import('firebase/storage');
  const gsPath = gsUrl.replace('gs://', '');
  const [bucket, ...pathParts] = gsPath.split('/');
  const path = pathParts.join('/');
  
  const imageRef = ref(storage, path);
  return getDownloadURL(imageRef);
};

// Helper function to get user's analyses
export const getUserAnalyses = async (userId: string) => {
  if (!userId) return [];

  const { ref, get } = await import('firebase/database');
  const historyRef = ref(database, `users/${userId}/history`);
  
  try {
    const snapshot = await get(historyRef);
    if (!snapshot.exists()) return [];

    return Object.entries(snapshot.val()).map(([key, value]: [string, any]) => ({
      id: key,
      ...value
    }));
  } catch (error) {
    console.error('Error getting analyses:', error);
    return [];
  }
};

// Helper function to delete chart images
export const deleteChartImages = async (userId: string, chartUrls?: string[]) => {
  if (!userId || !chartUrls || !Array.isArray(chartUrls) || chartUrls.length === 0) {
    return;
  }

  const { ref, deleteObject } = await import('firebase/storage');
  
  // Delete each chart image
  const deletePromises = chartUrls.map(async (url) => {
    try {
      // Extract the path from the URL
      const path = decodeURIComponent(url.split('/o/')[1].split('?')[0]);
      const imageRef = ref(storage, path);
      await deleteObject(imageRef);
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  });

  await Promise.all(deletePromises);
};

// Helper function to delete analysis data
export const deleteAnalysis = async (userId: string, analysisId: string, chartUrls?: string[]) => {
  if (!userId || !analysisId) return;

  const { ref, remove, get } = await import('firebase/database');
  
  // Delete the analysis data
  const analysisRef = ref(database, `users/${userId}/history/${analysisId}`);
  
  // If chartUrls is not provided, try to get them from the database
  if (!chartUrls) {
    try {
      const snapshot = await get(analysisRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        chartUrls = data.chartUrls || [];
      } else {
        chartUrls = [];
      }
    } catch (error) {
      console.error('Error fetching analysis data:', error);
      chartUrls = [];
    }
  }
  
  // Delete the analysis data
  await remove(analysisRef);
  
  // Delete associated chart images if they exist
  if (chartUrls && chartUrls.length > 0) {
    await deleteChartImages(userId, chartUrls);
  }
};

// Function to record token usage in Firebase
export const recordTokenUsage = async (userId: string, data: {
  tokensUsed: number;
  feature: 'chat' | 'analysis' | 'ea-generator';
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  metadata?: Record<string, any>;
}) => {
  if (!userId || !data.tokensUsed) return null;
  
  try {
    console.log('Recording token usage:', {
      userId,
      tokensUsed: data.tokensUsed,
      feature: data.feature,
      model: data.model || 'unknown',
      timestamp: new Date().toISOString()
    });
    
    // Create a new token usage record
    const usageRef = push(ref(database, `users/${userId}/tokenUsage`));
    
    // Record the token usage with timestamp
    await set(usageRef, {
      tokensUsed: data.tokensUsed,
      feature: data.feature,
      model: data.model || 'unknown',
      inputTokens: data.inputTokens || 0,
      outputTokens: data.outputTokens || 0,
      timestamp: Date.now(),
      ...data.metadata
    });
    
    // Update the user's total tokens used
    const userRef = ref(database, `users/${userId}`);
    const userSnapshot = await get(userRef);
    
    if (userSnapshot.exists()) {
      const userData = userSnapshot.val();
      const currentTotalUsed = userData.totalTokensUsed || 0;
      
      // Update the user's total tokens used
      await update(userRef, {
        totalTokensUsed: currentTotalUsed + data.tokensUsed,
        lastTokenUsage: {
          timestamp: Date.now(),
          amount: data.tokensUsed,
          feature: data.feature,
          model: data.model || 'unknown'
        }
      });
    }
    
    return usageRef.key;
  } catch (error) {
    console.error('Error recording token usage:', error);
    return null;
  }
};

// Function to get user's token usage history
export const getTokenUsageHistory = async (userId: string, limit: number = 50) => {
  if (!userId) return [];
  
  try {
    const usageRef = ref(database, `users/${userId}/tokenUsage`);
    const snapshot = await get(usageRef);
    
    if (!snapshot.exists()) return [];
    
    // Convert to array and sort by timestamp (newest first)
    const usageData = Object.entries(snapshot.val())
      .map(([id, data]: [string, any]) => ({
        id,
        ...data,
        // Convert timestamp to Date object if it's a number
        timestamp: typeof data.timestamp === 'number' 
          ? new Date(data.timestamp) 
          : data.timestamp
      }))
      .sort((a, b) => {
        // Sort by timestamp (newest first)
        const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : a.timestamp;
        const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : b.timestamp;
        return timeB - timeA;
      })
      .slice(0, limit); // Limit the number of results
    
    return usageData;
  } catch (error) {
    console.error('Error getting token usage history:', error);
    return [];
  }
};

// Function to get user's token usage summary
export const getTokenUsageSummary = async (userId: string) => {
  if (!userId) return null;
  
  try {
    // Get user data to check total tokens used
    const userRef = ref(database, `users/${userId}`);
    const userSnapshot = await get(userRef);
    
    if (!userSnapshot.exists()) return null;
    
    const userData = userSnapshot.val();
    const totalTokensUsed = userData.totalTokensUsed || 0;
    
    // Get token usage data to calculate feature breakdown
    const usageRef = ref(database, `users/${userId}/tokenUsage`);
    const usageSnapshot = await get(usageRef);
    
    let featureBreakdown = {
      chat: 0,
      analysis: 0,
      'ea-generator': 0
    };
    
    let modelBreakdown = {};
    
    if (usageSnapshot.exists()) {
      const usageData = usageSnapshot.val();
      
      // Calculate feature breakdown
      Object.values(usageData).forEach((usage: any) => {
        // Update feature counts
        if (usage.feature && usage.tokensUsed) {
          featureBreakdown[usage.feature] = 
            (featureBreakdown[usage.feature] || 0) + usage.tokensUsed;
        }
        
        // Update model counts
        if (usage.model && usage.tokensUsed) {
          modelBreakdown[usage.model] = 
            (modelBreakdown[usage.model] || 0) + usage.tokensUsed;
        }
      });
    }
    
    return {
      totalTokensUsed,
      featureBreakdown,
      modelBreakdown,
      lastUsage: userData.lastTokenUsage || null
    };
  } catch (error) {
    console.error('Error getting token usage summary:', error);
    return null;
  }
};