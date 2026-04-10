import { useEffect, useState } from 'react';
import { useRaceData } from '@/hooks/useRaceData';
import CircuitScene from '@/components/three/CircuitScene';
import { useUserStore } from '@/store/userStore';

export default function CircuitMap({ circuitId = 'monaco' }) {
  const gpuTier = useUserStore((s) => s.gpuTier);
  const { data: topologyData, loading } = useRaceData(`/api/circuit/${circuitId}/topology`);
  const [svgPath, setSvgPath] = useState('');
  const [viewBox, setViewBox] = useState('0 0 100 100');

  useEffect(() => {
    if (topologyData && topologyData.length > 0) {
      // Find min/max bounds to set viewBox dynamically
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      topologyData.forEach(p => {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        // Y axis is inverted in FastF1 telemetry vs SVG
        if (-p.y < minY) minY = -p.y;
        if (-p.y > maxY) maxY = -p.y;
      });
      
      // Add padding
      const padding = Math.max(maxX - minX, maxY - minY) * 0.1;
      setViewBox(`${minX - padding} ${minY - padding} ${(maxX - minX) + padding * 2} ${(maxY - minY) + padding * 2}`);
      
      const pts = topologyData.map(p => `${p.x},${-p.y}`).join(' ');
      setSvgPath(pts);
    }
  }, [topologyData]);

  return (
    <div>
      {/* 3D flyover (if GPU tier allows) */}
      {gpuTier >= 2 && <CircuitScene circuitId={circuitId} height={280} />}

      {/* SVG map */}
      <div style={{ padding: '20px 0', minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {loading ? (
          <div className="apex-spinner" />
        ) : svgPath ? (
          <svg
            viewBox={viewBox}
            style={{ width: '100%', maxWidth: 400, margin: '0 auto', display: 'block', filter: 'drop-shadow(0 0 8px rgba(225,6,0,0.6))' }}
          >
            <polyline
              points={svgPath}
              fill="none"
              stroke="#E10600"
              strokeWidth={(viewBox.split(' ')[2] / 50).toString()} // auto-scale stroke width
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <div style={{ color: '#888', fontFamily: 'Orbitron' }}>TOPOLOGY NOT FOUND</div>
        )}
      </div>
    </div>
  );
}
