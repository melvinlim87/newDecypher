import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { handleLogout } from '../utils/auth';
import { LogOut, User, LogIn, Menu, X, MessageSquare, Code2, ChevronDown, ChevronUp, History, Brain, LineChart } from 'lucide-react';
import { HistoryList } from './HistoryDropdown';
import { TokenDisplay } from './TokenDisplay';
import { ThemeToggle, useToggleState } from './ThemeToggle';
import { useTheme } from '../contexts/ThemeContext';
import styles from './NavBar.module.css';
import { useAnalysisContext } from '../context/AnalysisContext';
import { useAuth } from '../hooks/useAuth';

export function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme } = useTheme();
  // Get the toggle state for potential future use
  const _isToggled = useToggleState();
  const isAuthPage = false; // Changed to always show navbar
  const { resetAnalysis } = useAnalysisContext();
  const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(false);
  const [isEAGeneratorExpanded, setIsEAGeneratorExpanded] = useState(false);
  const isLoginPage = location.pathname === '/login';
  const isRegisterPage = location.pathname === '/register';

  const onLogout = async () => {
    // Handle both Firebase and Telegram logout
    if (user?.isTelegramUser) {
      // Clear Telegram session
      sessionStorage.removeItem('telegramUser');
      // Force page reload to ensure clean state
      window.location.href = '/login';
    } else {
      // Firebase logout
      await handleLogout();
    }
    setIsMenuOpen(false);
  };
  
  // Handler for new analysis - resets context and navigates
  const handleNewAnalysis = () => {
    resetAnalysis();
    navigate('/ai-chat', { replace: true, state: { newSession: true } });
    setIsMenuOpen(false);
  };

  // Handler for new EA - navigates with clean state
  const handleNewEA = () => {
    navigate('/ea-generator', { replace: true, state: { newSession: true } });
    setIsMenuOpen(false);
  };

  // We don't need the navbarThemeClass anymore as we're using the metallic classes directly

  return (
    <>
      <nav className="relative w-full z-50 metallic-gradient metallic-border metallic-glow backdrop-blur-xl shadow-lg scrollbar-hide" style={{ height: '80px', borderBottom: '1px solid rgba(0, 133, 215, 0.3)' }}>
        <div className="w-full h-full">
          <div className="navbar-container flex justify-between items-center h-full px-4 md:px-8 lg:px-12">
            {/* Logo and Navigation Links */}
            <div className="flex items-center gap-4 md:gap-6">
              {/* Brand Logo and Name */}
              <Link to="/" className="flex items-center gap-2 cursor-pointer z-10 relative hover:opacity-80 transition-opacity duration-200">
                <div className="navbar-logo flex items-center justify-center w-10 h-10 rounded-full border-2 shadow-md transition-all duration-300 hover:scale-105 pointer-events-auto">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <polygon points="16,3 29,10.5 29,25.5 16,33 3,25.5 3,10.5" stroke="currentColor" strokeWidth="2" className="navbar-logo text-white"/>
                    <rect x="13" y="11" width="6" height="10" rx="2" className="navbar-logo-inner fill-white"/>
                  </svg>
                </div>
                <div className="flex flex-col justify-center leading-tight">
                  <span className="navbar-title text-2xl font-bold tracking-widest drop-shadow-lg bg-clip-text text-transparent bg-gradient-to-r from-slate-200 via-custom-blue to-slate-200 pointer-events-auto">
                    DECYPHERS
                  </span>
                  <span className="text-xs tracking-wider text-white opacity-90" style={{ marginTop: '-5px', textShadow: '0 0 5px rgba(0, 229, 255, 0.3)' }}>
                    Your AI Trading Insights
                  </span>
                </div>
              </Link>
              
              {/* Navigation Links */}
              <div className="flex items-center space-x-4">
                
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-lg metallic-gradient metallic-border metallic-glow nav-link-hover"
              >
                {isMenuOpen ? (
                  <X className="w-6 h-6 text-white" />
                ) : (
                  <Menu className="w-6 h-6 text-white" />
                )}
              </button>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              {/* Theme Toggle */}
              <div className="cursor-pointer z-10 relative pointer-events-auto">
                <ThemeToggle />
              </div>
              
              {/* Conditional rendering based on current page and auth status */}
              {(() => {
                const isLoginPage = location.pathname === '/login';
                const isRegisterPage = location.pathname === '/register';
                
                if (user) {
                  return (
                    <>
                      <span className={`${styles['navbar-token']} cursor-pointer z-10 relative`}><TokenDisplay /></span>
                      <button
                        onClick={() => navigate('/profile')}
                        className="flex items-center px-4 py-3 rounded-lg nav-link-hover"
                        style={{
                          background: 'rgba(0, 133, 215, 0.2)',
                          boxShadow: '0 0 15px rgba(0, 133, 215, 0.2)',
                          border: '1px solid rgba(0, 133, 215, 0.3)',
                          zIndex: 99999,
                          position: 'relative'
                        }}
                      >
                        <User className="w-5 h-5 text-[#00A9E0] mr-2" />
                        <span className="text-white font-medium truncate max-w-[120px]">
                          {user.displayName || user.email || (user.isTelegramUser ? 'Telegram User' : 'Profile')}
                        </span> 
                      </button>
                      <button
                        onClick={onLogout}
                        className="flex items-center px-4 py-3 rounded-lg nav-link-hover"
                        style={{
                          background: 'rgba(0, 133, 215, 0.2)',
                          boxShadow: '0 0 15px rgba(0, 133, 215, 0.2)',
                          border: '1px solid rgba(0, 133, 215, 0.3)',
                          zIndex: 99999,
                          position: 'relative'
                        }}
                      >
                        <LogOut className="w-5 h-5 text-[#00A9E0] mr-2" />
                        <span className="text-white font-medium">Logout</span>
                      </button>
                    </>
                  );
                } else {
                  return (
                    <div className="flex items-center space-x-4">
                      {!isRegisterPage && (
                        <Link 
                          to="/register" 
                          className="flex items-center px-4 py-3 rounded-lg metallic-gradient metallic-border metallic-glow nav-link-hover"
                        >
                          <User className="w-5 h-5 text-white mr-2" />
                          <span className="text-white font-medium">Sign Up</span>
                        </Link>
                      )}
                      {!isLoginPage && (
                        <Link 
                          to="/login" 
                          className="flex items-center px-4 py-3 rounded-lg metallic-gradient metallic-border metallic-glow nav-link-hover"
                        >
                          <LogIn className="w-5 h-5 text-white mr-2" />
                          <span className="text-white font-medium">Login</span>
                        </Link>
                      )}
                    </div>
                  );
                }
              })()}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu, show/hide based on menu state */}
      {isMenuOpen && (
        <div className="md:hidden absolute left-0 right-0 top-full z-50 max-h-[calc(100vh-119px)] overflow-y-auto scrollbar-hide shadow-lg">
          {/* Backdrop overlay to close menu when clicking outside */}
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setIsMenuOpen(false)} style={{ top: '7.5rem' }}></div>
          <div className="relative z-50 px-4 pt-4 pb-6 space-y-3 rounded-b-lg metallic-gradient metallic-border metallic-glow"
          >
            {/* Theme Toggle and Token Display in mobile menu */}
            <div className="py-2 flex items-center mb-2">
              <div className="flex items-center gap-2">
                <ThemeToggle />
                {user && <TokenDisplay />}
              </div>
            </div>

            {user ? (
              <>
                <button
                  onClick={() => navigate('/profile')}
                  className="flex items-center w-full px-4 py-3 rounded-lg metallic-gradient metallic-border metallic-glow nav-link-hover"
                  style={{
                    background: 'rgba(79, 70, 229, 0.2)',
                    boxShadow: '0 0 15px rgba(99, 102, 241, 0.2)',
                    border: '1px solid rgba(99, 102, 241, 0.3)'
                  }}
                >
                  <User className="w-5 h-5 text-[#00A9E0] mr-2" />
                  <span className="flex-grow text-left text-white font-medium">
                    {user.displayName || user.email || (user.isTelegramUser ? 'Telegram User' : 'Profile')}
                  </span>
                </button>
                
                {/* Mobile Sidebar Navigation - Analyzer */}
                <div className={`mt-4 border-t border-gray-700 pt-4 ${isLoginPage || isRegisterPage ? 'hidden' : ''}`}>
                  <h3 className="px-2 py-1 text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-slate-200 via-custom-blue to-slate-200">
                    Navigation
                  </h3>
                  <div className="mb-2">
                    <button
                      onClick={() => setIsAnalysisExpanded(!isAnalysisExpanded)}
                      className="flex items-center w-full px-4 py-3 rounded-lg metallic-gradient metallic-border metallic-glow nav-link-hover"
                    >
                      <MessageSquare className="w-5 h-5 text-white mr-2" />
                      <span className="flex-grow text-left text-white font-medium">Analyzer</span>
                      {isAnalysisExpanded ? (
                        <ChevronUp className="w-4 h-4 text-white" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-white" />
                      )}
                    </button>
                    
                    {isAnalysisExpanded && (
                      <div className="ml-4 mt-2 space-y-2 pl-1 border-l-2 border-gray-700">
                        <button
                          onClick={handleNewAnalysis}
                          className="block w-full text-left px-4 py-2 text-sm rounded-lg metallic-gradient metallic-border metallic-glow nav-link-hover"
                        >
                          <span className="text-white font-medium">New Analysis</span>
                        </button>
                        
                        {/* History List for Analyzer */}
                        <HistoryList
                          isCollapsed={false}
                          isExpanded={true}
                          onToggle={() => {}}
                          historyType="market-analysis"
                          label="Recent Analyses"
                          compact={true}
                        />
                        
                        <Link 
                          to="/analysis-history"
                          className="block w-full text-left px-4 py-2 text-sm rounded-lg metallic-gradient metallic-border metallic-glow nav-link-hover"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <div className="flex items-center">
                            <History className="w-4 h-4 text-white mr-2" />
                            <span className="text-white font-medium">Analysis History</span>
                          </div>
                        </Link>
                      </div>
                    )}
                  </div>
                  
                  {/* Mobile Sidebar Navigation - EA Generator */}
                  <div className="mb-2">
                    <button
                      onClick={() => setIsEAGeneratorExpanded(!isEAGeneratorExpanded)}
                      className="flex items-center w-full px-4 py-3 rounded-lg metallic-gradient metallic-border metallic-glow nav-link-hover"
                    >
                      <Code2 className="w-5 h-5 text-white mr-2" />
                      <span className="flex-grow text-left text-white font-medium">EA Generator</span>
                      {isEAGeneratorExpanded ? (
                        <ChevronUp className="w-4 h-4 text-white" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-white" />
                      )}
                    </button>
                    
                    {isEAGeneratorExpanded && (
                      <div className="ml-4 mt-2 space-y-2 pl-1 border-l-2 border-gray-700">
                        <button
                          onClick={handleNewEA}
                          className="block w-full text-left px-4 py-2 text-sm rounded-lg metallic-gradient metallic-border metallic-glow nav-link-hover"
                        >
                          <span className="text-white font-medium">Generate New EA</span>
                        </button>
                        
                        {/* History List for EA Generator */}
                        <HistoryList
                          isCollapsed={false}
                          isExpanded={true}
                          onToggle={() => {}}
                          historyType="ea-generator"
                          label="Recent EAs"
                          compact={true}
                        />
                        
                        <Link 
                          to="/ea-history"
                          className="block w-full text-left px-4 py-2 text-sm rounded-lg metallic-gradient metallic-border metallic-glow nav-link-hover"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <div className="flex items-center">
                            <History className="w-4 h-4 text-white mr-2" />
                            <span className="text-white font-medium">EA History</span>
                          </div>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={onLogout}
                  className="flex items-center w-full px-4 py-3 rounded-lg metallic-gradient metallic-border metallic-glow nav-link-hover mt-4"
                  style={{
                    background: 'rgba(0, 133, 215, 0.2)',
                    boxShadow: '0 0 15px rgba(0, 133, 215, 0.2)',
                    border: '1px solid rgba(0, 133, 215, 0.3)'
                  }}
                >
                  <LogOut className="w-5 h-5 text-[#00A9E0] mr-2" />
                  <span className="text-white font-medium">Logout</span>
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-3">
                {!isRegisterPage && (
                  <Link 
                    to="/register"  
                    className="flex items-center justify-center px-4 py-3 rounded-lg metallic-gradient metallic-border metallic-glow nav-link-hover"
                  >
                    <User className="w-5 h-5 text-white mr-2" />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-200 via-custom-blue to-slate-200 font-medium">Sign Up</span>
                  </Link>
                )}
                {!isLoginPage && (
                  <Link 
                    to="/login" 
                    className="flex items-center justify-center px-4 py-3 rounded-lg metallic-gradient metallic-border metallic-glow nav-link-hover"
                  >
                    <LogIn className="w-5 h-5 text-white mr-2" />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-200 via-custom-blue to-slate-200 font-medium">Login</span>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
