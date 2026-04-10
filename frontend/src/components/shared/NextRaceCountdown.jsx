// src/components/shared/NextRaceCountdown.jsx
// Premium "Next Race" countdown widget shown on Live page when no session is active.
import { useState, useEffect } from 'react';
import { useRaceData } from '@/hooks/useRaceData';

function pad(n) { return String(n).padStart(2, '0'); }

function useCountdown(targetDate) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!targetDate) return;
    const target = new Date(targetDate);

    const tick = () => {
      const diff = target - new Date();
      if (diff <= 0) { setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return; }
      setTimeLeft({
        days:    Math.floor(diff / 86400000),
        hours:   Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000)  / 60000),
        seconds: Math.floor((diff % 60000)    / 1000),
      });
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return timeLeft;
}

export default function NextRaceCountdown() {
  const currentYear = new Date().getFullYear();
  const { data: events, refetch } = useRaceData(`/api/calendar/${currentYear}`);

  useEffect(() => { refetch(); }, []);

  const now = new Date();
  const nextRace = (events || []).find(e => {
    const d = e.session5_date || e.session5;
    return d && new Date(d) > now;
  });

  const countdown = useCountdown(nextRace?.session5_date || nextRace?.session5);

  if (!nextRace) return (
    <div style={{ textAlign: 'center', padding: '60px 24px' }}>
      <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.7rem', color: '#444', letterSpacing: '0.2em' }}>
        NO UPCOMING RACES FOUND
      </div>
    </div>
  );

  const units = [
    { label: 'DAYS',    value: countdown?.days },
    { label: 'HRS',     value: countdown?.hours },
    { label: 'MIN',     value: countdown?.minutes },
    { label: 'SEC',     value: countdown?.seconds },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px', gap: 32 }}>
      {/* Next race label */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontFamily: 'Orbitron, monospace', fontSize: '0.55rem', color: '#555',
          letterSpacing: '0.3em', marginBottom: 8, textTransform: 'uppercase',
        }}>
          Next Grand Prix
        </div>
        <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.4rem', fontWeight: 800, color: '#fff', letterSpacing: '0.1em' }}>
          {nextRace.event_name}
        </div>
        <div style={{ fontFamily: 'Titillium Web, sans-serif', fontSize: '0.85rem', color: '#666', marginTop: 4 }}>
          {nextRace.location}, {nextRace.country}
        </div>
      </div>

      {/* Countdown digits */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        {units.map(({ label, value }, i) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              {/* Digit box */}
              <div style={{
                background: 'linear-gradient(180deg, #1e1e1e 0%, #141414 100%)',
                border: '1px solid #2a2a2a',
                borderTop: '1px solid #333',
                borderRadius: 6,
                padding: '16px 20px',
                minWidth: 70,
                textAlign: 'center',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.03)',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {/* Scanline divider */}
                <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1, background: 'rgba(0,0,0,0.4)' }} />

                <span style={{
                  fontFamily: 'Orbitron, monospace', fontWeight: 800, fontSize: '2rem', color: value === 0 ? '#E10600' : '#fff',
                  display: 'block', lineHeight: 1, letterSpacing: '0.05em',
                  textShadow: value === 0 ? '0 0 20px rgba(225,6,0,0.6)' : '0 2px 8px rgba(0,0,0,0.8)',
                }}>
                  {value != null ? pad(value) : '--'}
                </span>
              </div>
              <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.5rem', color: '#444', letterSpacing: '0.2em' }}>
                {label}
              </span>
            </div>

            {/* Separator colon */}
            {i < units.length - 1 && (
              <div style={{
                fontFamily: 'Orbitron, monospace', fontSize: '1.5rem', color: '#333',
                marginBottom: 20, animation: 'breathe 1s ease-in-out infinite',
              }}>:</div>
            )}
          </div>
        ))}
      </div>

      {/* Round badge */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '8px 20px',
        border: '1px solid #2a2a2a',
        borderRadius: 4,
        background: 'rgba(255,255,255,0.02)',
      }}>
        <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.55rem', color: '#555', letterSpacing: '0.15em' }}>
          ROUND {nextRace.round_number}
        </span>
        <div style={{ width: 1, height: 12, background: '#2a2a2a' }} />
        <span style={{ fontFamily: 'Titillium Web, sans-serif', fontSize: '0.7rem', color: '#555' }}>
          {nextRace.event_format?.toUpperCase() || 'CONVENTIONAL'}
        </span>
      </div>
    </div>
  );
}
