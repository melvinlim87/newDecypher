import React, { useState, useEffect } from 'react';
import { auth, database } from '../lib/firebase';
import { ref, get, query, orderByKey } from 'firebase/database';
import { Loader2, AlertCircle, CheckCircle, UserCheck } from 'lucide-react';
import { migrateAllUserReferralCodes, migrateUserReferralCode } from '../utils/referralMigration';
import { useNavigate } from 'react-router-dom';

export function AdminTools() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
  const [migrationProgress, setMigrationProgress] = useState<{ total: number; processed: number; updated: number }>({
    total: 0,
    processed: 0,
    updated: 0
  });
  const [statusMessage, setStatusMessage] = useState('');
  const [userEmails, setUserEmails] = useState<Record<string, string>>({});

  // Check if current user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (!auth.currentUser) {
        navigate('/login');
        return;
      }
      
      try {
        const adminRef = ref(database, `admins/${auth.currentUser.uid}`);
        const snapshot = await get(adminRef);
        if (snapshot.exists() && snapshot.val() === true) {
          setIsAdmin(true);
          await loadUsers();
        } else {
          setIsAdmin(false);
          navigate('/');
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    
    checkAdmin();
  }, [navigate]);

  const loadUsers = async () => {
    try {
      const usersRef = ref(database, 'users');
      const usersQuery = query(usersRef, orderByKey());
      const snapshot = await get(usersQuery);
      
      if (snapshot.exists()) {
        const usersData = snapshot.val();
        const usersList = Object.keys(usersData).map(uid => ({
          uid,
          email: usersData[uid].email || 'No Email',
          name: usersData[uid].name || 'No Name',
          referralCode: usersData[uid].referralCode || 'No Code'
        }));
        
        setUsers(usersList);
        
        // Create map of user IDs to emails
        const emailMap: Record<string, string> = {};
        usersList.forEach(user => {
          emailMap[user.uid] = user.email;
        });
        setUserEmails(emailMap);
      }
    } catch (error) {
      console.error("Error loading users:", error);
      setStatusMessage('Error loading users');
    }
  };

  const startMigration = async () => {
    if (!isAdmin || migrationStatus === 'running') return;
    
    setMigrationStatus('running');
    setStatusMessage('Starting migration...');
    setMigrationProgress({
      total: users.length,
      processed: 0,
      updated: 0
    });
    
    try {
      await migrateAllUserReferralCodes((uid, newCode, oldCode, current, total) => {
        setMigrationProgress(prev => ({
          ...prev,
          processed: current,
          updated: newCode ? prev.updated + 1 : prev.updated
        }));
        
        if (newCode) {
          setStatusMessage(`Migrated ${userEmails[uid] || uid}: ${oldCode} → ${newCode}`);
        }
      });
      
      setMigrationStatus('completed');
      setStatusMessage('Migration completed successfully');
      // Reload users to show updated codes
      await loadUsers();
    } catch (error) {
      console.error("Migration error:", error);
      setMigrationStatus('error');
      setStatusMessage(`Migration error: ${error}`);
    }
  };

  const migrateSingleUser = async (uid: string, currentCode: string) => {
    try {
      setStatusMessage(`Migrating user ${userEmails[uid] || uid}...`);
      const newCode = await migrateUserReferralCode(uid);
      if (newCode) {
        setStatusMessage(`Successfully migrated ${userEmails[uid] || uid}: ${currentCode} → ${newCode}`);
        // Reload users to show updated code
        await loadUsers();
      } else {
        setStatusMessage(`No migration needed for ${userEmails[uid] || uid}`);
      }
    } catch (error) {
      console.error(`Error migrating user ${uid}:`, error);
      setStatusMessage(`Error migrating user: ${error}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
        <span className="ml-2 text-indigo-100">Loading...</span>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Redirect happens in useEffect
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-900 min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-8 text-indigo-300">Admin Tools</h1>
      
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-indigo-200">Referral Code Migration</h2>
        <p className="mb-4 text-gray-300">
          This tool will update all users' referral codes to the new format: username followed by 5 random characters.
        </p>
        
        <div className="mb-6">
          <button
            onClick={startMigration}
            disabled={migrationStatus === 'running'}
            className={`px-4 py-2 rounded-md font-medium ${
              migrationStatus === 'running' 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700 transition-colors'
            }`}
          >
            {migrationStatus === 'running' ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Migrating...
              </div>
            ) : 'Migrate All Users'}
          </button>
        </div>
        
        {migrationStatus !== 'idle' && (
          <div className="mb-4">
            <div className="flex items-center mb-2">
              {migrationStatus === 'running' && <Loader2 className="h-4 w-4 mr-2 text-yellow-400 animate-spin" />}
              {migrationStatus === 'completed' && <CheckCircle className="h-4 w-4 mr-2 text-green-400" />}
              {migrationStatus === 'error' && <AlertCircle className="h-4 w-4 mr-2 text-red-400" />}
              <span className={`
                ${migrationStatus === 'running' ? 'text-yellow-400' : ''}
                ${migrationStatus === 'completed' ? 'text-green-400' : ''}
                ${migrationStatus === 'error' ? 'text-red-400' : ''}
              `}>
                {statusMessage}
              </span>
            </div>
            
            {migrationStatus === 'running' && (
              <div className="w-full bg-gray-700 rounded-full h-2.5 mb-4">
                <div 
                  className="bg-indigo-500 h-2.5 rounded-full" 
                  style={{ width: `${(migrationProgress.processed / migrationProgress.total) * 100}%` }}
                ></div>
              </div>
            )}
            
            <div className="text-sm text-gray-400">
              Processed: {migrationProgress.processed} / {migrationProgress.total} users
              <br />
              Updated: {migrationProgress.updated} users
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-indigo-200">User Referral Codes</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-300">
            <thead className="text-xs uppercase bg-gray-700">
              <tr>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Current Referral Code</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.uid} className="border-b border-gray-700">
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">{user.name}</td>
                  <td className="px-4 py-3 font-mono">{user.referralCode}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => migrateSingleUser(user.uid, user.referralCode)}
                      className="text-xs px-2 py-1 bg-indigo-600 rounded hover:bg-indigo-700 transition-colors"
                    >
                      <div className="flex items-center">
                        <UserCheck className="h-3 w-3 mr-1" />
                        Update
                      </div>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
