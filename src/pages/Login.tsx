import React from 'react';
import { AuthForm } from '../components/AuthForm';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { ParticleBackground } from '../components/ParticleBackground';
import { VerticalCircuitLines } from '../components/VerticalCircuitLines';

export function Login() {
  const { user, authLoading } = useFirebaseAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();

  React.useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  if (authLoading || user) {
    return <div className="flex items-center justify-center min-h-screen text-white">Loading...</div>;
  }

  return (
      <div
        className="min-h-screen w-full flex flex-col items-center justify-center p-0 m-0 text-white overflow-hidden relative"
        style={{ 
         background: '#18181b !important',
          color: '#e6f1ff',
          minHeight: '100vh',
          width: '100vw',
          border: 'none',
          outline: 'none',
         paddingBottom: '50px',
         position: 'relative',
         margin: 0,
         padding: 0
        }}
      >
        {/* Particle Background */}
        <div className="absolute inset-0 z-0">
          <VerticalCircuitLines theme="light" />
        </div>
        
        <div className="relative z-10 flex flex-col items-center justify-center px-6 py-8 w-full max-w-md mx-auto">
          <Link to="/" className="mb-8">
          </Link>
          <div className="rounded-xl p-8 relative z-10 w-full" 
            style={{
              background: 'rgba(24, 24, 27, 0.92)',
              backdropFilter: 'blur(10px)',
              border: 'none',
              boxShadow: '0 0 30px rgba(0, 169, 224, 0.15)'
            }}>
            <AuthForm type="login" />
          </div>
          <p className="mt-8 text-white text-center">
            <span style={{ fontSize: 'calc(1rem + 3px)', color: 'white' }}>Don't have an account?{' '}</span>
            <Link
              to="/register"
              className="font-large"
              style={{
                color: 'white',
                fontSize: 'calc(1rem + 4px)'
              }}
            >
              Sign up
            </Link>
          </p>
        </div>
    </div>
  );
}