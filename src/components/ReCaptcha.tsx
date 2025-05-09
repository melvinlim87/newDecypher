import { useEffect, useCallback, useState, useRef, memo, forwardRef, useImperativeHandle } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

interface ReCaptchaProps {
  onVerify: (token: string) => void;
  onError?: (error: string) => void;
}

export interface ReCaptchaRef {
  reset: () => void;
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

export const ReCaptcha = memo(forwardRef<ReCaptchaRef, ReCaptchaProps>(({ onVerify, onError }, ref) => {
  const [siteKey, setSiteKey] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [widgetId, setWidgetId] = useState<number | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState<boolean>(false);
  const [rendered, setRendered] = useState<boolean>(false);
  const [recaptchaSize, setRecaptchaSize] = useState<'normal' | 'compact'>('normal');
  const recaptchaRef = useRef<HTMLDivElement>(null);

  // Responsive size handler
  useEffect(() => {
    const handleResize = () => {
      setRecaptchaSize(window.innerWidth < 400 ? 'compact' : 'normal');
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // initial
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Expose the reset method to parent components
  useImperativeHandle(ref, () => ({
    reset: () => {
      if (window.grecaptcha && widgetId !== null) {
        window.grecaptcha.reset(widgetId);
        console.log('reCAPTCHA has been reset');
      }
    }
  }));
  
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
    console.log('reCAPTCHA token received:', token);
    console.log('Token length:', token.length);
    
    // Directly pass the token to the parent component without backend verification
    // This simplifies the flow and ensures the token is passed correctly
    onVerify(token);
    
    // Log that we've passed the token to the parent
    console.log('Token passed to parent component');
    
    /* Commenting out backend verification in the component to simplify the flow
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
    */
  }, [onVerify, onError]);

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
            
            // Use a direct callback function instead of a global function name
            const id = window.grecaptcha.render(recaptchaRef.current, {
              'sitekey': siteKey,
              'theme': 'dark',
              'size': recaptchaSize,
              'callback': (token: string) => {
                console.log('Direct callback received token:', token);
                handleVerify(token);
              }
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
      <div className="recaptcha-container" style={{ marginBottom: '20px' }}>
        <div className="flex justify-center items-center h-[78px] w-full">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-300"></div>
        </div>
      </div>
    );
  }
  
  if (error || !siteKey) {
    return (
      <div className="recaptcha-container" style={{ marginBottom: '20px' }}>
        <div className="flex justify-center items-center h-[78px] w-full bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-500 text-sm">Error loading reCAPTCHA. Please refresh the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="recaptcha-container recaptcha-responsive" style={{ marginBottom: '20px' }}>
      <div 
        ref={recaptchaRef} 
        className={`g-recaptcha ${(loading || error) ? 'hidden' : ''}`}
      />
    </div>
  
  );
}), () => true); // Always use the same instance

// Responsive CSS for reCAPTCHA
// Add this to your global styles or import in your main CSS file
// .recaptcha-responsive { max-width: 100%; overflow-x: auto; display: flex; justify-content: center; }