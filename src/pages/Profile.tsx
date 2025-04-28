import React, { useState, useEffect } from 'react';
import { auth, database } from '../lib/firebase';
import { updateProfile } from 'firebase/auth';
import { verifyCheckoutSession } from '../lib/stripe';
import { User, Mail, Calendar, Loader2, Phone } from 'lucide-react';
import { TokenDisplay } from '../components/TokenDisplay';
import { useSearchParams } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useSidebarState } from '../contexts/SidebarContext';
import { ref, get, set, update } from 'firebase/database';

export function Profile() {
  // Add a style tag for themed background that matches navbar
  useEffect(() => {
    const profileStyle = document.createElement('style');
    profileStyle.innerHTML = `
      /* Global profile page styling */
      .profile-page-container {
        background:
          linear-gradient(135deg, rgba(226, 232, 240, 0.01) 0%, rgba(203, 213, 225, 0.005) 100%),
          radial-gradient(circle at 50% 0%, rgba(226, 232, 240, 0.01) 0%, transparent 75%),
          radial-gradient(circle at 0% 50%, rgba(203, 213, 225, 0.005) 0%, transparent 50%),
          radial-gradient(circle at 100% 50%, rgba(203, 213, 225, 0.005) 0%, transparent 50%),
          linear-gradient(to bottom,
            rgba(24, 24, 27, 0.98) 0%,
            rgba(39, 39, 42, 0.95) 50%,
            rgba(24, 24, 27, 0.98) 100%
          ) !important;
        color: var(--main-title, #E3E5E7) !important;
        height: calc(100vh - 4rem) !important;
        position: fixed !important;
        top: 4rem !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        overflow-y: auto !important;
        box-shadow: inset 0 0 40px rgba(109, 114, 120, 0.3) !important;
        transition: padding-left 0.3s ease-in-out !important;
      }
      
      .profile-page-container.dark {
        background:
          linear-gradient(135deg, rgba(226, 232, 240, 0.01) 0%, rgba(203, 213, 225, 0.005) 100%),
          radial-gradient(circle at 50% 0%, rgba(226, 232, 240, 0.01) 0%, transparent 75%),
          radial-gradient(circle at 0% 50%, rgba(203, 213, 225, 0.005) 0%, transparent 50%),
          radial-gradient(circle at 100% 50%, rgba(203, 213, 225, 0.005) 0%, transparent 50%),
          linear-gradient(to bottom,
            rgba(24, 24, 27, 0.98) 0%,
            rgba(39, 39, 42, 0.95) 50%,
            rgba(24, 24, 27, 0.98) 100%
          ) !important;
        color: #C9CCCF !important;
        box-shadow: inset 0 0 40px rgba(109, 114, 120, 0.5) !important;
      }
      
      /* Force all text elements to use the navbar white */
      .profile-page *, .profile-page *::before, .profile-page *::after {
        color: var(--logo-inner-blue, #ffffff) !important; /* Fallback changed to white */
      }
      
      /* Fix for body and html to prevent any background showing through */
      body, html {
        margin: 0 !important;
        padding: 0 !important;
        overflow-x: hidden !important;
      }
      
      /* Apply the token styling to profile elements */
      .profile-text, .profile-page h1, .profile-page h2, .profile-page p, .profile-page span,
      .profile-page div, .profile-page button, .profile-page input,
      .profile-page .token-display *, .profile-page .navbar-token {
        color: var(--logo-inner-blue, #ffffff) !important; /* Fallback changed to white */
        text-shadow: 0 0 5px rgba(0, 229, 255, 0.5) !important;
      }
      
      /* Target all icons in profile */
      .profile-page svg, .profile-page .lucide-user, .profile-page .lucide-mail, 
      .profile-page .lucide-calendar, .profile-page .lucide-phone,
      .profile-page .lucide-coins, .profile-page .lucide-credit-card,
      .profile-page .lucide-receipt, .profile-page .lucide-users,
      .profile-page .lucide-gift, .profile-page .lucide-history {
        color: var(--logo-inner-blue, #ffffff) !important; /* Fallback changed to white */
        filter: drop-shadow(0 0 5px rgba(0, 229, 255, 0.5)) !important;
      }
      
      /* Card styling */
      .profile-card {
        background: linear-gradient(
          135deg,
          rgba(226, 232, 240, 0.02) 0%,
          rgba(203, 213, 225, 0.03) 25%,
          rgba(226, 232, 240, 0.02) 50%,
          rgba(203, 213, 225, 0.03) 75%,
          rgba(226, 232, 240, 0.02) 100%
        ) !important;
        border: 1px solid rgba(255, 255, 255, 0.05) !important;
        box-shadow: 0 8px 32px rgba(203, 213, 225, 0.05), inset 0 0 0 1px rgba(255, 255, 255, 0.05) !important;
        backdrop-filter: blur(5px) !important;
        border-radius: 0.5rem !important;
      }
      
      /* Dark mode adjustments */
      /* Dark mode text styling - overridden to keep using blue */
      .profile-page-container.dark .profile-text, 
      .profile-page-container.dark h1, 
      .profile-page-container.dark h2, 
      .profile-page-container.dark p, 
      .profile-page-container.dark span,
      .profile-page-container.dark div,
      .profile-page-container.dark button,
      .profile-page-container.dark input,
      .profile-page-container.dark .token-display *,
      .profile-page-container.dark .navbar-token {
        color: var(--logo-inner-blue, #ffffff) !important; /* Fallback changed to white */
        text-shadow: 0 2px 4px rgba(0, 169, 224, 0.5) !important;
      }
      
      /* Dark mode icon styling - overridden to keep using blue */
      .profile-page-container.dark svg, 
      .profile-page-container.dark .lucide-user, 
      .profile-page-container.dark .lucide-mail, 
      .profile-page-container.dark .lucide-calendar, 
      .profile-page-container.dark .lucide-phone,
      .profile-page-container.dark .lucide-coins,
      .profile-page-container.dark .lucide-credit-card,
      .profile-page-container.dark .lucide-receipt,
      .profile-page-container.dark .lucide-users,
      .profile-page-container.dark .lucide-gift,
      .profile-page-container.dark .lucide-history {
        color: var(--logo-inner-blue, #ffffff) !important; /* Fallback changed to white */
        filter: drop-shadow(0 2px 4px rgba(0, 169, 224, 0.5)) !important;
      }
      
      /* Dark mode card styling */
      .profile-page-container.dark .profile-card {
        background: linear-gradient(
          135deg,
          rgba(226, 232, 240, 0.02) 0%,
          rgba(203, 213, 225, 0.03) 25%,
          rgba(226, 232, 240, 0.02) 50%,
          rgba(203, 213, 225, 0.03) 75%,
          rgba(226, 232, 240, 0.02) 100%
        ) !important;
        border: 1px solid rgba(255, 255, 255, 0.05) !important;
        box-shadow: 0 8px 32px rgba(203, 213, 225, 0.05), inset 0 0 0 1px rgba(255, 255, 255, 0.05) !important;
      }
      
      /* Add button styling */
      .profile-page button {
        transition: all 0.2s ease-in-out !important;
      }
      
      .profile-page button:hover {
        transform: translateY(-2px) !important;
        box-shadow: 0 4px 20px rgba(0, 229, 255, 0.4) !important;
      }
      
      .profile-page-container.dark button:hover {
        box-shadow: 0 4px 20px rgba(0, 169, 224, 0.4) !important;
      }
      
      /* Input styling */
      .profile-page input {
        background: rgba(31, 41, 55, 0.5) !important;
        border: 1px solid rgba(255, 255, 255, 0.05) !important;
        box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.2) !important;
        color: #ffffff !important; /* Changed from #00A9E0 */
        caret-color: #ffffff !important; /* Changed from #00A9E0 */
      }
      
      .profile-page-container.dark input {
        background: rgba(31, 41, 55, 0.5) !important;
        border: 1px solid rgba(255, 255, 255, 0.05) !important;
        box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.2) !important;
        caret-color: var(--logo-inner-blue, #ffffff) !important; /* Fallback changed to white */
      }
    `;
    document.head.appendChild(profileStyle);
    
    return () => {
      document.head.removeChild(profileStyle);
    };
  }, []);
  
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { theme } = useTheme();
  const { isCollapsed } = useSidebarState();
  const [user, setUser] = useState<any>(null);

  // Check for Telegram login
  const checkTelegramLogin = () => {
    const telegramUser = sessionStorage.getItem('telegramUser');
    if (telegramUser) {
      try {
        const parsedUser = JSON.parse(telegramUser);
        return {
          uid: parsedUser.id,
          displayName: parsedUser.name || parsedUser.username,
          photoURL: parsedUser.photoUrl,
          phoneNumber: parsedUser.phoneNumber,
          metadata: {
            creationTime: new Date().toISOString()
          },
          isTelegramUser: true
        };
      } catch (error) {
        console.error('Error parsing Telegram user:', error);
        return null;
      }
    }
    return null;
  };

  // Initialize user data
  useEffect(() => {
    const initUser = async () => {
      if (auth.currentUser) {
        setUser(auth.currentUser);
        setName(auth.currentUser.displayName || '');
      } else {
        const telegramUser = checkTelegramLogin();
        if (telegramUser) {
          setUser(telegramUser);
          setName(telegramUser.displayName || '');
          
          // Check if free tokens have been assigned
          await checkAndAssignFreeTokens(telegramUser.uid);
          
          // Get phone number from database if available
          try {
            const userRef = ref(database, `users/${telegramUser.uid}`);
            const snapshot = await get(userRef);
            const userData = snapshot.val();
            
            if (userData && userData.phoneNumber) {
              // Update local user state with phone number from database
              setPhoneNumber(userData.phoneNumber);
              setUser((prev: any) => ({
                ...prev,
                phoneNumber: userData.phoneNumber
              }));
              
              // Update session storage with phone number
              const storedUser = JSON.parse(sessionStorage.getItem('telegramUser') || '{}');
              storedUser.phoneNumber = userData.phoneNumber;
              sessionStorage.setItem('telegramUser', JSON.stringify(storedUser));
            }
          } catch (error) {
            console.error('Error fetching phone number:', error);
          }
        }
      }
    };

    initUser();
    
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setName(currentUser.displayName || '');
      } else {
        const telegramUser = checkTelegramLogin();
        if (telegramUser) {
          setUser(telegramUser);
          setName(telegramUser.displayName || '');
          
          // Check if free tokens have been assigned
          await checkAndAssignFreeTokens(telegramUser.uid);
          
          // Get phone number from database if available
          try {
            const userRef = ref(database, `users/${telegramUser.uid}`);
            const snapshot = await get(userRef);
            const userData = snapshot.val();
            
            if (userData && userData.phoneNumber) {
              // Update local user state with phone number from database
              setPhoneNumber(userData.phoneNumber);
              setUser((prev: any) => ({
                ...prev,
                phoneNumber: userData.phoneNumber
              }));
              
              // Update session storage with phone number
              const storedUser = JSON.parse(sessionStorage.getItem('telegramUser') || '{}');
              storedUser.phoneNumber = userData.phoneNumber;
              sessionStorage.setItem('telegramUser', JSON.stringify(storedUser));
            }
          } catch (error) {
            console.error('Error fetching phone number:', error);
          }
        } else {
          setUser(null);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Check and assign free tokens for new users
  const checkAndAssignFreeTokens = async (uid: string) => {
    try {
      const userRef = ref(database, `users/${uid}`);
      const snapshot = await get(userRef);
      const userData = snapshot.val();
      
      if (!userData || userData.tokens === undefined) {
        // New user, assign free tokens
        await set(userRef, {
          ...userData,
          tokens: 100, // Free tokens for new users
          createdAt: new Date().toISOString()
        });
        
        console.log('Assigned free tokens to new user:', uid);
      }
    } catch (error) {
      console.error('Error checking/assigning free tokens:', error);
    }
  };

  // Handle successful payment redirect
  useEffect(() => {
    const verifySession = async () => {
      if (sessionId) {
        setIsLoading(true);
        try {
          const result = await verifyCheckoutSession(sessionId);
          if (result.success) {
            setSuccessMessage(`Successfully purchased ${result.tokens} tokens!`);
          } else {
            setError('Failed to verify payment. Please contact support.');
          }
        } catch (error) {
          console.error('Error verifying session:', error);
          setError('An error occurred while verifying your payment.');
        } finally {
          setIsLoading(false);
        }
      }
    };

    verifySession();
  }, [sessionId, searchParams]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (user?.isTelegramUser) {
        // For Telegram users, update in our database
        const userRef = ref(database, `users/${user.uid}`);
        const snapshot = await get(userRef);
        const userData = snapshot.val() || {};
        
        await update(userRef, {
          ...userData,
          displayName: name,
          phoneNumber: phoneNumber
        });
        
        // Update session storage
        const storedUser = JSON.parse(sessionStorage.getItem('telegramUser') || '{}');
        storedUser.name = name;
        storedUser.phoneNumber = phoneNumber;
        sessionStorage.setItem('telegramUser', JSON.stringify(storedUser));
        
        // Update local user state
        setUser((prev: any) => ({
          ...prev,
          displayName: name,
          phoneNumber: phoneNumber
        }));
        
        setSuccessMessage('Profile updated successfully!');
      } else if (auth.currentUser) {
        // For Firebase users, update profile in Firebase Auth
        await updateProfile(auth.currentUser, {
          displayName: name
        });
        
        setSuccessMessage('Profile updated successfully!');
      }
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`profile-page profile-page-container ${theme === 'dark' ? 'dark' : ''} flex items-center justify-center p-4 sm:p-8 lg:p-12`}
      style={{
        paddingLeft: isCollapsed ? 'calc(4rem + 2rem)' : 'calc(16rem + 2rem)',
        paddingRight: '2rem'
      }}>
      <div className="max-w-7xl w-full space-y-8 profile-card" style={{
        backdropFilter: 'blur(10px)',
        borderRadius: '1rem',
        padding: '2rem',
        background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.3) 0%, rgba(17, 24, 39, 0.3) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 0 0 1px rgba(255, 255, 255, 0.05)'
      }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold profile-text">
            User Profile
          </h1>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="py-1.5 px-3 rounded-lg text-sm font-medium transition-colors profile-button"
              style={theme === 'light' ? {
                background: 'linear-gradient(90deg, #00b8d4 0%, #00e5ff 100%)',
                boxShadow: '0 0 15px rgba(0, 229, 255, 0.4)',
                border: '1px solid rgba(0, 229, 255, 0.3)',
                color: 'var(--main-title, #E3E5E7)',
                fontWeight: 'bold'
              } : {
                background: 'linear-gradient(90deg, rgba(79, 70, 229, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)',
                boxShadow: '0 0 15px rgba(99, 102, 241, 0.2)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                color: 'var(--logo-metallic, #C9CCCF)',
                fontWeight: 'bold'
              }}
            >
              Edit Profile
            </button>
          )}
        </div>

        {error && (
          <div className="p-3 mb-6 rounded-lg text-sm profile-card">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="p-3 mb-6 rounded-lg text-sm profile-card">
            {successMessage}
          </div>
        )}

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium profile-text">
                Display Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 profile-text" />
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-400"
                  placeholder="Your name"
                  required
                />
              </div>
            </div>

            {user?.isTelegramUser && (
              <div className="space-y-2">
                <label className="block text-sm font-medium profile-text">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 profile-text" />
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-400"
                    placeholder="Your phone number"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative z-20 order-1 sm:order-none profile-button"
                style={theme === 'light' ? {
                  background: 'linear-gradient(90deg, #00b8d4 0%, #00e5ff 100%)',
                  boxShadow: '0 0 15px rgba(0, 229, 255, 0.3)',
                  border: '1px solid rgba(0, 229, 255, 0.3)',
                  fontWeight: 'bold'
                } : {
                  background: 'linear-gradient(90deg, rgba(79, 70, 229, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)',
                  boxShadow: '0 0 15px rgba(99, 102, 241, 0.2)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  fontWeight: 'bold'
                }}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 mx-auto animate-spin" />
                ) : (
                  'Save Changes'
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setName(user?.displayName || '');
                  setPhoneNumber(user?.phoneNumber || '');
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="w-full py-2 px-4 rounded-lg font-medium transition-colors relative z-20 order-2 sm:order-none profile-button"
                style={theme === 'light' ? {
                  background: 'rgba(0, 229, 255, 0.15)',
                  boxShadow: '0 0 15px rgba(0, 229, 255, 0.2)',
                  border: '1px solid rgba(0, 229, 255, 0.2)',
                  fontWeight: 'bold'
                } : {
                  background: 'rgba(31, 41, 55, 0.4)',
                  boxShadow: '0 0 15px rgba(31, 41, 55, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  fontWeight: 'bold'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="rounded-lg p-4 sm:p-6 profile-card">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-indigo-500/10 border border-indigo-500/20' : ''}` } style={theme === 'light' ? {
                  background: '#00A9E0',
                  border: '1px solid rgba(0, 229, 255, 0.3)',
                  boxShadow: '0 0 15px rgba(0, 229, 255, 0.3)'
                } : {
                  background: 'linear-gradient(180deg, rgba(79, 70, 229, 0.3), rgba(67, 56, 202, 0.3))',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  boxShadow: '0 0 15px rgba(79, 70, 229, 0.3)'
                }}>
                  <User className="w-6 h-6 sm:w-8 sm:h-8 profile-text" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold profile-text">
                    {user?.displayName || 'Anonymous User'}
                  </h2>
                  <p className="profile-text">User Profile</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {/* Token Display with full styling - spans full width */}
              <div className="rounded-lg p-6 sm:p-8 profile-card md:col-span-3">
                <TokenDisplay variant="full" />
              </div>
              
              {/* Show email for Firebase users, phone for Telegram users */}
              <div className="rounded-lg p-6 sm:p-8 profile-card">
                <div className="flex items-center gap-3">
                  {user?.isTelegramUser ? (
                    <Phone className="w-5 h-5 profile-text" />
                  ) : (
                    <Mail className="w-5 h-5 profile-text" />
                  )}
                  <div>
                    <p className="text-sm profile-text">
                      {user?.isTelegramUser ? 'Phone Number' : 'Email'}
                    </p>
                    <p className="profile-text">
                      {user?.isTelegramUser ? (user?.phoneNumber || 'Not provided - Edit profile to add') : (user?.email || 'Not provided')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg p-6 sm:p-8 profile-card">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 profile-text" />
                  <div>
                    <p className="text-sm profile-text">Account Created</p>
                    <p className="profile-text">
                      {user?.metadata?.creationTime
                        ? new Date(user.metadata.creationTime).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
