// src/components/weather/RainGauge.jsx — Animated glass tube with visible fill at all probability levels
export default function RainGauge({ probability = 0, height = 160 }) {
  const pct  = Math.min(100, Math.max(0, probability));
  // fillH is the pixel height of liquid inside the tube
  const fillH = (pct / 100) * (height - 20);

  // Colour scale: even 1% shows a visible teal, ramping to deep blue at 100%
  // Dry   0–10%  → dim steel blue
  // Low  10–30%  → muted cyan
  // Med  30–60%  → sky blue
  // High 60–80%  → vivid blue
  // Max  80–100% → deep electric blue with glow
  const getColor = (p) => {
    if (p >= 80) return { fill: '#0050FF', glow: 'rgba(0,80,255,0.45)', label: '#3B9EFF' };
    if (p >= 60) return { fill: '#1474FF', glow: 'rgba(20,116,255,0.35)', label: '#64C4FF' };
    if (p >= 30) return { fill: '#38AAFF', glow: 'rgba(56,170,255,0.25)', label: '#38AAFF' };
    if (p >= 10) return { fill: '#5EC8D8', glow: 'rgba(94,200,216,0.2)', label: '#5EC8D8' };
    return        { fill: '#3A5F70', glow: 'none',                   label: '#4A7080' };
  };

  const { fill, glow, label } = getColor(pct);

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        fontFamily: 'Orbitron, monospace', fontSize: '0.55rem',
        letterSpacing: '0.15em', color: '#555',
        marginBottom: 10, textTransform: 'uppercase',
      }}>
        Rain Probability
      </div>

      <div style={{ position: 'relative', display: 'inline-block' }}>
        {/* Outer glass shell */}
        <div style={{
          width: 48,
          height,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '24px',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: pct >= 10 ? `inset 0 0 16px ${glow}` : 'none',
        }}>
          {/* Liquid fill — always renders if pct > 0, minimum 3px so it's always visible */}
          {pct > 0 && (
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: Math.max(fillH, 3),
              background: `linear-gradient(to top, ${fill}, ${fill}80)`,
              borderRadius: '0 0 24px 24px',
              transition: 'height 0.9s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.5s ease',
              boxShadow: pct >= 10 ? `0 0 14px ${glow}` : 'none',
            }} />
          )}

          {/* Glass highlight — thin bright streak on left side */}
          <div style={{
            position: 'absolute',
            top: 8, left: 10,
            width: 4,
            height: height - 16,
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.18), rgba(255,255,255,0.04))',
            borderRadius: 2,
            pointerEvents: 'none',
          }} />

          {/* Tick marks */}
          {[25, 50, 75].map((tick) => (
            <div key={tick} style={{
              position: 'absolute',
              left: '55%',
              bottom: `${(tick / 100) * (height - 20)}px`,
              width: '38%',
              height: 1,
              background: 'rgba(255,255,255,0.1)',
              pointerEvents: 'none',
            }} />
          ))}
        </div>

        {/* Percentage label */}
        <div style={{
          fontFamily: 'Orbitron, monospace',
          fontSize: '1.2rem',
          fontWeight: 700,
          color: label,
          marginTop: 10,
          transition: 'color 0.5s ease',
          textShadow: pct >= 10 ? `0 0 12px ${glow}` : 'none',
        }}>
          {Math.round(pct)}%
        </div>
      </div>
    </div>
  );
}
