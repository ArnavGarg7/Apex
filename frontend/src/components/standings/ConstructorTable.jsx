// src/components/standings/ConstructorTable.jsx
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { getTeamColor } from '@/utils/f1Colors';

export default function ConstructorTable({ standings = [] }) {
  const rowsRef = useRef([]);

  useEffect(() => {
    gsap.fromTo(
      rowsRef.current.filter(Boolean),
      { x: -20, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.4, stagger: 0.04, ease: 'power2.out' }
    );
  }, [standings]);

  return (
    <table className="apex-table">
      <thead>
        <tr>
          <th style={{ width: 50 }}>POS</th>
          <th>CONSTRUCTOR</th>
          <th style={{ textAlign: 'right' }}>PTS</th>
          <th style={{ textAlign: 'right' }}>GAP</th>
          <th style={{ textAlign: 'right' }}>WINS</th>
        </tr>
      </thead>
      <tbody>
        {standings.map((c, i) => {
          const color = getTeamColor(c.team_name);
          return (
            <tr key={c.team_name} ref={(el) => (rowsRef.current[i] = el)}>
              <td>
                <span style={{ fontFamily: 'Orbitron, monospace', fontWeight: 700, fontSize: '0.85rem' }}>{c.position}</span>
              </td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 3, height: 24, background: color, borderRadius: 2, boxShadow: `0 0 6px ${color}50` }} />
                  <span style={{ fontFamily: 'Titillium Web, sans-serif', fontWeight: 700, fontSize: '0.85rem' }}>{c.team_name}</span>
                </div>
              </td>
              <td style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.9rem', fontWeight: 700, textAlign: 'right' }}>{c.points}</td>
              <td style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.7rem', color: '#555', textAlign: 'right' }}>{c.gap_to_leader > 0 ? `-${c.gap_to_leader}` : '—'}</td>
              <td style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.75rem', color: '#808080', textAlign: 'right' }}>{c.wins}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
