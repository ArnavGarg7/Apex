// src/components/shared/CountdownTimer.jsx
import { useState, useEffect } from 'react';
import { timeUntil, formatCountdown } from '@/utils/timeZone';

export default function CountdownTimer({ targetDate, label }) {
  const [remaining, setRemaining] = useState(() => timeUntil(targetDate));

  useEffect(() => {
    if (!targetDate) return;
    const timer = setInterval(() => {
      setRemaining(timeUntil(targetDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  const isFinal24h = remaining && remaining.days === 0;
  const isExpired  = remaining === null;

  return (
    <div style={{ textAlign: 'center' }}>
      {label && (
        <div style={{
          fontFamily: 'Titillium Web, sans-serif',
          fontSize: '0.6rem',
          letterSpacing: '0.15em',
          color: '#606060',
          textTransform: 'uppercase',
          marginBottom: 4,
        }}>
          {label}
        </div>
      )}
      <div
        style={{
          fontFamily: 'Orbitron, monospace',
          fontSize: '1.1rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          color: isExpired ? '#555555' : isFinal24h ? '#E10600' : '#FFFFFF',
          transition: 'color 0.5s ease',
        }}
        aria-live="polite"
        aria-atomic="true"
      >
        {isExpired ? 'RACE STARTED' : formatCountdown(remaining)}
      </div>
    </div>
  );
}
