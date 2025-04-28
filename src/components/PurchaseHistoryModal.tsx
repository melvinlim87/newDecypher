import React, { useState, useEffect, useRef } from 'react';
import { X, Gift, CreditCard, Award, Circle as CircleNotch } from 'lucide-react';
import { auth, database } from '../lib/firebase';
import { ref, onValue } from 'firebase/database';
import { useTheme } from '../contexts/ThemeContext';

interface PurchaseHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PurchaseHistoryItem {
  type: 'purchase' | 'referral_bonus' | 'pro_upgrade';
  tokens: number;
  description: string;
  timestamp: string;
  amount?: number;
}

export function PurchaseHistoryModal({ isOpen, onClose }: PurchaseHistoryModalProps) {
  const [history, setHistory] = useState<PurchaseHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const historyRef = ref(database, `users/${auth.currentUser.uid}/purchaseHistory`);
    
    const unsubscribe = onValue(historyRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const historyItems = Array.isArray(data) ? data : [];
        setHistory(historyItems.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ));
      } else {
        setHistory([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <CreditCard className={theme === 'dark' ? "text-indigo-400" : "text-cyan-400"} size={20} />;
      case 'referral_bonus':
        return <Gift className={theme === 'dark' ? "text-green-400" : "text-cyan-300"} size={20} />;
      case 'pro_upgrade':
        return <Award className={theme === 'dark' ? "text-purple-400" : "text-cyan-200"} size={20} />;
      default:
        return <CreditCard className={theme === 'dark' ? "text-gray-400" : "text-cyan-300"} size={20} />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div ref={contentRef} className="w-full max-w-md max-h-[80vh] rounded-xl overflow-hidden app-card">
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <h2 className="text-xl font-semibold text-white">
            Purchase History
          </h2>
          <button 
            onClick={onClose} 
            className="p-2 rounded-lg hover:bg-gray-800/30 transition-colors group z-[70]"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-white transition-colors group-hover:opacity-80" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="text-center py-6 flex flex-col items-center">
              <CircleNotch className="w-8 h-8 animate-spin mb-2 text-white" />
              <span className="text-white">Loading...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-white">
              No purchase history available
            </div>
          ) : (
            history.map((item, index) => (
              <div 
                key={index} 
                className="flex items-start space-x-3 p-3 rounded-lg bg-gray-800/20 border border-white/5"
              >
                <div className="mt-1 text-white">{getIcon(item.type)}</div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div className="font-medium text-white">
                      {item.description}
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-400">
                        +{item.tokens} tokens
                      </div>
                      {item.amount && (
                        <div className="text-sm text-white">
                          ${item.amount}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-sm mt-1 text-gray-400">
                    {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
