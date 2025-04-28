import React, { useState, useEffect, useRef } from 'react';
import { auth } from '../lib/firebase';
import { getDatabase, ref, get } from 'firebase/database';
import { CreditCard, Coins, ArrowLeft, Eye, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

interface Purchase {
  tokens: number;
  amount: number;
  date: string;
  status: string;
  priceId: string;
  customerEmail: string;
  type: string;
  description?: string;
}

interface PurchaseDetailsModalProps {
  purchase: (Purchase & { id: string }) | null;
  onClose: () => void;
}

function DetailRow({ label, value, className = '' }: { label: string; value: string; className?: string }) {
  return (
    <div className="flex justify-between items-start gap-4 py-2 border-b border-white/10">
      <span className="app-text">{label}</span>
      <span className={`app-text text-right break-all ${className}`}>{value}</span>
    </div>
  );
}

function PurchaseDetailsModal({ purchase, onClose }: PurchaseDetailsModalProps) {
  if (!purchase) return null;
  
  const modalRef = useRef<HTMLDivElement>(null);

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

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div>
      {/* Backdrop */}
      <div 
        ref={modalRef}
        className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-4"
      />
      
      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg mx-4 z-[60]">
        <div className="rounded-lg p-6 animate-[modalPopIn_0.3s_ease-out_forwards] app-card">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold app-text">
              Purchase Details
            </h2>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-2 rounded-lg group z-[70] hover:bg-white/10"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 transition-colors app-icon group-hover:opacity-80" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-2xl app-card">
              <Coins className="w-8 h-8 app-icon" />
            </div>

            <div className="space-y-3">
              <DetailRow label="Tokens Purchased" value={`${purchase.tokens} Tokens`} />
              <DetailRow label="Price" value={`$${purchase.amount.toFixed(2)} USD`} />
              <DetailRow 
                label="Purchase Date" 
                value={new Date(purchase.date).toLocaleString()} 
              />
              <DetailRow label="Status" value={purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PurchaseHistory() {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<(Purchase & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPurchase, setSelectedPurchase] = useState<(Purchase & { id: string }) | null>(null);
  const [filter, setFilter] = useState<'all' | 'purchase' | 'referral'>('all');
  const { theme } = useTheme();
  const db = getDatabase();
  const userId = auth.currentUser?.uid;

  const fetchPurchaseHistory = async () => {
    try {
      const purchasesRef = ref(db, `users/${userId}/purchases`);
      const purchaseHistoryRef = ref(db, `users/${userId}/purchaseHistory`);
      
      // Fetch both regular purchases and purchase history
      const [purchasesSnapshot, historySnapshot] = await Promise.all([
        get(purchasesRef),
        get(purchaseHistoryRef)
      ]);
      
      const purchases = purchasesSnapshot.val() || {};
      const history = historySnapshot.val() || [];
      
      // Transform the purchases data
      const purchasesList = Object.entries(purchases).map(([id, purchase]: [string, any]) => ({
        id,
        ...purchase,
        tokens: purchase.tokens || 0,
        amount: purchase.amount || 0,
        type: 'purchase' // Mark these as purchase type
      }));
      
      // Transform the history data (referral bonuses, etc.)
      const historyList = Array.isArray(history) ? history : Object.values(history || {});
      const transformedHistoryList = historyList.map((item: any, index: number) => ({
        id: `history-${index}`,
        ...item,
        tokens: item.tokens || 0,
        amount: 0, // No amount for referral bonuses
        date: item.timestamp || new Date().toISOString(),
        status: 'completed',
        type: item.type || 'referral' // Use existing type or default to referral
      }));
      
      // Combine both lists
      const combinedList = [...purchasesList, ...transformedHistoryList];
      
      // Sort by date, newest first
      setPurchases(combinedList.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ));
    } catch (error) {
      console.error('Error fetching purchase history:', error);
      setPurchases([]);
    }
  };

  useEffect(() => {
    if (!auth.currentUser) {
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        await fetchPurchaseHistory();
      } catch (error) {
        console.error('Error fetching purchase history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const filteredPurchases = purchases.filter(purchase => {
    if (filter === 'all') return true;
    if (filter === 'purchase') return purchase.type === 'purchase';
    if (filter === 'referral') {
      // Check for any referral-related type
      return purchase.type === 'referral' || 
             purchase.type === 'referral_bonus' || 
             purchase.type === 'referral_purchase_bonus' ||
             purchase.type === 'referral_signup_bonus' ||
             purchase.type.includes('referral');
    }
    return false;
  });

  return (
    <div className="min-h-screen pt-20 pb-4 px-6 md:px-12 lg:px-24" style={{
      background: `
        linear-gradient(135deg, rgba(226, 232, 240, 0.01) 0%, rgba(203, 213, 225, 0.005) 100%),
        radial-gradient(circle at 50% 0%, rgba(226, 232, 240, 0.01) 0%, transparent 75%),
        radial-gradient(circle at 0% 50%, rgba(203, 213, 225, 0.005) 0%, transparent 50%),
        radial-gradient(circle at 100% 50%, rgba(203, 213, 225, 0.005) 0%, transparent 50%),
        linear-gradient(to bottom,
          rgba(24, 24, 27, 0.98) 0%,
          rgba(39, 39, 42, 0.95) 50%,
          rgba(24, 24, 27, 0.98) 100%
        )
      `
    }}>
      <div className="max-w-4xl mx-auto relative z-0 px-4">
        <div className="rounded-2xl p-8 app-card">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 relative">
            <div>
              <h1 className="text-3xl font-bold app-text">
                Purchase History
              </h1>
              <p className="app-text">
                View your token purchase history
              </p>
            </div>
            
            {/* Back to Profile Button - Moved inside header */}
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center px-4 py-2 rounded-lg app-button"
            >
              <ArrowLeft className="w-4 h-4 mr-2 app-icon" />
              <span className="app-text">Back to Profile</span>
            </button>
          </div>

          {/* Filter Buttons */}
          <div className="relative z-10 flex gap-4 mb-6">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`relative px-4 py-2 rounded-lg transition-colors cursor-pointer ${filter === 'all' ? 'app-button' : 'app-button-secondary'}`}
            >
              <span className="app-text">All</span>
            </button>
            <button
              type="button"
              onClick={() => setFilter('purchase')}
              className={`relative px-4 py-2 rounded-lg transition-colors cursor-pointer ${filter === 'purchase' ? 'app-button' : 'app-button-secondary'}`}
            >
              <span className="app-text">Purchased</span>
            </button>
            <button
              type="button"
              onClick={() => setFilter('referral')}
              className={`relative px-4 py-2 rounded-lg transition-colors cursor-pointer ${filter === 'referral' ? 'app-button' : 'app-button-secondary'}`}
            >
              <span className="app-text">Referral</span>
            </button>
          </div>

          {/* Purchase List Container */}
          <div className="relative z-0">
            {/* Purchase List */}
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-2 rounded-full mx-auto border-indigo-500 border-t-transparent"></div>
                <p className="app-text mt-2">
                  Loading purchase history...
                </p>
              </div>
            ) : filteredPurchases.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="w-12 h-12 mx-auto mb-3 app-icon" />
                <p className="text-lg mb-2 app-text">
                  No Purchases Yet
                </p>
                <p className="app-text">
                  Your token purchase history will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPurchases.map((purchase) => (
                  <div
                    key={purchase.id}
                    className="rounded-2xl p-4 flex items-center justify-between mb-4 app-card hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center app-card">
                          <Coins className="w-5 h-5 app-icon" />
                        </div>
                        <div>
                          <p className="font-medium app-text text-xl">
                            {purchase?.tokens ? purchase.tokens : '0'} Tokens
                          </p>
                          <p className="text-sm app-text opacity-80">
                            {purchase.type && purchase.type.includes('referral') 
                              ? (purchase.description || 'Referral Bonus') 
                              : `$${(purchase?.amount || 0).toFixed(2)} USD`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="app-text" style={{fontWeight: 500, opacity: 0.8}}>
                            {new Date(purchase.date).toLocaleDateString()}
                          </p>
                          <p className="text-sm app-text" style={{opacity: 0.7}}>
                            {purchase.type && purchase.type.includes('referral') 
                              ? 'Referral Bonus' 
                              : purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1)}
                          </p>
                        </div>
                        <button
                          onClick={() => setSelectedPurchase(purchase)}
                          className="p-2 rounded-lg transition-colors app-card"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 app-icon" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Purchase Details Modal */}
      {selectedPurchase && (
        <PurchaseDetailsModal
          purchase={selectedPurchase}
          onClose={() => setSelectedPurchase(null)}
        />
      )}
    </div>
  );
}