// src/components/live/SessionBanner.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LightsOutSequence from '@/components/animations/LightsOutSequence';

export default function SessionBanner({ session }) {
  const [showLights, setShowLights] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const isLive = session?.is_live;

  useEffect(() => {
    if (isLive && !showBanner) {
      setShowLights(true);
    }
  }, [isLive]);

  if (!session) return null;

  return (
    <>
      {/* Lights-out sequence on race start */}
      {showLights && (
        <LightsOutSequence
          onComplete={() => {
            setShowLights(false);
            setShowBanner(true);
          }}
        />
      )}

      {/* Session banner that slides down */}
      <AnimatePresence>
        {showBanner && isLive && (
          <motion.div
            initial={{ y: -52, opacity: 0 }}
            animate={{ y: 0,   opacity: 1 }}
            exit={   { y: -52, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            style={{
              height: 52,
              background: '#1A1A1A',
              borderBottom: '1px solid rgba(225,6,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '0 24px',
              marginBottom: 16,
            }}
          >
            <span className="badge badge-live">LIVE</span>
            <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.7rem', letterSpacing: '0.1em' }}>
              {session.country_name} — {session.session_name}
            </span>
            <span style={{ fontFamily: 'Titillium Web, sans-serif', fontSize: '0.7rem', color: '#808080' }}>
              Lap {session.current_lap || '--'} / {session.total_laps || '--'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
