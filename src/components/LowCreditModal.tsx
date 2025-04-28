import React from 'react';
import { useNavigate } from 'react-router-dom';

interface LowCreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchase: () => void;
  requiredTokens: number;
}

export const LowCreditModal = ({ isOpen, onClose, onPurchase, requiredTokens }: LowCreditModalProps) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handlePurchase = () => {
    onClose();
    navigate('/profile');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gradient-to-b from-[#0a192f] to-[#0a5e70] p-6 rounded-lg border border-cyan-500 shadow-lg shadow-cyan-500/50 max-w-md w-full">
        <h2 className="text-cyan-400 text-xl font-bold mb-4">⚠️ Low Credit Warning</h2>
        <p className="text-cyan-200 mb-6">
          You need {requiredTokens} tokens to perform this action. Please purchase more credits to continue using the analyzer features.
        </p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-cyan-400 hover:text-cyan-300 border border-cyan-500 rounded-lg hover:shadow-cyan-500/50 transition-all"
          >
            Close
          </button>
          <button
            onClick={handlePurchase}
            className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-400 hover:shadow-cyan-500/50 transition-all"
          >
            Purchase Credits
          </button>
        </div>
      </div>
    </div>
  );
};
