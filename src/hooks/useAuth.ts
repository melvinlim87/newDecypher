import { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthState {
  user: User | null;
  loading: boolean;
  isTelegramUser: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    isTelegramUser: false,
  });

  // Check for Telegram login
  const checkTelegramLogin = useCallback(() => {
    const telegramUser = sessionStorage.getItem('telegramUser');
    if (telegramUser) {
      try {
        const parsedUser = JSON.parse(telegramUser);
        return {
          uid: parsedUser.id,
          displayName: parsedUser.name || parsedUser.username,
          photoURL: parsedUser.photoUrl,
          email: null,
          providerData: [{ providerId: 'telegram.com' }],
          isTelegramUser: true
        };
      } catch (error) {
        console.error('Error parsing Telegram user:', error);
        return null;
      }
    }
    return null;
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setAuthState({
          user,
          loading: false,
          isTelegramUser: false
        });
      } else {
        // Check for Telegram login
        const telegramUser = checkTelegramLogin();
        if (telegramUser) {
          setAuthState({
            user: telegramUser,
            loading: false,
            isTelegramUser: true
          });
        } else {
          setAuthState({
            user: null,
            loading: false,
            isTelegramUser: false
          });
        }
      }
    });

    // Check for Telegram login on initial load
    if (!auth.currentUser) {
      const telegramUser = checkTelegramLogin();
      if (telegramUser) {
        setAuthState({
          user: telegramUser,
          loading: false,
          isTelegramUser: true
        });
      }
    }

    // Cleanup subscription
    return () => unsubscribe();
  }, [checkTelegramLogin]);

  return authState;
}
