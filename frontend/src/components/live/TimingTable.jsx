// src/components/live/TimingTable.jsx
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import CompoundBadge from '@/components/shared/CompoundBadge';
import DriverBadge from '@/components/shared/DriverBadge';
import { formatLapTime, formatGap } from '@/utils/formatLap';

export default function TimingTable({ data = [] }) {
  const [prevPositions, setPrevPositions] = useState({});
  const [fastestLapDriver, setFastestLapDriver] = useState(null);

  useEffect(() => {
    // Track position changes
    const posMap = {};
    data.forEach((d) => { posMap[d.driver_number] = d.position; });
    setPrevPositions(posMap);

    // Find fastest lap
    let best = Infinity, bestDriver = null;
    data.forEach((d) => {
      const lt = d.best_lap_time;
      if (lt && lt < best) { best = lt; bestDriver = d.driver_number; }
    });
    setFastestLapDriver(bestDriver);
  }, [data]);

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="apex-table" style={{ minWidth: 700 }}>
        <thead>
          <tr>
            <th style={{ width: 40 }}>POS</th>
            <th style={{ minWidth: 160 }}>DRIVER</th>
            <th>GAP</th>
            <th>INTV</th>
            <th style={{ fontFamily: 'Orbitron, monospace' }}>LAST LAP</th>
            <th style={{ fontFamily: 'Orbitron, monospace' }}>BEST</th>
            <th>TYRE</th>
            <th>AGE</th>
            <th>PITS</th>
            <th style={{ width: 40 }}>DRS</th>
          </tr>
        </thead>
        <tbody>
          <AnimatePresence initial={false}>
            {data.map((entry) => {
              const isFastest = entry.driver_number === fastestLapDriver;
              return (
                <motion.tr
                  key={entry.driver_number}
                  layout
                  layoutId={`timing-row-${entry.driver_number}`}
                  transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                  style={{
                    background: isFastest ? 'rgba(155, 89, 182, 0.08)' : undefined,
                  }}
                >
                  {/* Position */}
                  <td>
                    <span style={{
                      fontFamily: 'Orbitron, monospace',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      color: entry.position === 1 ? '#FFD700' : '#FFFFFF',
                    }}>
                      {entry.position ?? '--'}
                    </span>
                  </td>

                  {/* Driver */}
                  <td>
                    <DriverBadge
                      driverCode={entry.driver_code}
                      teamName={entry.team_name}
                      driverName={entry.driver_name}
                    />
                  </td>

                  {/* Gap to leader */}
                  <td style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.75rem', color: '#c0c0c0' }}>
                    {entry.position === 1 ? '—' : formatGap(entry.gap_to_leader)}
                  </td>

                  {/* Interval */}
                  <td style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.75rem', color: '#909090' }}>
                    {formatGap(entry.interval)}
                  </td>

                  {/* Last lap */}
                  <td style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.8rem', color: '#FFFFFF' }}>
                    {entry.last_lap_time ? formatLapTime(entry.last_lap_time) : '--:--.---'}
                  </td>

                  {/* Best lap */}
                  <td style={{
                    fontFamily: 'Orbitron, monospace',
                    fontSize: '0.8rem',
                    color: isFastest ? '#9B59B6' : '#AAAAAA',
                    fontWeight: isFastest ? 700 : 400,
                  }}>
                    {entry.best_lap_time ? formatLapTime(entry.best_lap_time) : '--:--.---'}
                  </td>

                  {/* Compound */}
                  <td><CompoundBadge compound={entry.compound} /></td>

                  {/* Tyre age */}
                  <td style={{ color: '#808080', fontSize: '0.8rem' }}>
                    {entry.tyre_age ?? '--'}
                  </td>

                  {/* Pit stops */}
                  <td style={{ color: '#808080', fontSize: '0.8rem' }}>
                    {entry.pit_stops ?? 0}
                  </td>

                  {/* DRS */}
                  <td>
                    <span style={{
                      fontFamily: 'Orbitron, monospace',
                      fontSize: '0.55rem',
                      fontWeight: 700,
                      color: entry.drs_open ? '#39B54A' : '#333',
                      background: entry.drs_open ? 'rgba(57,181,74,0.1)' : 'transparent',
                      padding: '2px 4px',
                      borderRadius: 3,
                      border: `1px solid ${entry.drs_open ? 'rgba(57,181,74,0.3)' : '#222'}`,
                    }}>
                      DRS
                    </span>
                  </td>
                </motion.tr>
              );
            })}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
}
