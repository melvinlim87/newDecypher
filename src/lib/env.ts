export const getEnvVar = (key: string): string => {
  // For Netlify, environment variables are prefixed with REACT_APP_
  const netlifyVar = `REACT_APP_${key}`;
  
  // Check Netlify environment variables first
  if (process.env[netlifyVar]) {
    return process.env[netlifyVar] as string;
  }
  
  // Then check Next.js / local environment variables
  if (process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV === 'development') {
    const localVar = `NEXT_PUBLIC_${key}`;
    return process.env[localVar] as string;
  }

  throw new Error(`Environment variable ${key} is not defined`);
};

// Define specific environment variables
export const ENV = {
  CHART_IMG_API_KEY: () => getEnvVar('CHART_IMG_API_KEY'),
} as const;
