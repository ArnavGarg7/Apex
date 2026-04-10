// src/pages/Auth.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithGoogle } from '@/firebase';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card panel" style={{ textAlign: 'center' }}>
        {/* Logo */}
        <div style={{ marginBottom: 32 }}>
          <div style={{
            fontFamily: 'Orbitron, monospace',
            fontWeight: 900,
            fontSize: '2.5rem',
            color: '#E10600',
            letterSpacing: '0.2em',
            textShadow: '0 0 30px rgba(225,6,0,0.4)',
          }}>
            APEX
          </div>
          <div style={{
            fontFamily: 'Titillium Web, sans-serif',
            fontSize: '0.7rem',
            letterSpacing: '0.4em',
            color: '#555',
            textTransform: 'uppercase',
            marginTop: 6,
          }}>
            F1 Intelligence Dashboard
          </div>
          <div style={{
            width: 40,
            height: 2,
            background: '#E10600',
            margin: '12px auto 0',
            borderRadius: 1,
          }} />
        </div>

        {/* Auth prompt */}
        <div style={{
          fontFamily: 'Titillium Web, sans-serif',
          color: '#808080',
          fontSize: '0.85rem',
          marginBottom: 24,
        }}>
          Access is restricted to authorized users.
          <br />Sign in to continue.
        </div>

        {/* Google Sign In */}
        <button
          id="google-signin-btn"
          onClick={handleGoogleSignIn}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 24px',
            background: '#FFFFFF',
            color: '#111',
            border: 'none',
            borderRadius: 6,
            fontFamily: 'Titillium Web, sans-serif',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: loading ? 'wait' : 'pointer',
            width: '100%',
            justifyContent: 'center',
            boxShadow: '0 2px 0 #0A0A0A, 0 4px 8px rgba(0,0,0,0.5)',
            transition: 'transform 150ms ease, box-shadow 150ms ease',
            opacity: loading ? 0.7 : 1,
          }}
          onMouseDown={(e) => { e.currentTarget.style.transform = 'translateY(2px)'; e.currentTarget.style.boxShadow = '0 0px 0 #0A0A0A'; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 0 #0A0A0A, 0 4px 8px rgba(0,0,0,0.5)'; }}
        >
          <svg width={20} height={20} viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loading ? 'Signing in...' : 'Continue with Google'}
        </button>

        {error && (
          <div style={{ color: '#E10600', fontFamily: 'Titillium Web, sans-serif', fontSize: '0.75rem', marginTop: 16 }}>
            {error}
          </div>
        )}

        <div style={{ fontFamily: 'Titillium Web, sans-serif', color: '#333', fontSize: '0.6rem', marginTop: 24 }}>
          APEX F1 Intelligence · Live data delayed ~30 seconds
        </div>
      </div>
    </div>
  );
}
