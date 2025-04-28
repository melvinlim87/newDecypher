import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './Button';
import { useState } from 'react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title
}: DeleteConfirmationModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = () => {
    if (confirmText.toLowerCase() !== 'confirm') {
      setError('Please type "confirm" to delete this item');
      return;
    }
    setError(null);
    onConfirm();
    onClose();
    setConfirmText('');
  };

  const handleClose = () => {
    onClose();
    setConfirmText('');
    setError(null);
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-40" />
      
      <div 
        className="relative w-full max-w-md modal-content z-[60] rounded-xl p-6 space-y-6 app-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-500/15 border border-red-500/30">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-white">Delete Confirmation</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800/30 rounded-lg transition-colors group z-10"
            aria-label="Close modal" 
          >
            <X className="w-5 h-5 text-white group-hover:opacity-80 transition-colors" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-white">
            Are you sure you want to delete this item?
          </p>
          <div className="rounded-lg p-3 bg-black/30 border border-white/5">
            <p className="text-sm text-white">{title}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-white">
              Type "confirm" to delete:
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => {
                setConfirmText(e.target.value);
                setError(null);
              }}
              className="w-full px-3 py-2 rounded-lg app-input placeholder-gray-600 focus:outline-none text-white"
              placeholder="Type confirm..."
              autoFocus
            />
            {error && (
              <p className="text-sm text-white">{error}</p>
            )}
          </div>
          <p className="text-sm text-white">
            This action cannot be undone.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={handleClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={confirmText.toLowerCase() !== 'confirm'}
            className="flex-1"
            style={confirmText.toLowerCase() === 'confirm' ? {
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              opacity: 1
            } : {
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#ef4444',
              opacity: 0.6
            }}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}