// src/components/weather/RainGauge.jsx
export default function RainGauge({ probability = 0, height = 160 }) {
  const fillH = probability / 100 * (height - 20);
  const color = probability > 60 ? '#0067FF' : probability > 30 ? '#64C4FF' : '#333';

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.55rem', letterSpacing: '0.15em', color: '#555', marginBottom: 10, textTransform: 'uppercase' }}>
        Rain Probability
      </div>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        {/* Tube */}
        <div style={{
          width: 48,
          height,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '24px',
          overflow: 'hidden',
          position: 'relative',
        }}>
          {/* Fill */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: fillH,
            background: `linear-gradient(to top, ${color}, ${color}80)`,
            borderRadius: '0 0 24px 24px',
            transition: 'height 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.5s ease',
            boxShadow: probability > 30 ? `0 0 12px ${color}40` : 'none',
          }} />
          {/* Tick marks */}
          {[25, 50, 75].map((pct) => (
            <div key={pct} style={{
              position: 'absolute',
              left: '60%',
              bottom: `${pct / 100 * (height - 20)}px`,
              width: '35%',
              height: 1,
              background: 'rgba(255,255,255,0.08)',
            }} />
          ))}
        </div>

        {/* Value label */}
        <div style={{
          fontFamily: 'Orbitron, monospace',
          fontSize: '1.2rem',
          fontWeight: 700,
          color,
          marginTop: 10,
          transition: 'color 0.5s ease',
        }}>
          {Math.round(probability)}%
        </div>
      </div>
    </div>
  );
}
