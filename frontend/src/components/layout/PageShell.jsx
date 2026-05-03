// src/components/layout/PageShell.jsx
// Global layout: session polling lives here so ALL pages have access to isLive / sessionKey
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useLivePoll } from '@/hooks/useLivePoll';
import { useSessionStore } from '@/store/sessionStore';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

function GlobalSessionPoller() {
  const { setSession, updateTiming, setLive, isLive } = useSessionStore();

  // Poll session status every 10 s (always active) — populates isLive & sessionKey globally
  useLivePoll('/api/live/session', (d) => {
    setSession(d);
    setLive(d?.is_live || false);
  }, 10000);

  // Poll live timing every 5 s (only when a race is active)
  useLivePoll('/api/live/timing', updateTiming, 5000, isLive);

  return null; // renders nothing — side-effects only
}

export default function PageShell() {
  const location = useLocation();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0D0D0D' }}>
      {/* Global session poller — runs on every page */}
      <GlobalSessionPoller />

      <Navbar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Sidebar */}
        <Sidebar />

        {/* Main content area */}
        <main
          style={{
            flex: 1,
            padding: '28px 32px',
            overflowY: 'auto',
            overflowX: 'hidden',
            position: 'relative',
            minWidth: 0,
            backgroundImage: `
              radial-gradient(ellipse at top right, rgba(225,6,0,0.03) 0%, transparent 50%),
              linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
            `,
            backgroundSize: '100% 100%, 64px 64px, 64px 64px',
          }}
          id="main-content"
        >
          <AnimatePresence mode="wait" initial={false}>
            <Outlet key={location.pathname} />
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
