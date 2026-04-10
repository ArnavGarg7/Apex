// src/components/live/SectorHeatmap.jsx
import { useRef, useEffect } from 'react';

const SECTOR_COLORS = {
  fastest:  '#9B59B6',
  personal: '#1B9A1B',
  normal:   '#333333',
};

export default function SectorHeatmap({ data = [] }) {
  // data: array of { driver_code, s1_time, s2_time, s3_time }
  // Rank all drivers per sector and color accordingly

  const ranked = (sector) => {
    const times = data
      .filter((d) => d[sector] != null)
      .map((d) => ({ code: d.driver_code, time: d[sector] }))
      .sort((a, b) => a.time - b.time);
    const result = {};
    times.forEach((d, i) => {
      result[d.code] = i === 0 ? 'fastest' : i <= 2 ? 'personal' : 'normal';
    });
    return result;
  };

  const s1Rank = ranked('s1_time');
  const s2Rank = ranked('s2_time');
  const s3Rank = ranked('s3_time');

  if (!data.length) {
    return (
      <div style={{ color: '#555', fontFamily: 'Orbitron, monospace', fontSize: '0.7rem', textAlign: 'center', padding: 24 }}>
        NO SECTOR DATA
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ minWidth: 400, width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.55rem', letterSpacing: '0.12em', color: '#555', padding: '6px 8px', textAlign: 'left' }}>
              DRV
            </th>
            {['S1', 'S2', 'S3'].map((s) => (
              <th key={s} style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.55rem', letterSpacing: '0.12em', color: '#555', padding: '6px 8px', textAlign: 'center' }}>
                {s}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.driver_code}>
              <td style={{ fontFamily: 'Orbitron, monospace', fontWeight: 700, fontSize: '0.7rem', padding: '4px 8px', color: '#ccc' }}>
                {row.driver_code}
              </td>
              {[
                { val: row.s1_time, rank: s1Rank[row.driver_code] },
                { val: row.s2_time, rank: s2Rank[row.driver_code] },
                { val: row.s3_time, rank: s3Rank[row.driver_code] },
              ].map(({ val, rank }, i) => (
                <td
                  key={i}
                  style={{
                    padding: '4px 8px',
                    textAlign: 'center',
                    background: SECTOR_COLORS[rank] || SECTOR_COLORS.normal,
                    transition: 'background-color 200ms ease',
                    borderRadius: 3,
                    minWidth: 72,
                  }}
                >
                  <span style={{
                    fontFamily: 'Orbitron, monospace',
                    fontSize: '0.65rem',
                    color: '#fff',
                    fontWeight: rank === 'fastest' ? 700 : 400,
                  }}>
                    {val != null ? val.toFixed(3) : '--'}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
