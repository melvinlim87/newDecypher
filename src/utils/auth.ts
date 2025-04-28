import { auth } from '../lib/firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { ref, query, orderByChild, equalTo, get, update } from 'firebase/database';
import { database } from '../lib/firebase';

export const getAuthHeader = () => {
  const isDevelopment = import.meta.env.MODE === 'development';
  const apiKey = isDevelopment 
    ? import.meta.env.VITE_OPENROUTER_API_KEY_LOCAL || import.meta.env.VITE_OPENROUTER_API_KEY
    : import.meta.env.VITE_OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error('OpenRouter API key is not configured');
  }

  // Check if the API key already has the prefix
  if (apiKey.startsWith('sk-or-v1-')) {
    return {
      'Authorization': `Bearer ${apiKey}`
    };
  }
  
  return {
    'Authorization': `Bearer sk-or-v1-${apiKey}`
  };
};

export const handleLogout = async () => {
  try {
    // Close any active chat sessions before logging out
    if (auth.currentUser) {
      const userId = auth.currentUser.uid;
      const sessionsRef = ref(database, `users/${userId}/chatSessions`);
      const activeSessionsQuery = query(
        sessionsRef,
        orderByChild('status'),
        equalTo('active')
      );

      const snapshot = await get(activeSessionsQuery);
      if (snapshot.exists()) {
        const updates = {};
        Object.entries(snapshot.val()).forEach(([sessionId, session]: [string, any]) => {
          updates[`users/${userId}/chatSessions/${sessionId}/status`] = 'closed';
          updates[`users/${userId}/chatSessions/${sessionId}/endedAt`] = Date.now();
        });
        await update(ref(database), updates);
      }
    }

    // Clear session storage
    sessionStorage.clear();
    
    // Sign out from Firebase
    await signOut(auth);
    
    // Force page reload to ensure clean state
    window.location.href = '/login';
  } catch (error) {
    console.error('Error during logout:', error);
  }
};
