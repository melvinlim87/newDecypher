import { useEffect, useCallback, useState, useRef, memo, forwardRef, useImperativeHandle } from 'react';

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
  const [widgetId, setWidgetId] = useState<number | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState<boolean>(false);
  const [rendered, setRendered] = useState<boolean>(false);
  const [recaptchaSize, setRecaptchaSize] = useState<'normal' | 'compact'>('normal');
  const recaptchaRef = useRef<HTMLDivElement>(null);

  // Hardcoded site key
  const siteKey = '6LdIpc8qAAAAAJ8_1lOuFEsSArrACxUVMOUZIxsp';

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

  const handleVerify = useCallback((token: string) => {
    console.log('reCAPTCHA token received:', token);
    console.log('Token length:', token.length);
    onVerify(token);
    console.log('Token passed to parent component');
  }, [onVerify]);

  // Load reCAPTCHA script once
  useEffect(() => {
    if (scriptLoaded) {
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
  }, [handleVerify, scriptLoaded]);

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
          onError?.('Error rendering reCAPTCHA widget');
        }
      }, 100);
    } catch (err) {
      console.error('Error initializing reCAPTCHA:', err);
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
  }, [scriptLoaded, rendered, recaptchaSize, siteKey, handleVerify, onError]);

  return (
    <div className="recaptcha-container recaptcha-responsive" style={{ marginBottom: '20px' }}>
      <div ref={recaptchaRef} className="g-recaptcha" />
    </div>
  );
}));