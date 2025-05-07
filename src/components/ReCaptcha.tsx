import React, { useEffect, useCallback, useState, useRef, memo } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

interface ReCaptchaProps {
  onVerify: (token: string) => void;
  onError?: (error: string) => void;
}

declare global {
  interface Window {
    onRecaptchaVerify: (token: string) => void;
    onRecaptchaLoaded: () => void;
    grecaptcha?: {
      render: (element: HTMLElement | string, options: any) => number;
      reset: (widgetId?: number) => void;
      execute: (sitekey: string, options?: any) => Promise<string>;
      ready: (callback: () => void) => void;
    };
  }
}

export const ReCaptcha: React.FC<ReCaptchaProps> = memo(({ onVerify, onError }) => {
  const [siteKey, setSiteKey] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [widgetId, setWidgetId] = useState<number | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState<boolean>(false);
  const [rendered, setRendered] = useState<boolean>(false);
  const recaptchaRef = useRef<HTMLDivElement>(null);
  
  // Fetch the reCAPTCHA site key from the backend
  useEffect(() => {
    const fetchSiteKey = async () => {
      try {
        setLoading(true);
        const response = await axios.get<{success: boolean, siteKey: string}>(`${API_BASE_URL}/config/recaptcha`);
        if (response.data.success && response.data.siteKey) {
          setSiteKey(response.data.siteKey);
        } else {
          console.error('Failed to fetch reCAPTCHA site key');
          onError?.('reCAPTCHA configuration error');
          setError(true);
        }
      } catch (err) {
        console.error('Error fetching reCAPTCHA site key:', err);
        onError?.('reCAPTCHA configuration error');
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSiteKey();
  }, [onError, API_BASE_URL]);
  
  const handleVerify = useCallback(async (token: string) => {
    console.log('reCAPTCHA token received, verifying with backend...');
    try {
      // Verify the token with our backend
      const verifyResponse = await axios.post<{success: boolean, message: string}>(
        `${API_BASE_URL}/verify-recaptcha`,
        { token }
      );
      
      if (verifyResponse.data.success) {
        console.log('reCAPTCHA verified successfully');
        onVerify(token);
      } else {
        console.error('reCAPTCHA verification failed:', verifyResponse.data.message);
        onError?.('reCAPTCHA verification failed');
      }
    } catch (err) {
      console.error('Error verifying reCAPTCHA:', err);
      onError?.('Error verifying reCAPTCHA');
    }
  }, [onVerify, onError, API_BASE_URL]);

  // Load reCAPTCHA script once
  useEffect(() => {
    if (scriptLoaded || !siteKey || loading) {
      return;
    }

    // Register callback for token verification
    window.onRecaptchaVerify = handleVerify;

    // Create a unique callback name to avoid conflicts
    const callbackName = `onRecaptchaLoaded_${Date.now()}`;
    
    // Register the callback globally
    (window as any)[callbackName] = () => {
      console.log('reCAPTCHA script loaded');
      setScriptLoaded(true);
    };

    // Load the reCAPTCHA script
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?onload=${callbackName}&render=explicit`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      // Cleanup
      if ((window as any)[callbackName]) {
        delete (window as any)[callbackName];
      }
      if (window.onRecaptchaVerify) {
        window.onRecaptchaVerify = () => {};
      }
    };
  }, [siteKey, loading, handleVerify, scriptLoaded]);

  // Render the reCAPTCHA widget when script is loaded
  useEffect(() => {
    if (!scriptLoaded || rendered || !recaptchaRef.current || !window.grecaptcha) {
      return;
    }

    try {
      // Small timeout to ensure DOM is ready
      setTimeout(() => {
        try {
          if (recaptchaRef.current && window.grecaptcha) {
            // Clear any existing content
            if (recaptchaRef.current.innerHTML !== '') {
              recaptchaRef.current.innerHTML = '';
            }
            
            const id = window.grecaptcha.render(recaptchaRef.current, {
              'sitekey': siteKey,
              'theme': 'dark',
              'callback': 'onRecaptchaVerify'
            });
            setWidgetId(id);
            setRendered(true);
            console.log('reCAPTCHA widget rendered with ID:', id);
          }
        } catch (err) {
          console.error('Error rendering reCAPTCHA widget:', err);
          setError(true);
          onError?.('Error rendering reCAPTCHA widget');
        }
      }, 100);
    } catch (err) {
      console.error('Error initializing reCAPTCHA:', err);
      setError(true);
      onError?.('Error initializing reCAPTCHA');
    }

    return () => {
      // Cleanup
      if (widgetId !== null && window.grecaptcha) {
        try {
          window.grecaptcha.reset(widgetId);
        } catch (e) {
          console.error('Error resetting reCAPTCHA:', e);
        }
      }
    };
  }, [scriptLoaded, rendered, siteKey, widgetId, onError]);

  if (loading) {
    return (
      <div className="text-white text-sm flex items-center justify-center">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
        Loading reCAPTCHA...
      </div>
    );
  }
  
  if (error || !siteKey) {
    return (
      <div className="text-white text-sm">
        reCAPTCHA is not properly configured. Please contact support.
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center w-full scale-90 origin-center">
      <div 
        ref={recaptchaRef} 
        className="g-recaptcha" 
        style={{ minHeight: '78px', display: 'flex', justifyContent: 'center' }}
      />
    </div>
  );
}, () => {
  // This prevents re-renders when parent component changes
  // We always return true to ensure the component never re-renders
  // when parent components change state (like typing in input fields)
  return true; // Always use the same instance
});