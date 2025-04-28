import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Users, Gift, Copy, Link } from 'lucide-react';
import { auth, database } from '../lib/firebase';
import { ref, get, update, onValue } from 'firebase/database';
import { migrateCurrentUserReferralCode } from '../utils/referralMigration';
import { useTheme } from '../contexts/ThemeContext';

interface FreeTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ReferralStats {
  referralCount: number;
  totalReferrals: number;
  bonusesEarned: number;
}

const defaultReferralStats: ReferralStats = { referralCount: 0, totalReferrals: 0, bonusesEarned: 0 };

export function FreeTokenModal({ isOpen, onClose }: FreeTokenModalProps) {
  const [referralStats, setReferralStats] = useState<ReferralStats>(defaultReferralStats);
  const [referralCode, setReferralCode] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const isEffectRunningRef = useRef(true);
  const { theme } = useTheme();

  useEffect(() => {
    if (isOpen) {
      loadReferralStats();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const userRef = ref(database, `users/${auth.currentUser.uid}`);
    
    const unsubscribe = onValue(userRef, async (snapshot) => {
      if (!isEffectRunningRef.current) return;
      
      try {
        if (snapshot.exists()) {
          const data = snapshot.val();
          
          // Check if we should migrate the referral code to name-based format
          const currentReferralCode = data.referralCode;
          if (currentReferralCode) {
            const newCode = await migrateCurrentUserReferralCode();
            if (newCode) {
              // If migration returned a new code, update our local state
              setReferralCode(newCode);
            } else {
              // No migration needed, use existing code
              setReferralCode(data.referralCode);
            }
          } else {
            const safeUid = auth.currentUser?.uid || '';
            setReferralCode(data.referralCode || (safeUid ? safeUid.substring(0, 8) : 'user' + Math.random().toString(36).substring(2, 8)));
          }
          
          setReferralStats({
            referralCount: data.referralCount || 0,
            totalReferrals: data.totalReferrals || 0,
            bonusesEarned: data.bonusesEarned || 0
          });
        }
      } catch (error) {
        console.error('Error in FreeTokenModal data listener:', error);
      }
    });

    return () => {
      unsubscribe();
      isEffectRunningRef.current = false;
    };
  }, [isOpen]);

  const loadReferralStats = async () => {
    if (!auth.currentUser) return;

    try {
      const userRef = ref(database, `users/${auth.currentUser.uid}`);
      const snapshot = await get(userRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        const safeUid = auth.currentUser?.uid || '';
        setReferralCode(data.referralCode || (safeUid ? safeUid.substring(0, 8) : 'user' + Math.random().toString(36).substring(2, 8)));
        setReferralStats({
          referralCount: data.referralCount || 0,
          totalReferrals: data.totalReferrals || 0,
          bonusesEarned: data.bonusesEarned || 0
        });
      }
    } catch (error) {
      console.error('Error loading referral stats:', error);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleCopyLink = () => {
    const referralLink = `${window.location.origin}/register?ref=${referralCode}`;
    copyToClipboard(referralLink);
  };

  const handleShare = async () => {
    const referralLink = `${window.location.origin}/register?ref=${referralCode}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on LazeTrade AI Market Analyzer',
          text: 'Check out this amazing AI-powered trading analysis tool!',
          url: referralLink
        });
      } catch (error) {
        console.error('Error sharing:', error);
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="min-h-screen py-10 flex items-center justify-center p-4">
        <div ref={modalRef} className="relative w-full max-w-3xl mx-auto rounded-xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 z-[60] my-4 sm:my-10 animate-[modalPopIn_0.3s_ease-out_forwards] app-card">
          <div className="flex items-start sm:items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold app-text">
                Get Free Tokens
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Referral Section */}
            <div className="rounded-xl p-4 sm:p-5 shadow-lg app-card">
              <h3 className="text-lg sm:text-xl font-medium mb-3 sm:mb-4 app-text">
                Your Referral Link
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-2 sm:p-3 rounded-lg bg-gray-800/30 border border-white/5">
                  <div className="flex-1 truncate">
                    <code className="text-xs sm:text-sm app-text">
                      {window.location.origin}/register?ref={referralCode}
                    </code>
                  </div>
                  <button 
                    onClick={handleCopyLink}
                    className="p-1.5 sm:p-2 rounded-lg transition-colors hover:bg-gray-700/30"
                    aria-label="Copy referral link"
                  >
                    {copied ? (
                      <span className="text-xs sm:text-sm text-green-400">Copied!</span>
                    ) : (
                      <Copy className="w-4 h-4 sm:w-5 sm:h-5 app-icon" />
                    )}
                  </button>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyLink}
                    className="flex-1 flex items-center justify-center gap-1 sm:gap-2 py-1.5 sm:py-2 px-2 sm:px-4 rounded-lg app-button-secondary text-sm sm:text-base"
                  >
                    <Copy className="w-4 h-4 sm:w-5 sm:h-5 app-icon" />
                    <span className="app-text">Copy Link</span>
                  </button>
                  
                  <button
                    onClick={handleShare}
                    className="flex-1 flex items-center justify-center gap-1 sm:gap-2 py-1.5 sm:py-2 px-2 sm:px-4 rounded-lg app-button text-sm sm:text-base"
                  >
                    <Link className="w-4 h-4 sm:w-5 sm:h-5 app-icon" />
                    <span className="app-text">Share</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}