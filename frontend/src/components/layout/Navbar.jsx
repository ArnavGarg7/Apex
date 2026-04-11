// src/components/layout/Navbar.jsx
import { Link } from 'react-router-dom';
import { useSessionStore } from '@/store/sessionStore';
import { useUserStore } from '@/store/userStore';
import { signOutUser } from '@/firebase';
import DataDelayBadge from '@/components/shared/DataDelayBadge';

export default function Navbar() {
  const { currentSession, isLive } = useSessionStore();
  const { user } = useUserStore();

  const sessionLabel = currentSession?.country_name && currentSession?.session_name
    ? `${currentSession.country_name} — ${currentSession.session_name}`
    : null;

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 200,
        height: 56,
        background: 'linear-gradient(180deg, #181818 0%, #111 100%)',
        borderTop: '3px solid #E10600',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        gap: 24,
        boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
      }}
    >
      {/* Logo */}
      <Link to="/dashboard" style={{ textDecoration: 'none', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{
          fontFamily: 'Orbitron, monospace',
          fontWeight: 900,
          fontSize: '1.2rem',
          color: '#E10600',
          letterSpacing: '0.2em',
          textShadow: '0 0 20px rgba(225,6,0,0.5)',
        }}>
          APEX
        </span>
        <div style={{ width: 1, height: 20, background: '#333' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.5rem', color: '#555', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            F1 Intelligence
          </span>
          {sessionLabel && (
            <span style={{ fontFamily: 'Titillium Web, sans-serif', fontSize: '0.65rem', color: isLive ? '#39B54A' : '#888', letterSpacing: '0.05em' }}>
              {sessionLabel}
            </span>
          )}
        </div>
      </Link>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        {isLive && <DataDelayBadge />}

        {/* Live pill */}
        {isLive && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 10px',
            background: 'rgba(225,6,0,0.1)',
            border: '1px solid rgba(225,6,0,0.3)',
            borderRadius: 4,
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%', background: '#E10600',
              boxShadow: '0 0 8px #E10600', animation: 'pulse-dot 1.4s ease-in-out infinite',
            }} />
            <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.55rem', color: '#E10600', letterSpacing: '0.1em' }}>LIVE</span>
          </div>
        )}

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName}
                style={{ width: 30, height: 30, borderRadius: '50%', border: '2px solid #333', boxShadow: '0 0 0 1px rgba(255,255,255,0.05)' }}
              />
            ) : (
              <div style={{
                width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #E10600, #B00500)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Orbitron', fontWeight: 700, fontSize: '0.7rem', color: '#fff',
              }}>
                {(user.displayName || user.email || 'A')[0].toUpperCase()}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <span style={{ fontFamily: 'Titillium Web', fontSize: '0.75rem', fontWeight: 700, color: '#ddd' }}>
                {user.displayName?.split(' ')[0] || 'User'}
              </span>
            </div>
            <button
              onClick={signOutUser}
              className="btn btn-ghost"
              style={{ padding: '4px 12px', fontSize: '0.6rem' }}
              id="nav-signout-btn"
            >
              Exit
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
