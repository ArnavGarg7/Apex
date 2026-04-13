// src/pages/Teammates.jsx — Teammate Head-to-Head Dominance Tracker
import { useState, useEffect, useRef } from 'react';
import PageTransition from '@/components/animations/PageTransition';
import { useRaceData } from '@/hooks/useRaceData';
import { getTeamColor } from '@/utils/f1Colors';
import * as d3 from 'd3';

const MODES = [
  { key: 'quali',  label: 'QUALIFYING GAP' },
  { key: 'wins',   label: 'RACE WINS'      },
  { key: 'points', label: 'POINTS SPLIT'   },
];

// ── D3 horizontal bar showing two drivers split ───────────────────────────────
function SplitBar({ v1, v2, color1, color2, label1, label2, unit = '' }) {
  const total = (v1 || 0) + (v2 || 0);
  if (total === 0) return null;
  const pct1 = Math.round((v1 / total) * 100);
  const pct2 = 100 - pct1;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', background: '#1a1a1a' }}>
        <div style={{ width: `${pct1}%`, background: color1, transition: 'width 0.8s cubic-bezier(0.2,0.8,0.2,1)' }} />
        <div style={{ width: `${pct2}%`, background: color2, transition: 'width 0.8s cubic-bezier(0.2,0.8,0.2,1)' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.55rem', color: color1 }}>
          {label1} — {v1}{unit}
        </span>
        <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.55rem', color: color2 }}>
          {v2}{unit} — {label2}
        </span>
      </div>
    </div>
  );
}

// ── Team Battle Card ──────────────────────────────────────────────────────────
function TeamCard({ team, mode }) {
  const teamColor = getTeamColor(team.team);
  const d1 = team.driver1;
  const d2 = team.driver2;
  const c1 = teamColor;
  const c2 = teamColor + '88';

  const qualiWinner = d1.quali_wins > d2.quali_wins ? d1 : d2;
  const qualiGapAbs = Math.abs(team.avg_quali_gap_s);
  // avg_quali_gap_s: negative means d1 (higher points) is faster
  const qualiIsD1Faster = team.avg_quali_gap_s <= 0;

  return (
    <div className="panel" style={{
      padding: 0, overflow: 'hidden',
      borderTop: `2px solid ${teamColor}`,
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 32px ${teamColor}22`; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* Team Header */}
      <div style={{
        padding: '12px 20px',
        background: `linear-gradient(90deg, ${teamColor}18 0%, transparent 100%)`,
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{ fontFamily: 'Titillium Web', fontWeight: 700, fontSize: '0.85rem', color: '#ddd' }}>
          {team.team}
        </div>
        {team.rounds_compared > 0 && (
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.45rem', color: '#444', letterSpacing: '0.1em', marginTop: 2 }}>
            {team.rounds_compared} ROUNDS COMPARED
          </div>
        )}
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Driver name row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontFamily: 'Orbitron', fontSize: '1rem', fontWeight: 800, color: c1 }}>{d1.code}</div>
            <div style={{ fontFamily: 'Titillium Web', fontSize: '0.65rem', color: '#888' }}>{d1.name}</div>
          </div>
          <div style={{ fontFamily: 'Orbitron', fontWeight: 900, fontSize: '0.75rem', color: '#333', letterSpacing: '0.1em' }}>VS</div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'Orbitron', fontSize: '1rem', fontWeight: 800, color: '#888' }}>{d2.code}</div>
            <div style={{ fontFamily: 'Titillium Web', fontSize: '0.65rem', color: '#555' }}>{d2.name}</div>
          </div>
        </div>

        {/* Mode-specific content */}
        {mode === 'quali' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Average gap badge */}
            <div style={{ textAlign: 'center', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontFamily: 'Orbitron', fontWeight: 900, fontSize: '1.4rem', color: qualiIsD1Faster ? c1 : '#888' }}>
                {qualiGapAbs.toFixed(3)}s
              </div>
              <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.45rem', color: '#444', letterSpacing: '0.1em', marginTop: 2 }}>
                AVG QUALI DELTA — {qualiIsD1Faster ? d1.code : d2.code} FASTER
              </div>
            </div>
            <SplitBar
              v1={d1.quali_wins} v2={d2.quali_wins}
              color1={c1} color2='#444'
              label1={d1.code} label2={d2.code}
              unit=' Qs'
            />
          </div>
        )}

        {mode === 'wins' && (
          <SplitBar
            v1={d1.wins} v2={d2.wins}
            color1={c1} color2='#444'
            label1={d1.code} label2={d2.code}
            unit=' W'
          />
        )}

        {mode === 'points' && (
          <SplitBar
            v1={d1.points} v2={d2.points}
            color1={c1} color2='#444'
            label1={d1.code} label2={d2.code}
            unit=' PTS'
          />
        )}

        {/* Points row always shown at bottom */}
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <span style={{ fontFamily: 'Orbitron', fontSize: '0.65rem', color: c1, fontWeight: 800 }}>{d1.points} PTS</span>
          <span style={{ fontFamily: 'Orbitron', fontSize: '0.65rem', color: '#555' }}>{d2.points} PTS</span>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Teammates() {
  const [year, setYear]   = useState(2025);
  const [mode, setMode]   = useState('quali');
  const currentYear = new Date().getFullYear();

  const { data, loading, error } = useRaceData(
    `/api/teammates/battle?year=${year}`,
    { immediate: true, deps: [year] }
  );

  const teams = data || [];

  return (
    <PageTransition>
      <title>APEX | Teammate Battle</title>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.2rem', marginBottom: 4 }}>Teammate Battle</h1>
          <p style={{ color: '#555', fontSize: '0.8rem' }}>
            Season-long intra-team dominance — qualifying gaps, race wins & points splits.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="apex-select"
            style={{ width: 'auto', minWidth: 90 }}
          >
            {Array.from({ length: 9 }, (_, i) => currentYear - i + 1).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {/* Mode toggle */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', borderRadius: 24, padding: 4, gap: 2 }}>
            {MODES.map(m => (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                style={{
                  background: mode === m.key ? '#E10600' : 'transparent',
                  color: mode === m.key ? '#fff' : '#555',
                  border: 'none', padding: '6px 14px', borderRadius: 20,
                  fontFamily: 'Orbitron, monospace', fontSize: '0.58rem', fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.25s ease', letterSpacing: '0.08em',
                  whiteSpace: 'nowrap',
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', gap: 16 }}>
          <div className="apex-spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.6rem', color: '#444', letterSpacing: '0.2em' }}>
            FETCHING SEASON DATA...
          </div>
        </div>
      ) : error ? (
        <div className="panel" style={{ borderTop: '2px solid #E10600', textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.65rem', color: '#E10600', letterSpacing: '0.15em' }}>
            FAILED TO LOAD BATTLE DATA
          </div>
        </div>
      ) : teams.length === 0 ? (
        <div className="panel" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.65rem', color: '#333', letterSpacing: '0.15em' }}>
            NO DATA FOR {year} — TRY 2018–2025
          </div>
        </div>
      ) : (
        <>
          {/* Season stat bar */}
          <div className="panel" style={{ marginBottom: 20, display: 'flex', gap: 32, flexWrap: 'wrap', padding: '12px 24px' }}>
            <div>
              <div style={{ fontFamily: 'Orbitron', fontSize: '0.45rem', color: '#444', letterSpacing: '0.15em' }}>TEAMS</div>
              <div style={{ fontFamily: 'Orbitron', fontWeight: 800, fontSize: '1.2rem', color: '#fff' }}>{teams.length}</div>
            </div>
            <div>
              <div style={{ fontFamily: 'Orbitron', fontSize: '0.45rem', color: '#444', letterSpacing: '0.15em' }}>ROUNDS ANALYSED</div>
              <div style={{ fontFamily: 'Orbitron', fontWeight: 800, fontSize: '1.2rem', color: '#fff' }}>
                {Math.max(...teams.map(t => t.rounds_compared), 0)}
              </div>
            </div>
            <div>
              <div style={{ fontFamily: 'Orbitron', fontSize: '0.45rem', color: '#444', letterSpacing: '0.15em' }}>CLOSEST BATTLE (AVG)</div>
              <div style={{ fontFamily: 'Orbitron', fontWeight: 800, fontSize: '1.2rem', color: '#E10600' }}>
                {teams.filter(t => t.rounds_compared > 0).length > 0
                  ? Math.min(...teams.filter(t => t.rounds_compared > 0).map(t => Math.abs(t.avg_quali_gap_s))).toFixed(3) + 's'
                  : '--'}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {teams.map(team => (
              <TeamCard key={team.team} team={team} mode={mode} />
            ))}
          </div>
        </>
      )}
    </PageTransition>
  );
}
