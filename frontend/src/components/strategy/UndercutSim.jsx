// src/components/strategy/UndercutSim.jsx
import { useState } from 'react';
import { motion } from 'framer-motion';

const NEEDLE_MIN = -120;
const NEEDLE_MAX =  120;

function probToColor(p) {
  if (p > 0.80) return '#39B54A';
  if (p > 0.60) return '#1B9A1B';
  if (p > 0.40) return '#F59E0B';
  return '#808080';
}

export default function UndercutSim({ result, onSimulate, drivers = [] }) {
  const [attacker, setAttacker] = useState('');
  const [defender, setDefender] = useState('');
  const [offset,   setOffset]   = useState(0);

  const prob = result?.undercut_probability || 0;
  const ang  = NEEDLE_MIN + prob * (NEEDLE_MAX - NEEDLE_MIN);
  const color = probToColor(prob);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.55rem', letterSpacing: '0.1em', color: '#555' }}>ATTACKER</label>
          <select
            value={attacker}
            onChange={(e) => setAttacker(e.target.value)}
            style={{ background: '#1A1A1A', border: '1px solid #333', color: '#fff', padding: '6px 10px', borderRadius: 4, fontFamily: 'Orbitron, monospace', fontSize: '0.65rem' }}
          >
            <option value="">Select driver</option>
            {drivers.map((d) => <option key={d.number} value={d.number}>{d.code}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.55rem', letterSpacing: '0.1em', color: '#555' }}>DEFENDER</label>
          <select
            value={defender}
            onChange={(e) => setDefender(e.target.value)}
            style={{ background: '#1A1A1A', border: '1px solid #333', color: '#fff', padding: '6px 10px', borderRadius: 4, fontFamily: 'Orbitron, monospace', fontSize: '0.65rem' }}
          >
            <option value="">Select driver</option>
            {drivers.map((d) => <option key={d.number} value={d.number}>{d.code}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.55rem', letterSpacing: '0.1em', color: '#555' }}>PIT OFFSET (LAPS)</label>
          <input
            type="range" min={-3} max={3} step={1} value={offset}
            onChange={(e) => setOffset(Number(e.target.value))}
            style={{ accentColor: '#E10600', width: 120 }}
          />
          <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.7rem', textAlign: 'center', color: '#808080' }}>
            {offset > 0 ? `+${offset}` : offset} laps
          </span>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => onSimulate?.({ attacker, defender, offset })}
          disabled={!attacker || !defender}
          style={{ alignSelf: 'flex-end' }}
          id="undercut-simulate-btn"
        >
          Simulate
        </button>
      </div>

      {/* Probability gauge */}
      {result && (
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Mini gauge */}
          <div style={{ position: 'relative', width: 140, height: 90 }}>
            <svg viewBox="0 0 140 90" style={{ width: '100%', height: '100%' }}>
              <path d="M 15 80 A 55 55 0 0 1 125 80" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" strokeLinecap="round" />
              <path d="M 15 80 A 55 55 0 0 1 125 80" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
                strokeDasharray={`${prob * 173} 173`}
                style={{ transition: 'stroke-dasharray 0.3s ease, stroke 0.3s ease', filter: `drop-shadow(0 0 4px ${color}80)` }}
              />
              <circle cx="70" cy="80" r="5" fill="#1A1A1A" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
              {/* Needle */}
              <line
                x1="70" y1="80"
                x2={70 + 48 * Math.sin((ang * Math.PI) / 180)}
                y2={80 - 48 * Math.cos((ang * Math.PI) / 180)}
                stroke={color} strokeWidth="2" strokeLinecap="round"
                style={{ transition: 'all 300ms cubic-bezier(0.34,1.56,0.64,1)' }}
              />
            </svg>
            <div style={{ position: 'absolute', bottom: -4, left: '50%', transform: 'translateX(-50%)', fontFamily: 'Orbitron, monospace', fontSize: '1.1rem', fontWeight: 700, color, transition: 'color 0.3s ease' }}>
              {Math.round(prob * 100)}%
            </div>
          </div>

          {/* Details */}
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.8rem', fontWeight: 700, color, marginBottom: 4 }}>
              {result.recommended_action?.replace('_', ' ').toUpperCase()}
            </div>
            <div style={{ fontFamily: 'Titillium Web, sans-serif', fontSize: '0.75rem', color: '#808080', lineHeight: 1.5 }}>
              {result.reasoning}
            </div>
            <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.65rem', color: '#555', marginTop: 6 }}>
              Time delta after pit: {result.time_delta_after_pit > 0 ? '+' : ''}{result.time_delta_after_pit?.toFixed(2)}s
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
