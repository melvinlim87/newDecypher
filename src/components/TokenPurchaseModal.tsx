import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, CreditCard, Loader2, AlertCircle } from 'lucide-react';
import { STRIPE_PRICES, createCheckoutSession } from '../lib/stripe';
import { auth, database } from '../lib/firebase';
import { useTheme } from '../contexts/ThemeContext';

interface TokenPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TokenPurchaseModal({ isOpen, onClose }: TokenPurchaseModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current === e.target) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const checkTelegramLogin = () => {
    const telegramUser = sessionStorage.getItem('telegramUser');
    if (telegramUser) {
      try {
        const parsedUser = JSON.parse(telegramUser);
        return {
          uid: parsedUser.id,
          displayName: parsedUser.first_name ? `${parsedUser.first_name} ${parsedUser.last_name || ''}`.trim() : parsedUser.username,
          email: '',  // Telegram doesn't provide email
          isTelegramUser: true
        };
      } catch (error) {
        console.error('Error parsing Telegram user:', error);
        return null;
      }
    }
    return null;
  };

  const handlePurchase = async (priceId: string) => {
    const currentUser = auth.currentUser || checkTelegramLogin();
    
    if (!currentUser) {
      setError('You must be logged in to purchase tokens');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // For Telegram users, we need to handle the data differently
      let customerName = '';
      let customerEmail = '';
      
      if (currentUser.isTelegramUser) {
        // For Telegram users, use displayName from our custom object
        customerName = currentUser.displayName || '';
        // We don't have email for Telegram users typically
      } else {
        // For Firebase users
        customerName = currentUser.displayName || '';
        customerEmail = currentUser.email || '';
      }
      
      // Get customer information from the current user
      const customerInfo = {
        name: customerName,
        email: customerEmail
      };
      
      console.log('Sending customer info to checkout:', customerInfo);

      await createCheckoutSession(priceId, currentUser.uid, customerInfo);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to initiate purchase');
    } finally {
      setIsLoading(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xl">
      <div ref={modalRef} className="fixed inset-0" onClick={onClose} />
      
      <div className="min-h-screen py-10 flex items-start justify-center p-4">
        <div ref={contentRef} className="relative w-full max-w-3xl mx-auto rounded-xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 z-[60] my-4 sm:my-10 animate-[modalPopIn_0.3s_ease-out_forwards] app-card">
        <div className="flex items-start sm:items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold app-text">
              Purchase Tokens
            </h2>
            <p className="text-sm mt-2 app-text">
              Choose the perfect token package for your needs
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-2 hover:bg-gray-800/30 rounded-lg transition-colors group z-[70]"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6 app-icon" />
          </button>
        </div>

        {error && (
          <div className="p-3 sm:p-4 rounded-lg flex items-center gap-2 sm:gap-3 text-sm sm:text-base bg-red-900/30 text-red-300">
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-red-300" />
            <p>{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(STRIPE_PRICES).map(([key, package_]) => {
            const hasBonus = key === 'PRO' || key === 'PREMIUM';
            const bonusTokens = key === 'PRO' ? 1000 : key === 'PREMIUM' ? 5000 : 0;
            
            return (
              <button
                key={key}
                onClick={() => handlePurchase(package_.id)}
                disabled={isLoading}
                className={`relative flex flex-col justify-between rounded-xl p-4 sm:p-5 transition-all app-card ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5'
                } ${selectedPackage === key ? 'border-2 border-indigo-500' : ''}`}
              >
                <div className="relative space-y-3 sm:space-y-4">
                  <h3 className="text-lg sm:text-xl font-bold app-text">
                    {package_.tokens.toLocaleString()} Tokens
                  </h3>
                  {hasBonus && (
                    <div className="text-xs inline-block px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 app-text">
                      Best Value
                    </div>
                  )}
                  <div className="flex items-baseline gap-1 mt-1"> 
                    <div className="text-xl sm:text-2xl font-bold mb-1 app-text">
                      ${package_.price.toFixed(2)}
                    </div>
                    <span className="text-xs app-text">USD</span>
                  </div>
                  <div className="mt-2">
                    <div className="text-sm app-text">
                      ${(package_.price / package_.tokens).toFixed(5)} per token
                    </div>
                    {hasBonus && (
                      <div className="text-xs mt-1 flex items-center gap-1 app-text">
                        <div className="inline-block w-2 h-2 rounded-full bg-indigo-500/20 border border-indigo-500/30"></div>
                        Includes {bonusTokens.toLocaleString()} bonus tokens!
                      </div>
                    )}
                  </div>
                  <div className="text-xs mt-4 app-text opacity-70">
                    Good for approximately {package_.tokens.toLocaleString()} tokens of analysis or chat
                    {key !== 'BASIC' && ' (includes bonus tokens!)'}
                  </div>
                  <div className="flex items-center gap-2 text-xs pt-2 app-text">
                    <CreditCard className="h-4 w-4 app-icon" />
                    <span>Secure payment</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <p className="text-center text-xs sm:text-sm pt-2 sm:pt-4 app-text opacity-70">
          Secure payment powered by Stripe
        </p>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-xl animate-in fade-in">
            <div className="flex items-center space-x-2">
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin app-icon" />
              <span className="text-sm sm:text-base app-text">Processing...</span>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}