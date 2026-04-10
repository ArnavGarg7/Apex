// src/components/circuit/CircuitStats.jsx
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

function StatCard({ label, value, unit = '', countUp = true }) {
  const valRef = useRef(null);

  useEffect(() => {
    if (!countUp || !valRef.current) return;
    const numVal = parseFloat(value);
    if (isNaN(numVal)) return;

    gsap.to({ val: 0 }, {
      val: numVal,
      duration: 0.6,
      ease: 'power2.out',
      onUpdate: function() {
        valRef.current && (valRef.current.textContent = Math.round(this.targets()[0].val) + unit);
      },
    });
  }, [value]);

  return (
    <div className="panel" style={{ padding: '16px 20px', textAlign: 'center', minWidth: 110 }}>
      <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.55rem', letterSpacing: '0.15em', color: '#555', textTransform: 'uppercase', marginBottom: 6 }}>
        {label}
      </div>
      <div ref={valRef} style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.4rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1 }}>
        {countUp ? '0' + unit : value}
      </div>
    </div>
  );
}

export default function CircuitStats({ info = {} }) {
  if (!info) return null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
      <StatCard label="Length"       value={info.length_km}    unit=" km" />
      <StatCard label="Turns"        value={info.turns}        unit=""    />
      <StatCard label="DRS Zones"    value={info.drs_zones}    unit=""    />
      <StatCard label="First GP"     value={info.first_gp_year} unit=""   />
      {info.lap_record && (
        <div className="panel" style={{ padding: '16px 20px', minWidth: 180 }}>
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.55rem', letterSpacing: '0.15em', color: '#555', textTransform: 'uppercase', marginBottom: 6 }}>
            Lap Record
          </div>
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '1rem', fontWeight: 700, color: '#9B59B6' }}>
            {info.lap_record}
          </div>
          <div style={{ fontFamily: 'Titillium Web, sans-serif', fontSize: '0.65rem', color: '#808080', marginTop: 4 }}>
            {info.lap_record_driver} ({info.lap_record_year})
          </div>
        </div>
      )}
    </div>
  );
}
