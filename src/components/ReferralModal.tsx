import React, { useState, useEffect } from 'react';
import { X, Copy, Gift, AlertCircle, Share2 } from 'lucide-react';
import { auth, database } from '../lib/firebase';
import { ref, onValue, update, set } from 'firebase/database';
import { generateUniqueReferralCode } from '../utils/referralUtils';
import { migrateCurrentUserReferralCode } from '../utils/referralMigration';

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReferralModal({ isOpen, onClose }: ReferralModalProps) {
  const [referralCode, setReferralCode] = useState('');
  const [referralCount, setReferralCount] = useState(0);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const userRef = ref(database, `users/${auth.currentUser.uid}`);
    console.log('Setting up referral data listener for user:', auth.currentUser.uid);
    
    const unsubscribe = onValue(userRef, async (snapshot) => {
      try {
        if (snapshot.exists()) {
          const data = snapshot.val();
          console.log('Received user data:', {
            referralCode: data.referralCode,
            referralCount: data.referralCount,
            hasReferrals: !!data.referrals
          });
          
          // Check if we need to migrate to a name-based referral code
          if (data.referralCode) {
            const newCode = await migrateCurrentUserReferralCode();
            if (newCode) {
              // Migration returned a new code, use it
              setReferralCode(newCode);
            } else {
              // No migration needed, use existing code
              setReferralCode(data.referralCode);
            }
          } else {
            // Initialize or update referral data if missing
            if (!data.referralCode || data.referralCount === undefined) {
              // Generate a name-based referral code
              const userName = auth.currentUser?.displayName || '';
              const uniqueCode = await generateUniqueReferralCode(userName, auth.currentUser.uid);
              
              const updates = {
                referralCode: uniqueCode,
                referralCount: data.referralCount || 0,
                referrals: data.referrals || {},
                updatedAt: new Date().toISOString()
              };
              console.log('Initializing missing referral data:', updates);
              await update(userRef, updates);
              return; // The listener will trigger again with updated data
            }
          }
          
          setReferralCount(data.referralCount || 0);
          
          // Get referrals list
          if (data.referrals) {
            const referralsList = Object.entries(data.referrals).map(([uid, info]: [string, any]) => ({
              uid,
              ...info
            }));
            console.log('Found referrals:', referralsList.length);
            setReferrals(referralsList);
          } else {
            console.log('No referrals found');
            setReferrals([]);
          }
        } else {
          console.log('No user data found, initializing...');
          // Generate a name-based referral code
          const userName = auth.currentUser?.displayName || '';
          const uniqueCode = await generateUniqueReferralCode(userName, auth.currentUser.uid);
          
          const initialData = {
            referralCode: uniqueCode,
            referralCount: 0,
            referrals: {},
            updatedAt: new Date().toISOString()
          };
          await set(userRef, initialData);
        }
      } catch (error) {
        console.error('Error handling referral data:', error);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error('Error fetching referral data:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCopyLink = async () => {
    const referralLink = `${window.location.origin}/register?ref=${referralCode}`;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy referral link:', error);
    }
  };

  const handleShare = async () => {
    const referralLink = `${window.location.origin}/register?ref=${referralCode}`;
    const shareText = `Join me on LazeTrade AI Market Analyzer! Use my referral link to get started: `;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'LazeTrade AI Market Analyzer Invitation',
          text: shareText,
          url: referralLink
        });
      } catch (error) {
        console.error('Error sharing:', error);
        // Fallback to copy if sharing fails
        handleCopyLink();
      }
    } else {
      // Fallback for browsers that don't support sharing
      handleCopyLink();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-white"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <Gift className="w-12 h-12 text-indigo-500 mx-auto mb-2" />
          <h2 className="text-xl font-semibold text-white mb-2">Refer Users & Earn Tokens</h2>
          <p className="text-gray-400">
            Refer 5 users and earn 50 tokens! New users get 100 tokens to start.
            Pro users get an additional 500 tokens when referrals upgrade!
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400">Referral Progress</span>
              <span className="text-white font-medium">{referralCount}/5</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
              <div
                className="bg-indigo-500 rounded-full h-2 transition-all duration-300"
                style={{ width: `${Math.min((referralCount / 5) * 100, 100)}%` }}
              />
            </div>
            {referrals.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-300 mb-2">Your Referrals:</h3>
                <div className="space-y-2">
                  {referrals.map((referral) => (
                    <div key={referral.uid} className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">{referral.email}</span>
                      <span className="text-gray-500 text-xs">
                        {new Date(referral.joinedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Your Referral Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={`${window.location.origin}/register?ref=${referralCode}`}
                readOnly
                className="flex-1 bg-gray-700 text-white rounded px-3 py-2 text-sm"
              />
              <button
                onClick={handleCopyLink}
                className="bg-indigo-600 text-white px-3 py-2 rounded hover:bg-indigo-700 transition-colors"
              >
                {copied ? 'Copied!' : <Copy size={16} />}
              </button>
              <button
                onClick={handleShare}
                className="bg-indigo-600 text-white px-3 py-2 rounded hover:bg-indigo-700 transition-colors"
              >
                <Share2 size={16} />
              </button>
            </div>
          </div>

          {referralCount === 0 && (
            <div className="flex items-center gap-2 text-yellow-500 text-sm">
              <AlertCircle size={16} />
              <span>Share your link to start earning tokens!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
