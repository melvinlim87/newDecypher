import { AuthForm } from '../components/AuthForm';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { ParticleBackground } from '../components/ParticleBackground';
import { VerticalCircuitLines } from '../components/VerticalCircuitLines';

export function Register() {
  const { theme } = useTheme();
  
  return (
      <div
        className="min-h-screen w-full flex flex-col items-center justify-center p-0 m-0 text-white overflow-hidden relative"
        style={{ 
         background: `
           linear-gradient(to bottom, 
             rgba(24, 24, 27, 0.95) 0%, 
             rgba(39, 39, 42, 0.92) 50%, 
             rgba(24, 24, 27, 0.95) 100%)
         `,
          color: '#e6f1ff',
          minHeight: '100vh',
          width: '100%',
          border: 'none',
          outline: 'none',
         paddingBottom: '50px',
         position: 'relative'
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
              background: 'linear-gradient(135deg, rgba(24, 24, 27, 0.7) 0%, rgba(39, 39, 42, 0.7) 100%)',
              backdropFilter: 'blur(10px)',
              border: '2px solid rgba(192, 192, 192, 0.5)',
              boxShadow: '0 0 30px rgba(0, 169, 224, 0.3)'
            }}>
            <AuthForm type="register" />
          </div>
         <p className="mt-8 text-white text-center">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium"
              style={{
                color: 'white',
                fontSize: 'calc(1rem + 5px)'
              }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
  );
}