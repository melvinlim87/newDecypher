import React, { useEffect, useCallback } from 'react';

interface ReCaptchaProps {
  onVerify: (token: string) => void;
  onError?: (error: string) => void;
}

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';

declare global {
  interface Window {
    onRecaptchaVerify: (token: string) => void;
    grecaptcha?: {
      render: (element: HTMLElement | string, options: any) => number;
      reset: (widgetId?: number) => void;
    };
  }
}

export const ReCaptcha: React.FC<ReCaptchaProps> = ({ onVerify, onError }) => {
  const handleVerify = useCallback((token: string) => {
    console.log('reCAPTCHA verified');
    onVerify(token);
  }, [onVerify]);

  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY) {
      console.error('reCAPTCHA site key is missing');
      onError?.('reCAPTCHA configuration error');
      return;
    }

    // Register the callback globally
    window.onRecaptchaVerify = handleVerify;

    // Load the reCAPTCHA script
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      // Cleanup
      delete window.onRecaptchaVerify;
      document.querySelectorAll('script[src*="recaptcha/api.js"]')
        .forEach(s => s.remove());
    };
  }, [handleVerify, onError]);

  if (!RECAPTCHA_SITE_KEY) {
    return (
      <div className="text-white text-sm">
        reCAPTCHA is not properly configured. Please contact support.
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center w-full scale-90 origin-center">
      <div
        className="g-recaptcha"
        data-sitekey={RECAPTCHA_SITE_KEY}
        data-theme="dark"
        data-callback="onRecaptchaVerify"
      />
    </div>
  );
};