import React, { useEffect, useState } from 'react';
import { auth, database } from '../lib/firebase';
import { ref, onValue } from 'firebase/database';
import { Receipt, Clock, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PurchaseRecord {
  id: string;
  type: string;
  title: string;
  description: string;
  amount: number;
  timestamp: number;
  status: string;
}

export function PurchaseHistory() {
  const [history, setHistory] = useState<PurchaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'purchased' | 'referral'>('all');
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }

    const historyRef = ref(database, `users/${auth.currentUser.uid}/purchaseHistory`);
    const unsubscribe = onValue(historyRef, (snapshot) => {
      if (snapshot.exists()) {
        const records = snapshot.val();
        setHistory(Array.isArray(records) ? records : Object.values(records));
      } else {
        setHistory([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'referral_bonus':
        return <Receipt className="w-5 h-5 text-green-400" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'referral_bonus':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Purchase History</h1>
          <p className="text-gray-400">View your token purchase and reward history</p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <ArrowLeft size={20} />
          Back
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'all'
              ? 'bg-indigo-500 text-white'
              : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('purchased')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'purchased'
              ? 'bg-indigo-500 text-white'
              : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
          }`}
        >
          Purchased
        </button>
        <button
          onClick={() => setFilter('referral')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'referral'
              ? 'bg-indigo-500 text-white'
              : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
          }`}
        >
          Referral
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading history...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-12 bg-gray-800/50 rounded-xl">
          <Receipt className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No History Yet</h3>
          <p className="text-gray-400">Your token purchase and reward history will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history
            .filter((record) => {
              if (filter === 'all') return true;
              if (filter === 'referral') return record.type === 'referral_bonus';
              if (filter === 'purchased') return record.type === 'purchase';
              return true;
            })
            .sort((a, b) => b.timestamp - a.timestamp)
            .map((record) => (
              <div
                key={record.id}
                className="bg-gray-800/50 rounded-xl p-4 flex items-start gap-4"
              >
                <div className="p-2 bg-gray-700/50 rounded-lg">
                  {getTypeIcon(record.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-white">{record.title}</h3>
                      <p className="text-sm text-gray-400 mt-1">{record.description}</p>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${getTypeColor(record.type)}`}>
                        +{record.amount} tokens
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatDate(record.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
