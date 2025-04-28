import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Only load variables with the VITE_ prefix for client-side safety
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  
  // Create a safe subset of environment variables for client exposure
  // This prevents sensitive API keys from being bundled with client code
  const safeClientEnv = {};
  
  // Only include safe environment variables that should be exposed to the client
  // Explicitly define which VITE_ variables should be exposed
  const safeEnvVars = [
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_APP_ID',
    'VITE_FIREBASE_API_KEY',
    'VITE_RECAPTCHA_SITE_KEY', // Only the site key is safe for client
    'VITE_STRIPE_PRICE_7000_TOKENS',
    'VITE_STRIPE_PRICE_40000_TOKENS',
    'VITE_STRIPE_PRICE_100000_TOKENS',
    'VITE_TEST_JAMES',
    'VITE_SITE_NAME'
  ];
  
  // Populate the safe environment object
  for (const key of safeEnvVars) {
    if (key in env) {
      safeClientEnv[key] = env[key];
    }
  }
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    optimizeDeps: {
      include: ['@stripe/stripe-js'],
      exclude: ['lucide-react'],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            stripe: ['@stripe/stripe-js'],
          },
        },
      },
    },
    // Only expose safe env variables to the client
    define: {
      // Instead of exposing all env vars, only expose the safe subset
      'import.meta.env': JSON.stringify(safeClientEnv),
      // Keep the RECAPTCHA_SITE_KEY available for specific components that need it
      'import.meta.env.VITE_RECAPTCHA_SITE_KEY': JSON.stringify(env.VITE_RECAPTCHA_SITE_KEY || '')
      // Remove RECAPTCHA_SECRET_KEY as it should never be exposed to the client
    },
    server: {
      port: 5173,
      host: true,
    }
  };
});
