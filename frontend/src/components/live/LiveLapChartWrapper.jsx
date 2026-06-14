import { useState, useEffect } from 'react';
import LapChart from './LapChart';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://apex-backend-uqtw7bvyla-uc.a.run.app';

export default function LiveLapChartWrapper({ width, height }) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let timer;
    const fetchLapChart = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/live/lap-chart`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Failed to fetch lap chart data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLapChart();
    // Poll every 10 seconds since it updates per lap
    timer = setInterval(fetchLapChart, 10000);
    
    return () => clearInterval(timer);
  }, []);

  if (loading && Object.keys(data).length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="apex-spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  if (Object.keys(data).length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.6rem', color: '#555', letterSpacing: '0.15em' }}>
          NO LAP HISTORY AVAILABLE YET
        </div>
      </div>
    );
  }

  return <LapChart data={data} width={width} height={height} />;
}
