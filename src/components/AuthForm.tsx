import React, { useState, useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import axios from 'axios';
import { FIREBASE_LOGIN_URL, API_BASE_URL } from '../config';
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
import { ReCaptcha, ReCaptchaRef } from './ReCaptcha';
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
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCaptchaRef>(null);
  const [resetSent, setResetSent] = useState(false);
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref');
  
  // Validation states
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const [passwordValid, setPasswordValid] = useState<boolean | null>(null);
  const [nameValid, setNameValid] = useState<boolean | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);
  
  const { theme } = useTheme();
  
  // Regex patterns for validation
  const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

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

  // Sanitize input to prevent XSS attacks
  const sanitizeInput = (input: string): string => {
    return DOMPurify.sanitize(input.trim());
  };
  
  // Validate email with regex
  const validateEmail = (email: string): boolean => {
    return EMAIL_REGEX.test(email);
  };
  
  // Validate password strength
  const validatePassword = (password: string): boolean => {
    return PASSWORD_REGEX.test(password);
  };
  
  // Calculate password strength
  const calculatePasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
    let score = 0;
    
    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    
    // Complexity checks
    if (/[a-z]/.test(password)) score += 1; // lowercase
    if (/[A-Z]/.test(password)) score += 1; // uppercase
    if (/\d/.test(password)) score += 1;    // numbers
    if (/[^a-zA-Z\d]/.test(password)) score += 1; // special chars
    
    // Determine strength based on score
    if (score < 3) return 'weak';
    if (score < 5) return 'medium';
    return 'strong';
  };
  
  // Handle input changes with validation
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setEmailValid(validateEmail(value));
  };
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    setPasswordValid(validatePassword(value));
    setPasswordStrength(calculatePasswordStrength(value));
  };
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    setNameValid(value.length >= 2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validate all inputs before submission
    if (type === 'register') {
      if (!nameValid && name.trim()) {
        setError('Please enter a valid name (at least 2 characters)');
        return;
      }
      
      if (!emailValid) {
        setError('Please enter a valid email address');
        return;
      }
      
      if (!passwordValid) {
        setError('Password must be at least 8 characters and include uppercase, lowercase, number, and special character');
        return;
      }
    }
    
    setLoading(true);

    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const email = sanitizeInput(formData.get('email') as string);
    const password = formData.get('password') as string; // Don't sanitize password to preserve special characters

    try {
      // Clear any existing session data
      sessionStorage.clear();

      if (type === 'register') {
        // Additional security checks for registration
        console.log('Checking recaptchaToken before submission:', recaptchaToken);
        if (!recaptchaToken) {
          console.error('recaptchaToken is null or empty');
          throw new Error('Please complete the reCAPTCHA verification');
        }
        console.log('recaptchaToken is valid, proceeding with verification');
        
        // Check for common SQL injection patterns
        const sqlInjectionPattern = /('|--|;|\b(ALTER|CREATE|DELETE|DROP|EXEC(UTE){0,1}|INSERT( +INTO){0,1}|MERGE|SELECT|UPDATE|UNION( +ALL){0,1})\b)/i;
        if (sqlInjectionPattern.test(email) || sqlInjectionPattern.test(name)) {
          throw new Error('Invalid input detected');
        }

        // Verify reCAPTCHA token using our backend API
        try {
          const verifyResponse = await axios.post<{success: boolean, message: string}>(`${API_BASE_URL}/verify-recaptcha`, {
            token: recaptchaToken
          });
          
          if (!verifyResponse.data.success) {
            throw new Error(verifyResponse.data.message || 'reCAPTCHA verification failed');
          }
          
          console.log('reCAPTCHA verification successful');
        } catch (err: any) {
          console.error('reCAPTCHA verification error:', err);
          throw new Error(err.response?.data?.message || 'reCAPTCHA verification failed');
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
        // Set registration complete flag to show loading overlay
        setRegistrationComplete(true);
        // Add a small delay to ensure the loading overlay is shown
        setTimeout(() => {
          navigate('/');
        }, 500);
      } else {
        // 1. Sign in with Firebase
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        // 2. Get Firebase ID token
        const idToken = await userCredential.user.getIdToken();
        // 3. Exchange for Sanctum token
        try {
          // Log the token length for debugging (don't log the full token for security)
          console.log(`Firebase ID token obtained (length: ${idToken.length})`); 
          
          // Try a different approach - use fetch with more detailed error handling
          console.log('Calling firebase-login endpoint with token');
          
          // First, try to get a CSRF cookie if needed
          await axios.get(`${FIREBASE_LOGIN_URL.split('/api/')[0]}/sanctum/csrf-cookie`, {
            withCredentials: true
          }).catch(e => console.log('CSRF cookie request (this might fail safely):', e.message));
          
          // Then make the actual login request
          const res = await fetch(FIREBASE_LOGIN_URL, {
            method: 'POST',
            credentials: 'include', // Important for cookies
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({ 
              idToken,
              // Include extra info that might help with debugging
              email: userCredential.user.email,
              uid: userCredential.user.uid
            })
          });
          
          if (!res.ok) {
            const errorText = await res.text();
            console.error(`Login failed with status ${res.status}:`, errorText);
            throw new Error(`Server returned ${res.status}: ${errorText || res.statusText}`);
          }
          
          const data = await res.json();
          console.log('Login response:', data);
          
          // Type check for access_token
          if (data && typeof data === 'object' && 'access_token' in data) {
            localStorage.setItem('sanctum_token', data.access_token as string);
            console.log('Token saved to localStorage, redirecting to home');
            navigate('/');
          } else {
            console.error('No access_token in response:', data);
            setError('Failed to authenticate with backend: No access token received');
          }
        } catch (loginError: any) { // Type assertion for error
          console.error('Login error details:', loginError);
          setError(`Backend authentication failed: ${loginError?.message || 'Unknown error'}`);
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(
        err instanceof Error 
          ? err.message.replace('Firebase: ', '') 
          : 'Authentication failed'
      );
      setLoading(false);
      
      // Reset reCAPTCHA if registration failed
      if (type === 'register' && recaptchaRef.current) {
        console.log('Resetting reCAPTCHA after registration failure');
        recaptchaRef.current.reset();
        setRecaptchaToken(null);
      }
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
    
    console.log('Starting Google sign-in process');

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
      
      // Configure Google provider with custom parameters
      const provider = new GoogleAuthProvider();
      
      // Add scopes for Google provider
      provider.addScope('email');
      provider.addScope('profile');
      
      // Set custom parameters
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      console.log('Initialized Google provider, attempting sign-in popup');
      
      // Attempt sign-in with popup
      const result = await signInWithPopup(auth, provider);
      console.log('Google sign-in successful');
      
      const user = result.user;
      console.log('User authenticated:', user.email);
      
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
      console.error('Google sign-in error:', err);
      
      // Check for specific Firebase errors
      if (err instanceof Error) {
        const errorCode = (err as any).code;
        const errorMessage = err.message;
        
        console.log('Error code:', errorCode);
        console.log('Error message:', errorMessage);
        
        // Handle specific error cases
        if (errorCode === 'auth/popup-closed-by-user') {
          setError('Sign-in popup was closed. Please try again.');
        } else if (errorCode === 'auth/popup-blocked') {
          setError('Sign-in popup was blocked by your browser. Please allow popups for this site.');
        } else if (errorCode === 'auth/cancelled-popup-request') {
          setError('Multiple popup requests were made. Please try again.');
        } else if (errorCode === 'auth/network-request-failed') {
          setError('Network error. Please check your internet connection and try again.');
        } else {
          setError(errorMessage.replace('Firebase: ', ''));
        }
      } else {
        setError('Google authentication failed. Please try again.');
      }
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
    <div className="w-full mx-auto relative">
      {/* Registration complete overlay */}
      {registrationComplete && (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
          <p className="text-white text-lg">Registration successful! Redirecting...</p>
        </div>
      )}
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
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center justify-center w-5 h-5">
                  <User className="w-4 h-4" style={{ color: 'white' }} />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={handleNameChange}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0085d7]/50 app-input transition-all duration-300 border ${nameValid === false ? 'border-red-500' : nameValid === true ? 'border-green-500' : 'border-gray-700/50'} group-hover:border-[#0085d7]/30`}
                  style={{ fontSize: '1rem' }}
                  placeholder="Your name"
                  name="name"
                  minLength={2}
                  maxLength={50}
                  pattern="[A-Za-z0-9 ]{2,50}"
                  title="Name must be at least 2 characters"
                />
                {nameValid === false && (
                  <p className="text-red-500 text-xs mt-1">Name must be at least 2 characters</p>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'white', fontSize: 'calc(0.875rem + 5px)' }}>
              Email
            </label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center justify-center w-5 h-5">
                <Mail className="w-4 h-4" style={{ color: 'white' }} />
              </div>
              <input
                type="email"
                value={email} 
                onChange={handleEmailChange} 
                required
                className={`w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0085d7]/50 app-input transition-all duration-300 border ${emailValid === false ? 'border-red-500' : emailValid === true ? 'border-green-500' : 'border-gray-700/50'} group-hover:border-[#0085d7]/30`}
                style={{ fontSize: '1rem' }}
                placeholder="you@example.com"
                name="email"
                pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
                title="Please enter a valid email address"
              />
              {emailValid === false && (
                <p className="text-red-500 text-xs mt-1">Please enter a valid email address</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'white', fontSize: 'calc(0.875rem + 5px)' }}>
              Password
            </label>
            <div className="relative group">
              <div className="absolute left-3 top-1/3 transform -translate-y-1/2 flex items-center justify-center w-5 h-5">
                <Lock className="w-4 h-4" style={{ color: 'white' }} />
              </div>
              <input
                type="password"
                value={password} 
                onChange={handlePasswordChange} 
                required
                className={`w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0085d7]/50 app-input transition-all duration-300 border ${passwordValid === false && type === 'register' ? 'border-red-500' : passwordValid === true ? 'border-green-500' : 'border-gray-700/50'} group-hover:border-[#0085d7]/30`}
                style={{ fontSize: '1rem' }}
                placeholder="••••••••"
                name="password"
                minLength={type === 'register' ? 8 : 1}
                title="Password must be at least 8 characters and include uppercase, lowercase, number, and special character"
              />
              {type === 'register' && (
                <div className="mt-1">
                  <div className="flex items-center space-x-2 mt-1">
                    <div className={`h-1 flex-1 rounded-full ${passwordStrength === 'weak' ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                    <div className={`h-1 flex-1 rounded-full ${passwordStrength === 'medium' || passwordStrength === 'strong' ? 'bg-yellow-500' : 'bg-gray-300'}`}></div>
                    <div className={`h-1 flex-1 rounded-full ${passwordStrength === 'strong' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="text-xs" style={{ color: passwordStrength === 'weak' ? '#f56565' : passwordStrength === 'medium' ? '#ecc94b' : passwordStrength === 'strong' ? '#48bb78' : 'white' }}>
                      {passwordStrength ? passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1) : 'Password strength'}
                    </span>
                  </div>
                  {passwordValid === false && (
                    <p className="text-red-500 text-xs mt-1">Password must have 8+ chars with uppercase, lowercase, number, and special character</p>
                  )}
                </div>
              )}
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
                ref={recaptchaRef}
                onVerify={(token) => {
                  console.log('reCAPTCHA verified, token length:', token.length);
                  setRecaptchaToken(token);
                }}
                onError={(error) => {
                  console.error('reCAPTCHA error:', error);
                  setError('reCAPTCHA verification failed. Please try again.');
                }}
              />
            </div>
          )}

          <div className="relative z-10">
            <button
              type="submit"
              disabled={
                loading || 
                googleLoading || 
                telegramLoading || 
                (type === 'register' && (emailValid === false || passwordValid === false || (name.trim().length > 0 && nameValid === false)))
              }
              className="w-full py-3 px-4 rounded-lg transition-all duration-300 hover:transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #0085d7 0%, #00a9e0 100%)',
                color: 'white',
                boxShadow: '0 0 20px rgba(0, 169, 224, 0.3)',
                fontSize: 'calc(1rem + 2px)'
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
      <style>{`
        .telegram-button-container {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-top: 0;
          height: 48px;
          overflow: visible;
          position: relative;
        }
        
        /* Override Telegram button styles to match theme */
        .telegram-button-container iframe {
          max-width: 100% !important;
          width: 100% !important;
          height: 48px !important;
          position: relative;
          z-index: 10;
          transform: scale(1.01); /* Slightly scale up to ensure text is visible */
        }
        
        /* Mobile responsiveness for Telegram button */
        @media (max-width: 768px) {
          .telegram-button-container iframe {
            transform: scale(1.05);
          }
        }
        
        @media (max-width: 400px) {
          .telegram-button-container iframe {
            transform: scale(1.1);
          }
        }
      `}</style>
    </div>
  );
}
