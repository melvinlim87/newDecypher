import { database, auth } from './firebase';
import { ref, push, set, onValue, off, query, orderByChild, limitToLast, get, update, serverTimestamp, equalTo } from 'firebase/database';

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'agent' | 'system';
  timestamp: number;
  userId: string;
  agentId?: string;
  status: 'sent' | 'delivered' | 'read';
  metadata?: {
    userName?: string;
    userEmail?: string;
    readBy?: { [userId: string]: number };
    agentName?: string;
    department?: string;
    priority?: 'low' | 'medium' | 'high';
    tags?: string[];
  };
}

export interface ChatSession {
  id: string;
  userId: string;
  agentId?: string;
  status: 'active' | 'waiting' | 'closed';
  startedAt: number;
  endedAt?: number;
  lastMessageAt: number;
  metadata?: {
    userName?: string;
    userEmail?: string;
    agentName?: string;
    department?: string;
    priority?: 'low' | 'medium' | 'high';
    tags?: string[];
    source?: string;
    browser?: string;
    platform?: string;
  };
}

// Get or create chat session
export async function getOrCreateChatSession(retryCount = 0): Promise<string> {
  if (!auth.currentUser) throw new Error('User not authenticated');
  const userId = auth.currentUser.uid;

  try {
    // Create new session
    const sessionsRef = ref(database, `users/${userId}/chatSessions`);
    
    // Check for existing active session first
    const activeSessionsQuery = query(
      sessionsRef,
      orderByChild('status'),
      equalTo('active')
    );

    const snapshot = await get(activeSessionsQuery);
    if (snapshot.exists()) {
      const sessions = Object.entries(snapshot.val());
      const recentSession = sessions.find(([_, session]: [string, any]) => {
        return Date.now() - session.startedAt < 24 * 60 * 60 * 1000;
      });

      if (recentSession) {
        return recentSession[0];
      }
    }

    // No active session found, create new one
    const newSessionRef = push(sessionsRef);
    const session: ChatSession = {
      id: newSessionRef.key!,
      userId: auth.currentUser.uid,
      status: 'active',
      startedAt: Date.now(),
      lastMessageAt: Date.now(),
      metadata: {
        userName: auth.currentUser.displayName || undefined,
        userEmail: auth.currentUser.email || undefined,
        source: 'web',
        browser: navigator.userAgent,
        platform: navigator.platform
      }
    };

    await set(newSessionRef, session);
    console.log('Created new chat session:', {
      sessionId: newSessionRef.key,
      userId: session.userId,
      status: session.status
    });
  } catch (error) {
    // Handle Firebase indexing errors gracefully
    if (error instanceof Error && 
        error.message.includes('indexOn') && 
        retryCount < 3) {
      // Wait briefly and retry with exponential backoff
      const delay = Math.pow(2, retryCount) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      return getOrCreateChatSession(retryCount + 1);
    }
    throw error;
  }
}

// Send a new message
export async function sendMessage(sessionId: string, text: string): Promise<string> {
  if (!auth.currentUser) throw new Error('User not authenticated');
  const userId = auth.currentUser.uid;
  
  // Verify session exists and is active
  const sessionRef = ref(database, `users/${userId}/chatSessions/${sessionId}`);
  const sessionSnap = await get(sessionRef);
  
  if (!sessionSnap.exists()) {
    throw new Error('Chat session not found');
  }
  
  const session = sessionSnap.val();
  if (session.status !== 'active') {
    throw new Error('Chat session is not active');
  }
  
  // Check last message timestamp to prevent spam
  const lastMessageQuery = query(
    ref(database, `users/${userId}/chatMessages/${sessionId}`),
    orderByChild('timestamp'),
    limitToLast(1)
  );
  
  const lastMessageSnap = await get(lastMessageQuery);
  if (lastMessageSnap.exists()) {
    const lastMessage = Object.values(lastMessageSnap.val())[0] as ChatMessage;
    const timeSinceLastMessage = Date.now() - lastMessage.timestamp;
    
    // Require 500ms between messages
    if (timeSinceLastMessage < 500) {
      throw new Error('Please wait before sending another message');
    }
  }

  const messagesRef = ref(database, `users/${userId}/chatMessages/${sessionId}`);
  const newMessageRef = push(messagesRef);

  const message: ChatMessage = {
    id: newMessageRef.key!,
    text,
    sender: 'user',
    timestamp: Date.now(),
    userId: auth.currentUser.uid,
    status: 'sent',
    metadata: {
      readBy: { [auth.currentUser.uid]: Date.now() },
      userName: auth.currentUser.displayName || undefined,
      userEmail: auth.currentUser.email || undefined
    }
  };

  await set(newMessageRef, message);

  // Update session's last message timestamp
  await update(sessionRef, {
    lastMessageAt: Date.now()
  });

  return newMessageRef.key!;
}

// Subscribe to messages for a session
export function subscribeToMessages(
  sessionId: string, 
  callback: (messages: ChatMessage[]) => void
): (() => void) {
  if (!auth.currentUser) throw new Error('User not authenticated');
  const userId = auth.currentUser.uid;

  const messagesPath = `users/${userId}/chatMessages/${sessionId}`;
  console.log('Subscribing to messages:', { userId, sessionId, path: messagesPath });

  const messagesQuery = query(
    ref(database, messagesPath),
    orderByChild('timestamp'),
    limitToLast(100)
  );

  const unsubscribe = onValue(messagesQuery, (snapshot) => {
    if (snapshot.exists()) {
      const messages = Object.values(snapshot.val()) as ChatMessage[];
      callback(messages.sort((a, b) => a.timestamp - b.timestamp));
    } else {
      callback([]);
    }
  });

  return () => off(messagesQuery);
}

// Subscribe to session status changes
export function subscribeToSession(
  sessionId: string,
  callback: (session: ChatSession | null) => void
): (() => void) {
  if (!auth.currentUser) throw new Error('User not authenticated');
  const userId = auth.currentUser.uid;
  
  const sessionPath = `users/${userId}/chatSessions/${sessionId}`;
  console.log('Subscribing to session:', { userId, sessionId, path: sessionPath });
  
  const sessionRef = ref(database, sessionPath);

  const unsubscribe = onValue(sessionRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val() as ChatSession);
    } else {
      callback(null);
    }
  });

  return () => off(sessionRef);
}

// Mark messages as read
export async function markMessagesAsRead(sessionId: string): Promise<void> {
  if (!auth.currentUser) throw new Error('User not authenticated');

  const userId = auth.currentUser.uid;
  const messagesRef = ref(database, `users/${userId}/chatMessages/${sessionId}`);
  const snapshot = await get(messagesRef);

  if (snapshot.exists()) {
    const updates: Record<string, any> = {};
    Object.entries(snapshot.val()).forEach(([key, message]: [string, any]) => {
      // Only mark messages from others as read
      if (message.userId !== userId) {
        updates[`${key}/metadata/readBy/${userId}`] = serverTimestamp();
        
        // Update status if all participants have read
        const readBy = message.metadata?.readBy || {};
        if (!readBy[userId]) {
          updates[`${key}/status`] = 'read';
        }
      }
    });

    if (Object.keys(updates).length > 0) {
      await update(messagesRef, updates);
    }
  }
}

// Close chat session
export async function closeChatSession(sessionId: string): Promise<void> {
  if (!auth.currentUser) throw new Error('User not authenticated');
  const userId = auth.currentUser.uid;

  const sessionRef = ref(database, `users/${userId}/chatSessions/${sessionId}`);
  await update(sessionRef, {
    status: 'closed',
    endedAt: Date.now()
  });
}