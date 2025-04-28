import React, { useState, useEffect, useRef } from 'react';
import { Coins, Plus, Loader2, CreditCard, History, Users, Gift, Receipt } from 'lucide-react';
import { auth, database } from '../lib/firebase';
import { ref, onValue, get, set, DatabaseReference } from 'firebase/database';
import { TokenPurchaseModal } from './TokenPurchaseModal';
import { ReferralModal } from './ReferralModal';
import { FreeTokenModal } from './FreeTokenModal';
import { useNavigate } from 'react-router-dom';
import { generateUniqueReferralCode } from '../utils/referralUtils';
import { useTheme } from '../contexts/ThemeContext';

// Add a style tag for token number styling and navbar elements
const tokenStyle = document.createElement('style');
tokenStyle.innerHTML = `
  /* Target all text elements */
  .navbar-token, .text-white, .navbar-title, nav span, nav button span, nav a span, 
  .navbar-profile span, .navbar-logout span, .token-display span,
  .profile-page h1, .profile-page h2, .profile-page p, .profile-page span,
  .profile-text, .profile-page .token-display div {
    color: white !important;
    text-shadow: 0 0 5px rgba(0, 229, 255, 0.5) !important;
  }
  
  /* Target all icons */
  .lucide-coins, .lucide-log-out, .lucide-user, nav svg,
  .profile-page svg, .profile-page .lucide-user, .profile-page .lucide-mail,
  .profile-page .lucide-calendar, .profile-page .lucide-phone,
  .profile-page .lucide-credit-card, .profile-page .lucide-users,
  .profile-page .lucide-receipt, .profile-page .lucide-gift {
    color: #00A9E0 !important;
    filter: drop-shadow(0 0 5px rgba(0, 229, 255, 0.5)) !important;
  }
  
  /* Force override for specific elements */
  #root nav *, .navbar--light *, .navbar--dark *,
  .profile-page *, .profile-page .token-display * {
    color: white !important;
  }
  
  /* Dark mode adjustments */
  body.dark .profile-page *, body.dark .profile-page .token-display * {
    color: #ffffff !important;
    text-shadow: 0 2px 4px #6D7278 !important;
  }
  
  body.dark .profile-page svg, body.dark .profile-page .lucide-user,
  body.dark .profile-page .lucide-mail, body.dark .profile-page .lucide-calendar,
  body.dark .profile-page .lucide-phone, body.dark .profile-page .lucide-credit-card,
  body.dark .profile-page .lucide-users, body.dark .profile-page .lucide-receipt,
  body.dark .profile-page .lucide-gift {
    color: #C9CCCF !important;
    filter: drop-shadow(0 2px 4px #6D7278) !important;
  }
`;
document.head.appendChild(tokenStyle);

interface TokenDisplayProps {
  variant?: 'dropdown' | 'full';
  className?: string;
}

export function TokenDisplay({ variant = 'dropdown', className = '' }: TokenDisplayProps) {
  const navigate = useNavigate();
  const [tokens, setTokens] = useState<number | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // Error state for handling token loading failures - used in setupTokensListener.handleError
  const [_error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showFreeTokenModal, setShowFreeTokenModal] = useState(false);
  const [referralCount, setReferralCount] = useState(0);
  const { theme } = useTheme();
  
  // Custom style to ensure token numbers are white and match the navbar theme
  const tokenNumberStyle = theme === 'light' ? {
    color: '#00A9E0',
    textShadow: '0 0 5px rgba(0, 229, 255, 0.5)'
  } : {
    color: '#C9CCCF',
    textShadow: '0 2px 4px #6D7278'
  };


  const dropdownRef = useRef<HTMLDivElement>(null);
  const tokenRefCleanup = useRef<(() => void) | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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
          isTelegramUser: true
        };
      } catch (error) {
        console.error('Error parsing Telegram user:', error);
        return null;
      }
    }
    return null;
  };

  useEffect(() => {
    let isMounted = true;
    let tokensRef: DatabaseReference | null = null;

    const setupTokensListener = async (uid: string) => {
      if (!isMounted) return;

      setLoading(true);

      if (tokenRefCleanup.current) {
        tokenRefCleanup.current();
        tokenRefCleanup.current = null;
      }

      tokensRef = ref(database, `users/${uid}`);
      let retryCount = 0;

      const handleSnapshot = (snapshot: any) => {
        if (!isMounted) return;

        try {
          const userData = snapshot.val();
          if (userData) {
            setTokens(userData.tokens || 0);
            setReferralCount(userData.referrals?.count || 0);
            
            // Create referral code if it doesn't exist
            if (!userData.referralCode) {
              const userRef = ref(database, `users/${uid}`);
              generateUniqueReferralCode(uid).then(code => {
                if (code) {
                  set(userRef, {
                    ...userData,
                    referralCode: code
                  });
                }
              });
            }
          } else {
            setTokens(0);
          }
          setLoading(false);
          setError(null);
        } catch (error) {
          handleError(error);
        }
      };

      const handleError = (error: any) => {
        if (!isMounted) return;
        
        console.error("Error fetching tokens:", error);
        setError("Failed to load tokens");
        setLoading(false);
        
        // Retry logic for transient errors
        if (retryCount < 3) {
          retryCount++;
          setTimeout(() => {
            if (isMounted && tokensRef) {
              onValue(tokensRef, handleSnapshot, handleError);
            }
          }, 1000 * retryCount);
        }
      };

      try {
        const unsubscribe = onValue(tokensRef, handleSnapshot, handleError);
        tokenRefCleanup.current = unsubscribe;
      } catch (error) {
        handleError(error);
      }
    };

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setupTokensListener(user.uid);
      } else {
        // Check for Telegram login
        const telegramUser = checkTelegramLogin();
        if (telegramUser && telegramUser.uid) {
          setupTokensListener(telegramUser.uid);
        } else if (isMounted) {
          setTokens(null);
          setLoading(false);
        }
      }
    });

    // Check for Telegram login on initial load
    if (!auth.currentUser) {
      const telegramUser = checkTelegramLogin();
      if (telegramUser && telegramUser.uid) {
        setupTokensListener(telegramUser.uid);
      }
    }

    return () => {
      isMounted = false;
      unsubscribeAuth();
      if (tokenRefCleanup.current) {
        tokenRefCleanup.current();
      }
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleViewHistory = () => {
    navigate('/purchase-history');
    setIsDropdownOpen(false);
  };

  if (variant === 'full') {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className={`rounded-lg p-4 ${theme === 'dark' ? 'bg-gray-800' : ''}`} style={{
          background: `linear-gradient(
            135deg,
            rgba(226, 232, 240, 0.02) 0%,
            rgba(203, 213, 225, 0.03) 25%,
            rgba(226, 232, 240, 0.02) 50%,
            rgba(203, 213, 225, 0.03) 75%,
            rgba(226, 232, 240, 0.02) 100%
          )`,
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0 8px 32px rgba(203, 213, 225, 0.05), inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(5px)'
        }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold" style={tokenNumberStyle}>Available Tokens</h2>
              <div className="flex items-center gap-2 mt-2">
                <Coins size={24} className="token-icon" style={tokenNumberStyle} />
                <div className="text-xs" style={tokenNumberStyle}>
                  <p>
                    You can analyze {Math.floor((tokens || 0) / 10)} more charts
                  </p>
                </div>
              </div>
            </div>
            <div className="text-2xl font-bold navbar-token" style={tokenNumberStyle}>{tokens || 0}</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-20">
            <button
              onClick={() => setShowFreeTokenModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors relative z-20 profile-button" 
              style={{
                background: 'rgba(79, 70, 229, 0.2)',
                boxShadow: '0 0 15px rgba(99, 102, 241, 0.2)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                fontWeight: 'bold'
              }}
            >
              <Users size={20} style={{color: '#00A9E0', filter: 'drop-shadow(0 0 5px rgba(0, 229, 255, 0.5))'}} />
              <span style={tokenNumberStyle}>Get Free Tokens</span>
              {referralCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full" style={theme === 'light' ? {
                  background: 'rgba(0, 169, 224, 0.6)',
                  boxShadow: '0 0 5px rgba(0, 229, 255, 0.5)',
                  color: '#E3E5E7'
                } : {
                  background: 'rgba(109, 114, 120, 0.6)',
                  boxShadow: '0 0 5px rgba(109, 114, 120, 0.5)',
                  color: '#C9CCCF'
                }}>
                  {referralCount}/5
                </span>
              )}
            </button>
            <button
              onClick={() => setShowPurchaseModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors relative z-20 profile-button" 
              style={{
                background: 'rgba(79, 70, 229, 0.2)',
                boxShadow: '0 0 15px rgba(31, 41, 55, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                fontWeight: 'bold'
              }}
            >
              <CreditCard size={20} style={{color: '#00A9E0', filter: 'drop-shadow(0 0 5px rgba(0, 229, 255, 0.5))'}} />
              <span style={tokenNumberStyle}>Buy Tokens</span>
            </button>
            <button
              onClick={handleViewHistory}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors relative z-20 profile-button" 
              style={{
                background: 'rgba(79, 70, 229, 0.2)',
                boxShadow: '0 0 15px rgba(31, 41, 55, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                fontWeight: 'bold'
              }}
            >
              <Receipt size={20} style={{color: '#00A9E0', filter: 'drop-shadow(0 0 5px rgba(0, 229, 255, 0.5))'}} />
              <span style={tokenNumberStyle}>Purchase History</span>
            </button>
          </div>
        </div>

        <TokenPurchaseModal
          isOpen={showPurchaseModal}
          onClose={() => setShowPurchaseModal(false)}
        />
        
        <FreeTokenModal
          isOpen={showFreeTokenModal}
          onClose={() => setShowFreeTokenModal(false)}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative flex items-center gap-1.5 ${variant === 'dropdown' ? 'cursor-pointer' : ''} ${className} token-display`}
      onClick={variant === 'dropdown' ? () => setIsDropdownOpen(prev => !prev) : undefined}
      ref={dropdownRef}
    >
      <button
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg shadow-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-400 profile-button cursor-pointer z-10 relative hover:opacity-90 active:scale-95" 
        style={{
         background: 'rgba(0, 133, 215, 0.2)',
          boxShadow: '0 0 15px rgba(99, 102, 241, 0.2)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          fontWeight: 'bold',
          pointerEvents: 'auto'
        }}
      >
       <Coins size={20} className="token-icon" style={{color: '#00A9E0', filter: 'drop-shadow(0 0 5px rgba(0, 229, 255, 0.5))'}} />
        {variant === 'full' ? (
          <div className="flex flex-col">
            <span className="text-xs navbar-token" style={tokenNumberStyle}>Available Tokens</span>
            <span className="text-lg font-bold navbar-token" style={tokenNumberStyle}>{tokens || 0}</span>
          </div>
        ) : (
          <span className="font-medium navbar-token text-white" style={{color: '#ffffff !important'}}>{tokens || 0}</span>
        )}
      </button>

      {isDropdownOpen && (
        <div className={`absolute right-0 top-full mt-2 w-64 rounded-lg shadow-lg py-2 z-50 profile-card`}
          style={theme === 'light' ? {
           background: 'rgba(0, 133, 215, 0.2)',
            color: '#E3E5E7',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(5px)'
          } : {
           background: 'rgba(0, 133, 215, 0.2)', 
            color: '#C9CCCF',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(5px)'
          }}
        >
          <div className="px-4 py-2">
            <div className="text-sm navbar-token" style={tokenNumberStyle}>Available Tokens</div>
            <div className="text-2xl font-bold navbar-token" style={tokenNumberStyle}>{tokens || 0}</div>
          </div>

          <div className="border-t my-2" style={theme === 'light' ? {
            borderColor: 'rgba(255, 255, 255, 0.05)'
          } : {
            borderColor: 'rgba(255, 255, 255, 0.05)'
          }} />

          <button
            onClick={() => {
              setShowFreeTokenModal(true);
              setIsDropdownOpen(false);
            }}
            className="w-full px-4 py-2 text-left transition-colors flex items-center gap-2 token-button"
            style={theme === 'light' ? {
              borderLeft: '2px solid transparent',
              borderImage: 'linear-gradient(to bottom, transparent, rgba(99, 102, 241, 0.3), transparent) 1 100%'
            } : {
              borderLeft: '2px solid transparent',
              borderImage: 'linear-gradient(to bottom, transparent, rgba(99, 102, 241, 0.3), transparent) 1 100%'
            }}
          >
           <Users size={16} className="token-icon" style={{color: '#00A9E0', filter: 'drop-shadow(0 0 5px rgba(0, 229, 255, 0.5))'}} />
            <span className="navbar-token" style={tokenNumberStyle}>Get Free Tokens</span>
            {referralCount > 0 && (
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full navbar-token" style={theme === 'light' ? {
                background: 'rgba(0, 169, 224, 0.6)',
                boxShadow: '0 0 5px rgba(0, 229, 255, 0.5)',
                color: '#E3E5E7'
              } : {
                background: 'rgba(109, 114, 120, 0.6)',
                boxShadow: '0 0 5px rgba(109, 114, 120, 0.5)',
                color: '#C9CCCF'
              }}>
                {referralCount}/5
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setShowPurchaseModal(true);
              setIsDropdownOpen(false);
            }}
            className="w-full px-4 py-2 text-left transition-colors flex items-center gap-2 token-button"
            style={theme === 'light' ? {
              borderLeft: '2px solid transparent',
              borderImage: 'linear-gradient(to bottom, transparent, rgba(99, 102, 241, 0.3), transparent) 1 100%'
            } : {
              borderLeft: '2px solid transparent',
              borderImage: 'linear-gradient(to bottom, transparent, rgba(99, 102, 241, 0.3), transparent) 1 100%'
            }}
          >
           <CreditCard size={16} className="token-icon" style={{color: '#00A9E0', filter: 'drop-shadow(0 0 5px rgba(0, 229, 255, 0.5))'}} />
            <span className="navbar-token" style={tokenNumberStyle}>Buy Tokens</span>
          </button>

          <button
            onClick={handleViewHistory}
            className="w-full px-4 py-2 text-left transition-colors flex items-center gap-2 token-button"
            style={theme === 'light' ? {
              borderLeft: '2px solid transparent',
              borderImage: 'linear-gradient(to bottom, transparent, rgba(99, 102, 241, 0.3), transparent) 1 100%'
            } : {
              borderLeft: '2px solid transparent',
              borderImage: 'linear-gradient(to bottom, transparent, rgba(99, 102, 241, 0.3), transparent) 1 100%'
            }}
          >
           <Receipt size={16} className="token-icon" style={{color: '#00A9E0', filter: 'drop-shadow(0 0 5px rgba(0, 229, 255, 0.5))'}} />
            <span className="navbar-token" style={tokenNumberStyle}>Purchase History</span>
          </button>
        </div>
      )}

      <TokenPurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
      />
      
      <FreeTokenModal
        isOpen={showFreeTokenModal}
        onClose={() => setShowFreeTokenModal(false)}
      />
    </div>
  );
}