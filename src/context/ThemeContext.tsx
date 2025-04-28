import React, { createContext, useContext, useState, useEffect } from 'react';

type ThemeMode = 'dark' | 'light';

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize theme from localStorage or default to 'dark'
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const savedTheme = localStorage.getItem('theme');
    return (savedTheme as ThemeMode) || 'dark';
  });

  // Apply theme class to root html element and save to localStorage
  useEffect(() => {
    const html = document.documentElement;
    
    // Remove existing theme classes
    html.classList.remove('dark-theme', 'light-theme');
    
    // Add new theme class
    html.classList.add(`${theme}-theme`);
    
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
