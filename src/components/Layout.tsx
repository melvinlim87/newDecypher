import { useState, useEffect } from 'react';
import { NavBar } from './NavBar';
import { SideBar } from './SideBar';
import { useLocation } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { N8nChatWidget } from './N8nChatWidget';
import { useTheme } from '../contexts/ThemeContext';
import { useSidebarState } from '../contexts/SidebarContext';
import { VerticalCircuitLines } from './VerticalCircuitLines';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  // Remove isAuthPage check to always show navbar
  const isAuthPage = false;
  const { isCollapsed } = useSidebarState();
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
      <div className="flex-none relative z-10">
        <NavBar />
      </div>
      
      {/* Main content area with sidebar */}
      <div className="flex flex-1 overflow-hidden relative z-10">
        {/* Sidebar - only render when authenticated and on medium screens and larger */}
        {!isAuthPage && user && (
          <div className="hidden md:block flex-none">
            <SideBar />
          </div>
        )}
        
        {/* Main content with scrolling */}
        <main 
          className={`flex-1 overflow-y-auto scrollbar-hide ${user ? (isCollapsed ? 'px-4 md:px-8 lg:px-12' : 'px-4 md:px-8 lg:px-12') : 'px-4 md:px-8 lg:px-12'}`}
          style={{ zIndex: 10 }}
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
