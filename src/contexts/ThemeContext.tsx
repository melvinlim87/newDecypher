import React, { createContext, useState, useContext, useEffect, FC, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isThemeLoaded: boolean;
}

interface ThemeProviderProps {
  children: ReactNode;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === null) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export const ThemeProvider: FC<ThemeProviderProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);
  const [theme, setTheme] = useState<Theme>('dark'); // Default to dark theme

  // Load theme from localStorage on initial render
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme && (savedTheme === 'dark' || savedTheme === 'light')) {
      setTheme(savedTheme);
    }
    setIsThemeLoaded(true);
  }, []);

  // Apply theme whenever it changes
  useEffect(() => {
    if (!isThemeLoaded) return;
    
    // Save to localStorage
    localStorage.setItem('theme', theme);
    
    // Apply the correct class to the body
    if (theme === 'light') {
      document.body.classList.add('light');
      document.body.classList.remove('dark');
    } else {
      document.body.classList.add('dark');
      document.body.classList.remove('light');
    }
    
  }, [theme, isThemeLoaded]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  // Only render children when theme is loaded
  if (!isThemeLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        {/* Simple loading indicator */}
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isThemeLoaded }}>
      {children}
    </ThemeContext.Provider>
  );
};
