import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const location = useLocation();

  useEffect(() => {
    // Check for Telegram login in sessionStorage
    const checkTelegramLogin = () => {
      const telegramUser = sessionStorage.getItem('telegramUser');
      if (telegramUser) {
        try {
          const parsedUser = JSON.parse(telegramUser);
          return parsedUser;
        } catch (error) {
          console.error('Error parsing Telegram user:', error);
          return null;
        }
      }
      return null;
    };

    const unsubscribe = onAuthStateChanged(auth, (newUser) => {
      // If Firebase user exists, use that
      if (newUser) {
        setUser(newUser);
        setLoading(false);
        return;
      }
      
      // Otherwise, check for Telegram login
      const telegramUser = checkTelegramLogin();
      if (telegramUser) {
        // Create a user-like object from Telegram data
        setUser({
          uid: telegramUser.id,
          displayName: telegramUser.name || telegramUser.username,
          photoURL: telegramUser.photoUrl,
          providerData: [{ providerId: 'telegram.com' }],
          // Add any other properties needed
          isTelegramUser: true
        });
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}