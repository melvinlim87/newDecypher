import React, { useState, useEffect, useRef } from 'react';
import { auth } from '../lib/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile, 
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { database } from '../lib/firebase';
import { ref, set, get, update } from 'firebase/database';
import { Mail, Lock, User, Loader2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ReCaptcha } from './ReCaptcha';
import { generateUniqueReferralCode } from '../utils/referralUtils';
import { useTheme } from '../contexts/ThemeContext';
import TelegramLoginButton from 'react-telegram-login';

declare global {
  interface Window {
    recaptchaLoaded?: boolean;
    onRecaptchaLoadCallback?: () => void;
  }
  var grecaptcha: {
    ready: (callback: () => void) => void;
    execute: (sitekey: string) => Promise<string>;
    render: (container: string | HTMLElement, options: any) => number;
    reset: (widgetId?: number) => void;
    getResponse: (widgetId?: number) => string;
  };
}

interface AuthFormProps {
  type: 'login' | 'register';
}

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';
const telegramBotName = import.meta.env.VITE_TELEGRAM_BOT_NAME || 'LazeAIMarketAnalyzerBot';

export function AuthForm({ type }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref');
  console.log('Referral code from URL:', referralCode);
  const { theme } = useTheme();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (type === 'login') {
          const form = document.getElementById('auth-form') as HTMLFormElement;
          if (form) {
            const emailInput = form.querySelector('input[type="email"]') as HTMLInputElement;
            const passwordInput = form.querySelector('input[type="password"]') as HTMLInputElement;
            if (emailInput && passwordInput) {
              setEmail(emailInput.value);
              setPassword(passwordInput.value);
              handleSubmit({ preventDefault: () => {}, currentTarget: form } as React.FormEvent);
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [type]);

  useEffect(() => {
    let mounted = true;

    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      // Clear any existing session data
      sessionStorage.clear();

      if (type === 'register') {
        if (!recaptchaToken) {
          throw new Error('Please complete the reCAPTCHA verification');
        }

        // Verify reCAPTCHA token
        const verifyResponse = await fetch('/.netlify/functions/verify-recaptcha', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: recaptchaToken }),
        });

        const verifyResult = await verifyResponse.json();
        if (!verifyResponse.ok || !verifyResult.success) {
          throw new Error(verifyResult.error || 'reCAPTCHA verification failed');
        }
      }

      if (type === 'register') {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        if (name) {
          await updateProfile(user, { displayName: name });
        }
        
        // Generate a unique referral code based on user's name
        const uniqueReferralCode = await generateUniqueReferralCode(name, user.uid);
        
        // Initialize user tokens and referral data
        const userRef = ref(database, `users/${user.uid}`);
        const initialUserData = {
          tokens: 100,
          name: name || null,
          email: user.email,
          referredBy: referralCode || null,
          referralCode: uniqueReferralCode,
          referralCount: 0,
          referrals: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        console.log('Initializing new user with data:', initialUserData);
        
        // Check if user data already exists
        const userSnapshot = await get(userRef);
        if (!userSnapshot.exists()) {
          await set(userRef, initialUserData);
          console.log('Created new user data');
        } else {
          // Update existing user data while preserving existing fields
          const existingData = userSnapshot.val();
          const updatedData = {
            ...existingData,
            ...initialUserData,
            referralCount: existingData.referralCount || 0,
            referrals: existingData.referrals || {},
            updatedAt: new Date().toISOString()
          };
          await set(userRef, updatedData);
          console.log('Updated existing user data');
        }

        // Check if user is authenticated after registration
        console.log('Current user after registration:', auth.currentUser);
        
        // Update referrer's token count and referral count if referral code exists
        if (referralCode) {
          console.log('Processing referral with code:', referralCode);
          try {
            // Call the serverless function to process the referral
            const referralResponse = await fetch('/.netlify/functions/process-referral', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                referralCode,
                userId: user.uid,
                userEmail: user.email,
                userName: name || null,
                authProvider: 'email'
              }),
            });

            const referralResult = await referralResponse.json();
            if (!referralResponse.ok) {
              console.error('Error processing referral:', referralResult.error);
            } else {
              console.log('Referral processed successfully:', referralResult.message);
            }
          } catch (referralError) {
            console.error('Failed to process referral:', referralError);
          }
        }
        navigate('/');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/');
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(
        err instanceof Error 
          ? err.message.replace('Firebase: ', '') 
          : 'Authentication failed'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address to reset your password');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      setSuccess('Password reset email sent. Please check your inbox.');
    } catch (err) {
      console.error('Password reset error:', err);
      setError(
        err instanceof Error 
          ? err.message.replace('Firebase: ', '') 
          : 'Failed to send password reset email'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccess(null);
    setGoogleLoading(true);

    // Temporarily override console.error to suppress Firebase Auth popup warnings
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Filter out Cross-Origin-Opener-Policy warnings and permission denied errors
      const errorMessage = args.length > 0 && typeof args[0] === 'string' ? args[0] : '';
      if (errorMessage.includes('Cross-Origin-Opener-Policy') || 
          errorMessage.includes('Permission denied') ||
          (args.length > 0 && args[0] instanceof Error && args[0].message.includes('Permission denied'))) {
        return; // Suppress these specific errors
      }
      originalConsoleError.apply(console, args);
    };

    try {
      // Clear any existing session data
      sessionStorage.clear();
      
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if this is a new user (first time sign-in)
      const isNewUser = result._tokenResponse?.isNewUser;
      
      if (isNewUser) {
        try {
          // Generate a unique referral code based on user's name or email
          const displayName = user.displayName || user.email?.split('@')[0] || '';
          let uniqueReferralCode;
          
          try {
            uniqueReferralCode = await generateUniqueReferralCode(displayName, user.uid);
          } catch (codeError) {
            // Silently handle error without logging
            const safeUid = user?.uid || '';
            const safeDisplayName = displayName || '';
            uniqueReferralCode = `${safeDisplayName.toLowerCase().replace(/[^a-z0-9]/gi, '').substring(0, 6)}${safeUid ? safeUid.substring(0, 4) : Math.random().toString(36).substring(2, 6)}`;
          }
          
          // Initialize user tokens and referral data
          const userRef = ref(database, `users/${user.uid}`);
          const initialUserData = {
            tokens: 100,
            name: user.displayName || null,
            email: user.email,
            referredBy: referralCode || null,
            referralCode: uniqueReferralCode,
            referralCount: 0,
            referrals: {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          // Check if user data already exists
          const userSnapshot = await get(userRef);
          if (!userSnapshot.exists()) {
            await set(userRef, initialUserData);
            console.log('Created new user data for Google sign-in');
          } else {
            // Update existing user data while preserving existing fields
            const existingData = userSnapshot.val();
            const updatedData = {
              ...existingData,
              ...initialUserData,
              referralCount: existingData.referralCount || 0,
              referrals: existingData.referrals || {},
              updatedAt: new Date().toISOString()
            };
            await set(userRef, updatedData);
            console.log('Updated existing user data for Google sign-in');
          }

          // Update referrer's token count and referral count if referral code exists
          if (referralCode) {
            try {
              // Call the serverless function to process the referral
              const referralResponse = await fetch('/.netlify/functions/process-referral', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  referralCode,
                  userId: user.uid,
                  userEmail: user.email,
                  userName: user.displayName || null,
                  authProvider: 'google'
                }),
              });

              const referralResult = await referralResponse.json();
              if (!referralResponse.ok) {
                console.error('Error processing referral:', referralResult.error);
              } else {
                console.log('Referral processed successfully:', referralResult.message);
              }
            } catch (referralError) {
              // Silently handle error
            }
          }
        } catch (userDataError) {
          // Silently handle error without logging
        }
      }
      
      navigate('/');
    } catch (err) {
      // Only show user-facing error, don't log to console
      setError(
        err instanceof Error 
          ? err.message.replace('Firebase: ', '') 
          : 'Google authentication failed'
      );
    } finally {
      setGoogleLoading(false);
      // Restore original console.error
      console.error = originalConsoleError;
    }
  };

  const handleTelegramResponse = async (response: any) => {
    setError(null);
    setSuccess(null);
    setTelegramLoading(true);

    // Temporarily override console.error to suppress warnings
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Filter out permission denied errors
      const errorMessage = args.length > 0 && typeof args[0] === 'string' ? args[0] : '';
      if (errorMessage.includes('Permission denied') ||
          (args.length > 0 && args[0] instanceof Error && args[0].message.includes('Permission denied'))) {
        return; // Suppress these specific errors
      }
      originalConsoleError.apply(console, args);
    };

    try {
      // Verify Telegram login data on your backend
      // This is a simplified example - in a real app, you would need to verify the auth_date and hash
      // on your backend to ensure the data is authentic
      
      const { id, first_name, last_name, username, photo_url, auth_date, hash } = response;
      
      // In a real implementation, you would make an API call to your backend to verify the hash
      // and create a Firebase custom token
      // For now, we'll simulate this process
      
      // Create a unique email-like identifier for this Telegram user
      const telegramEmail = `telegram_${id}@telegram.auth`;
      
      try {
        // Check if user already exists in your database
        // We'll use a try-catch here to handle permission errors
        const userRef = ref(database, `users/${id}`);
        let userExists = false;
        
        try {
          const userSnapshot = await get(userRef);
          userExists = userSnapshot.exists();
        } catch (checkError) {
          // Silently handle permission errors
          userExists = false;
        }
        
        if (!userExists) {
          // This is a new user, create their account
          try {
            // Generate a unique referral code
            const displayName = username || first_name || `user_${id}`;
            let uniqueReferralCode;
            
            try {
              uniqueReferralCode = await generateUniqueReferralCode(displayName, id);
            } catch (codeError) {
              // Silently handle error without logging
              const safeId = id || '';
              const safeDisplayName = displayName || '';
              uniqueReferralCode = `${safeDisplayName.toLowerCase().replace(/[^a-z0-9]/gi, '').substring(0, 6)}${safeId ? safeId.substring(0, 4) : Math.random().toString(36).substring(2, 6)}`;
            }
            
            // Initialize user data
            const initialUserData = {
              tokens: 100,
              name: `${first_name || ''} ${last_name || ''}`.trim(),
              username: username || null,
              telegramId: id,
              photoUrl: photo_url || null,
              email: null, // Telegram users may not have email
              referredBy: referralCode || null,
              referralCode: uniqueReferralCode,
              referralCount: 0,
              referrals: {},
              authProvider: 'telegram',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            
            // Create user in database
            try {
              await set(userRef, initialUserData);
            } catch (setError) {
              // Silently handle permission errors
              // We'll continue with the login process anyway
            }
            
            // Process referral if code exists
            if (referralCode) {
              try {
                // Call the serverless function to process the referral
                const referralResponse = await fetch('/.netlify/functions/process-referral', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    referralCode,
                    userId: id,
                    userEmail: null,
                    userName: `${first_name || ''} ${last_name || ''}`.trim(),
                    authProvider: 'telegram'
                  }),
                });

                const referralResult = await referralResponse.json();
                if (!referralResponse.ok) {
                  console.error('Error processing referral:', referralResult.error);
                } else {
                  console.log('Referral processed successfully:', referralResult.message);
                }
              } catch (referralError) {
                // Silently handle error
              }
            }
          } catch (userDataError) {
            // Silently handle error without logging
          }
        }
      } catch (dbError) {
        // Silently handle database errors
        // We'll continue with the login process
      }
      
      // Store user info in session storage
      sessionStorage.setItem('telegramUser', JSON.stringify({
        id,
        name: `${first_name || ''} ${last_name || ''}`.trim(),
        username,
        photoUrl: photo_url
      }));
      
      // Navigate to home page
      navigate('/');
      
    } catch (err) {
      setError(
        err instanceof Error 
          ? err.message 
          : 'Telegram authentication failed'
      );
    } finally {
      setTelegramLoading(false);
      // Restore original console.error
      console.error = originalConsoleError;
    }
  };

  return (
    <div className="w-full mx-auto">
      <h2 className="text-2xl font-semibold text-center mb-6" 
        style={{ color: 'white', textShadow: '0 0 5px rgba(0, 169, 224, 0.5)', fontSize: '1.75rem' }}>
        {type === 'login' ? 'Sign In' : 'Create Account'}
      </h2>

        {error && (
          <div className="p-3 mb-4 rounded-lg text-sm bg-red-500/10 border border-red-500/20 w-full" style={{ color: 'white' }}>
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 mb-4 rounded-lg text-sm bg-green-500/10 border border-green-500/20 w-full" style={{ color: 'white' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} id="auth-form" className="space-y-4">
          {type === 'register' && (
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'white', fontSize: 'calc(0.875rem + 5px)' }}>
                Name
              </label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'white' }} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0085d7]/50 app-input transition-all duration-300 border border-gray-700/50 group-hover:border-[#0085d7]/30"
                  style={{ fontSize: 'calc(1rem + 6px)' }}
                  placeholder="Your name"
                  name="name"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'white', fontSize: 'calc(0.875rem + 5px)' }}>
              Email
            </label>
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'white' }} />
              <input
                type="email"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required
                className="w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0085d7]/50 app-input transition-all duration-300 border border-gray-700/50 group-hover:border-[#0085d7]/30"
                style={{ fontSize: '1rem' }}
                placeholder="you@example.com"
                name="email"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'white', fontSize: 'calc(0.875rem + 5px)' }}>
              Password
            </label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'white' }} />
              <input
                type="password"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required
                className="w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0085d7]/50 app-input transition-all duration-300 border border-gray-700/50 group-hover:border-[#0085d7]/30"
                style={{ fontSize: '1rem' }}
                placeholder="••••••••"
                name="password"
              />
            </div>
            {type === 'login' && (
              <div className="mt-4 text-right">
                <button
                  onClick={handleForgotPassword}
                  className="text-sm hover:text-white" /* Changed from hover:text-blue-300 */
                  style={{ color: 'white', fontSize: '0.875rem' }}
                >
                  <span className="whitespace-nowrap">{resetSent ? 'Resend reset email' : 'Forgot password?'}</span>
                </button>
              </div>
            )}
          </div>

          {type === 'register' && (
            <div className="relative z-0 my-6">
              <ReCaptcha
                onVerify={(token) => {
                  setRecaptchaToken(token);
                  setError(null);
                }}
                onError={(error) => setError(error)}
              />
            </div>
          )}

          <div className="relative z-10">
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-lg font-medium transition-colors cursor-pointer app-button"
              style={{
                background: 'linear-gradient(90deg, rgba(0, 133, 215, 0.3) 0%, rgba(0, 169, 224, 0.3) 100%)',
                boxShadow: '0 0 15px rgba(0, 169, 224, 0.4)',
                border: '1px solid rgba(192, 192, 192, 0.5)',
                color: 'white',
                fontSize: '1.125rem'
              }}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 mx-auto animate-spin app-icon" />
              ) : type === 'login' ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </button>
          </div>

          <div className="mt-8 flex flex-col items-center">
            <p className="text-sm mb-4" style={{ color: 'white', fontSize: '0.875rem' }}>Or sign in with</p>
            
            <div className="flex gap-4 justify-center w-full">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading || googleLoading || telegramLoading}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 rounded-md transition-all duration-300 hover:transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`}
                style={{
                  background: 'rgba(24, 24, 27, 0.92)',
                  boxShadow: '0 0 10px rgba(0, 169, 224, 0.10)',
                  border: 'none',
                  fontSize: '0.9rem'
                }}
              >
                {googleLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20px" height="20px">
                      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                    </svg>
                    <span style={{ color: 'white', fontSize: '0.9rem' }}>Google</span>
                  </>
                )}
              </button>
              
              <div className="telegram-button-container relative flex-1">
               <div style={{
                 position: 'absolute',
                 inset: 0,
                 background: 'rgba(24, 24, 27, 0.92)',
                 borderRadius: '8px',
                 border: 'none',
                 boxShadow: '0 0 10px rgba(0, 169, 224, 0.10)',
                 zIndex: -1
               }}></div>
                <TelegramLoginButton
                  dataOnauth={handleTelegramResponse}
                  botName={telegramBotName}
                  buttonSize="medium"
                  cornerRadius={8}
                  requestAccess="write"
                  usePic={false}
                />
                {telegramLoading && (
                  <div className={`absolute inset-0 flex items-center justify-center rounded-md ${
                    theme === 'dark' ? 'bg-gray-800/80' : 'bg-blue-800/50'
                  }`}>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
      <style jsx>{`
        .telegram-button-container {
          display: flex;
          justify-content: center;
          margin-top: 0;
          height: 48px;
        }
        
        /* Override Telegram button styles to match theme */
        .telegram-button-container iframe {
          max-width: 100% !important;
          width: 100% !important;
          height: 46px !important;
        }
      `}</style>
    </div>
  );
}
