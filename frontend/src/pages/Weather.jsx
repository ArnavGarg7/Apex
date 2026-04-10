// src/pages/Weather.jsx — Fixed: expanded circuit list, better empty state
import { useState, useEffect } from 'react';
import PageTransition from '@/components/animations/PageTransition';
import { useRaceData } from '@/hooks/useRaceData';
import ConditionsPanel from '@/components/weather/ConditionsPanel';
import RainGauge from '@/components/weather/RainGauge';

const CIRCUITS = [
  { id: 'bahrain',    name: 'Bahrain'    },
  { id: 'monaco',     name: 'Monaco'     },
  { id: 'silverstone',name: 'Silverstone'},
  { id: 'monza',      name: 'Monza'      },
  { id: 'spa',        name: 'Spa'        },
  { id: 'singapore',  name: 'Singapore'  },
  { id: 'miami',      name: 'Miami'      },
  { id: 'abu_dhabi',  name: 'Abu Dhabi'  },
  { id: 'australia',  name: 'Melbourne'  },
  { id: 'canada',     name: 'Montreal'   },
  { id: 'austria',    name: 'Red Bull Ring'},
  { id: 'baku',       name: 'Baku'       },
  { id: 'zandvoort',  name: 'Zandvoort'  },
  { id: 'austin',     name: 'Austin'     },
  { id: 'hungaroring',name: 'Budapest'   },
  { id: 'barcelona',  name: 'Barcelona'  },
];

export default function Weather() {
  const [circuit, setCircuit] = useState('bahrain');
  const { data, loading, error, refetch } = useRaceData(`/api/weather/${circuit}`, { immediate: true, deps: [circuit] });


  // Auto-refresh every 5 min
  useEffect(() => {
    const id = setInterval(refetch, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [refetch]);

  const weather = data?.current || data || null;
  const circuitName = CIRCUITS.find(c => c.id === circuit)?.name || circuit;

  return (
    <PageTransition>
      <title>APEX | Weather Intelligence</title>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.2rem', marginBottom: 4 }}>Track Weather</h1>
        <p style={{ color: '#555', fontSize: '0.8rem' }}>Real-time atmospheric conditions at every Grand Prix circuit.</p>
      </div>

      {/* Circuit picker */}
      <div className="panel" style={{ marginBottom: 20, padding: '14px 20px' }}>
        <div className="panel-header" style={{ marginBottom: 12 }}>Select Circuit</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {CIRCUITS.map(({ id, name }) => (
            <button
              key={id}
              onClick={() => setCircuit(id)}
              style={{
                fontFamily: 'Titillium Web, sans-serif', fontSize: '0.72rem',
                fontWeight: circuit === id ? 700 : 400,
                padding: '5px 12px', borderRadius: 4,
                border: circuit === id ? '1px solid #E10600' : '1px solid #222',
                background: circuit === id ? 'rgba(225,6,0,0.12)' : 'rgba(255,255,255,0.02)',
                color: circuit === id ? '#fff' : '#666',
                cursor: 'pointer', transition: 'all 0.15s ease',
              }}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div style={{ textAlign: 'center' }}>
            <div className="apex-spinner" style={{ width: 32, height: 32, margin: '0 auto 12px' }} />
            <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.55rem', color: '#444', letterSpacing: '0.2em' }}>
              FETCHING CONDITIONS
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="panel" style={{ textAlign: 'center', padding: '48px 24px', borderTop: '2px solid #E10600' }}>
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.7rem', color: '#E10600', letterSpacing: '0.15em', marginBottom: 8 }}>
            WEATHER API OFFLINE
          </div>
          <div style={{ fontSize: '0.75rem', color: '#555' }}>Check OpenWeatherMap API key in backend .env</div>
          <button onClick={refetch} className="btn btn-ghost" style={{ marginTop: 16, fontSize: '0.65rem' }}>RETRY</button>
        </div>
      ) : weather ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 20 }}>
          <div className="panel" style={{ borderTop: '2px solid #3671C6' }}>
            <div className="panel-header">
              Current Conditions — {circuitName.toUpperCase()}
            </div>
            <ConditionsPanel weather={{ ...weather, circuit_id: circuit }} />
          </div>
          <div className="panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <div className="panel-header" style={{ alignSelf: 'flex-start' }}>Precipitation Risk</div>
            <RainGauge probability={weather.rain_chance || 0} />
          </div>
        </div>
      ) : (
        <div className="panel" style={{ textAlign: 'center', padding: '60px 24px', color: '#444' }}>
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.7rem', letterSpacing: '0.15em' }}>
            NO WEATHER DATA
          </div>
          <button onClick={refetch} className="btn btn-ghost" style={{ marginTop: 16, fontSize: '0.65rem' }}>RETRY</button>
        </div>
      )}
    </PageTransition>
  );
}
