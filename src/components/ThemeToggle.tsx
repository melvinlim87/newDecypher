import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { FaSun, FaMoon } from 'react-icons/fa';

// Custom event for theme toggle state
const THEME_TOGGLE_EVENT = 'themeToggleChanged';

// Create a custom event to communicate toggle state
export const emitToggleEvent = (isToggled: boolean) => {
  const event = new CustomEvent(THEME_TOGGLE_EVENT, { detail: { isToggled } });
  document.dispatchEvent(event);
};

// Hook to listen for toggle events
export const useToggleState = () => {
  const [isToggled, setIsToggled] = useState(false);
  
  useEffect(() => {
    const handleToggleChange = (event: any) => {
      setIsToggled(event.detail.isToggled);
    };
    
    document.addEventListener(THEME_TOGGLE_EVENT, handleToggleChange);
    return () => {
      document.removeEventListener(THEME_TOGGLE_EVENT, handleToggleChange);
    };
  }, []);
  
  return isToggled;
};

// Original ThemeToggle component (hidden)
const OriginalThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button
      onClick={toggleTheme}
      className={`hidden flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
        theme === 'dark'
          ? 'bg-gray-800 hover:bg-gray-700 text-yellow-300'
          : 'bg-blue-100 hover:bg-blue-200 text-gray-800' // Changed from text-blue-600
      }`}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? <FaSun className="w-5 h-5" /> : <FaMoon className="w-5 h-5" />}
    </button>
  );
};

// New ThemeToggle component - standalone toggle switch that emits events
export const ThemeToggle: React.FC = () => {
  // Use local state instead of theme context
  const [isToggled, setIsToggled] = useState(false);
  const { theme } = useTheme(); // Only for initial styling reference
  
  // Toggle function that affects the local state and emits an event
  const handleToggle = () => {
    const newToggleState = !isToggled;
    setIsToggled(newToggleState);
    emitToggleEvent(newToggleState);
  };
  
  return (
    <div
      onClick={handleToggle}
      className={`relative flex items-center w-14 h-7 rounded-full cursor-pointer transition-all duration-300 border shadow-md z-10 hover:opacity-90 active:scale-95`}
      style={isToggled ? {
        background: 'linear-gradient(90deg, #B0B4B9 0%, #D3D6D9 100%)',
        border: '1.5px solid #B0B4B9',
        boxShadow: '0 1px 8px 0 #B0B4B9, 0 1.5px 0 #6D7278',
        pointerEvents: 'auto'
      } : {
        background: 'linear-gradient(90deg, #0F91C9 0%, #00A9E0 100%)',
        border: '1.5px solid #BFC3C7',
        boxShadow: '0 1px 8px 0 #0F91C9, 0 1.5px 0 #BFC3C7',
        pointerEvents: 'auto'
      }}
      aria-label="Toggle switch"
      title="Toggle switch"
    >
      {/* Background icons - switched positions */}
      <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
        <FaMoon className={`w-3.5 h-3.5 text-white`} />
        <FaSun className={`w-3.5 h-3.5 text-white`} />
      </div>
      
      {/* Toggle knob - updated for new icon positions with better contrast */}
      <div 
        className={`absolute w-5 h-5 rounded-full transition-all duration-300 transform ${isToggled ? 'translate-x-8' : 'translate-x-1'} shadow-md flex items-center justify-center`}
        style={isToggled ? {
          background: '#424242',
          boxShadow: '0 0 5px 1px rgba(255, 255, 255, 0.3)'
        } : {
          background: '#ffffff',
          boxShadow: '0 0 5px 1px rgba(0, 229, 255, 0.5)'
        }}
      >
        {isToggled ? 
          <FaSun className="w-3 h-3 text-yellow-300" /> : 
          <FaMoon className="w-3 h-3 text-gray-600" />}
      </div>
    </div>
  );
};

export default ThemeToggle;
