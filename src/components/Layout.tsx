import { useState, useEffect } from 'react';
import { NavBar } from './NavBar';
import { SideBar } from './SideBar';
import { auth } from '../lib/firebase';
import { N8nChatWidget } from './N8nChatWidget';
import { useTheme } from '../contexts/ThemeContext';
import { VerticalCircuitLines } from './VerticalCircuitLines';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  // Remove isAuthPage check to always show navbar
  const isAuthPage = false;
  const [showChat, setShowChat] = useState(false);
  const [user, setUser] = useState<any>(auth.currentUser);
  const { theme } = useTheme();

  // Check for Telegram login
  const checkTelegramLogin = () => {
    const telegramUser = sessionStorage.getItem('telegramUser');
    if (telegramUser) {
      try {
        const parsedUser = JSON.parse(telegramUser);
        return {
          uid: parsedUser.id,
          displayName: parsedUser.name || parsedUser.username,
          photoURL: parsedUser.photoUrl,
          providerData: [{ providerId: 'telegram.com' }],
          isTelegramUser: true
        };
      } catch (error) {
        console.error('Error parsing Telegram user:', error);
        return null;
      }
    }
    return null;
  };

  // Initialize chat visibility and track user authentication state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      // Check for Firebase auth first
      if (currentUser) {
        setUser(currentUser);
        setShowChat(true);
      } else {
        // Check for Telegram login
        const telegramUser = checkTelegramLogin();
        if (telegramUser) {
          setUser(telegramUser);
          setShowChat(true);
        } else {
          setUser(null);
          setShowChat(false);
        }
      }
    });

    // Check for Telegram login on initial load
    if (!auth.currentUser) {
      const telegramUser = checkTelegramLogin();
      if (telegramUser) {
        setUser(telegramUser);
        setShowChat(true);
      }
    }

    return () => unsubscribe();
  }, []);

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div data-theme={theme} className="flex flex-col h-screen overflow-hidden">
      {/* Background layer */}
      <div className="fixed inset-0 z-0">
        <div className="opacity-50">
          <VerticalCircuitLines theme={theme === 'dark' ? 'dark' : 'light'} />
        </div>
      </div>
      
      {/* Fixed navbar at the top */}
      <div className="flex-none fixed top-0 left-0 right-0 z-50" style={{ position: 'fixed', top: 0, zIndex: 50, height: '90px' }}>
        <NavBar />
      </div>
      
      {/* Main content area with sidebar */}
      <div className="flex flex-1 overflow-hidden relative z-40" style={{ marginTop: 90, position: 'relative', zIndex: 40, height: 'calc(100vh - 90px)' }}>
        {/* Sidebar - only render when authenticated and on medium screens and larger */}
        {!isAuthPage && user && (
          <div className="hidden md:block flex-none h-full" style={{ height: 'calc(100vh - 90px)', overflow: 'auto', position: 'fixed', top: '90px', left: 0, width: '16rem', zIndex: 45 }}>
            <SideBar />
          </div>
        )}
        
        {/* Main content with scrolling */}
        <main 
          className={`flex-1 overflow-y-auto scrollbar-hide`}
          style={{ 
            zIndex: 30, 
            height: 'calc(100vh - 90px)', 
            position: 'relative', 
            marginTop: 0,
            marginLeft: user ? '16rem' : 0
          }}
        >
          <div className="w-full min-h-full">
            {children}
          </div>
        </main>
      </div>
      {showChat && (auth.currentUser || user?.isTelegramUser) ? (
        <N8nChatWidget key={`chat-${user?.uid || 'telegram'}`} />
      ) : null}
    </div>
  );
}
