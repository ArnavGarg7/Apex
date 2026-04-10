// src/components/layout/PageShell.jsx
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function PageShell() {
  const location = useLocation();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0D0D0D' }}>
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
            // Subtle dark grid pattern to fill the void
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
