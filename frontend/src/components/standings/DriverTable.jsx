// src/components/standings/DriverTable.jsx
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import DriverBadge from '@/components/shared/DriverBadge';

export default function DriverTable({ standings = [] }) {
  const rowsRef = useRef([]);

  useEffect(() => {
    if (!rowsRef.current.length) return;
    gsap.fromTo(
      rowsRef.current.filter(Boolean),
      { x: -20, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.4, stagger: 0.03, ease: 'power2.out' }
    );
  }, [standings]);

  const posColors = { 1: 'rgba(180,140,0,0.08)', 2: 'rgba(130,130,130,0.06)', 3: 'rgba(120,80,40,0.06)' };

  return (
    <table className="apex-table">
      <thead>
        <tr>
          <th style={{ width: 50 }}>POS</th>
          <th>DRIVER</th>
          <th>TEAM</th>
          <th style={{ textAlign: 'right' }}>PTS</th>
          <th style={{ textAlign: 'right' }}>GAP</th>
          <th style={{ textAlign: 'right' }}>WINS</th>
        </tr>
      </thead>
      <tbody>
        {standings.map((d, i) => (
          <tr
            key={d.driver_code || i}
            ref={(el) => (rowsRef.current[i] = el)}
            style={{ background: posColors[d.position] || 'transparent' }}
          >
            <td>
              <span style={{
                fontFamily: 'Orbitron, monospace',
                fontWeight: 700,
                fontSize: '0.85rem',
                color: d.position === 1 ? '#FFD700' : d.position === 2 ? '#C0C0C0' : d.position === 3 ? '#CD7F32' : '#FFFFFF',
              }}>
                {d.position}
              </span>
            </td>
            <td>
              <DriverBadge driverCode={d.driver_code} teamName={d.team_name} driverName={d.driver_name} />
            </td>
            <td style={{ fontFamily: 'Titillium Web, sans-serif', fontSize: '0.8rem', color: '#808080' }}>
              {d.team_name}
            </td>
            <td style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.9rem', fontWeight: 700, textAlign: 'right' }}>
              {d.points}
            </td>
            <td style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.7rem', color: '#555', textAlign: 'right' }}>
              {d.gap_to_leader > 0 ? `-${d.gap_to_leader}` : '—'}
            </td>
            <td style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.75rem', color: '#808080', textAlign: 'right' }}>
              {d.wins}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
