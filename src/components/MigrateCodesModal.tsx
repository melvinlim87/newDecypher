import React, { useState } from 'react';
import { X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { migrateAllCodesNow } from '../utils/migrateAllCodes';

interface MigrateCodesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MigrateCodesModal({ isOpen, onClose }: MigrateCodesModalProps) {
  const [migrating, setMigrating] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);

  const handleMigration = async () => {
    if (migrating) return;
    
    setMigrating(true);
    setResults([]);
    setSuccess(false);
    
    try {
      const migrationResults = await migrateAllCodesNow();
      setResults(migrationResults);
      setSuccess(true);
    } catch (error) {
      console.error('Error during migration:', error);
      setResults([`Error: ${error.message}`]);
      setSuccess(false);
    } finally {
      setMigrating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 max-w-lg w-full mx-4 text-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-indigo-300">Update Referral Codes</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="mb-4">
          <p className="text-gray-300 mb-2">
            This tool will update all users' referral codes to the new username-based format.
          </p>
          
          <button
            onClick={handleMigration}
            disabled={migrating}
            className={`px-4 py-2 rounded-md font-medium mt-2 ${
              migrating ? 'bg-gray-600 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 transition-colors'
            }`}
          >
            {migrating ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating Codes...
              </div>
            ) : 'Update All Codes'}
          </button>
        </div>
        
        {results.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center mb-2">
              {success ? (
                <CheckCircle className="h-5 w-5 mr-2 text-green-400" />
              ) : (
                <AlertCircle className="h-5 w-5 mr-2 text-red-400" />
              )}
              <h3 className={`font-medium ${success ? 'text-green-400' : 'text-red-400'}`}>
                {success ? 'Migration Completed' : 'Migration Error'}
              </h3>
            </div>
            
            <div className="bg-gray-800 rounded-md p-3 mt-2 max-h-48 overflow-y-auto text-sm">
              {results.map((result, index) => (
                <div key={index} className="mb-1 last:mb-0">
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
