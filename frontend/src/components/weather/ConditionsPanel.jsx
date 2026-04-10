// src/components/weather/ConditionsPanel.jsx
export default function ConditionsPanel({ weather = {} }) {
  const iconUrl = weather.condition_icon
    ? `https://openweathermap.org/img/wn/${weather.condition_icon}@2x.png`
    : null;

  const stats = [
    { label: 'Air Temp',   value: `${weather.temperature_air?.toFixed(1) ?? '--'}°C`,   icon: '🌡️' },
    { label: 'Track Temp', value: `${weather.temperature_track?.toFixed(1) ?? '--'}°C`,  icon: '🏁' },
    { label: 'Humidity',   value: `${weather.humidity?.toFixed(0) ?? '--'}%`,            icon: '💧' },
    { label: 'Wind',       value: `${weather.wind_speed?.toFixed(1) ?? '--'} km/h`,      icon: '💨' },
    { label: 'Pressure',   value: `${weather.pressure?.toFixed(0) ?? '--'} hPa`,         icon: '⬇️' },
    { label: 'Rain Chance',value: `${weather.rain_chance?.toFixed(0) ?? '--'}%`,         icon: '🌧️' },
  ];

  return (
    <div>
      {/* Hero condition */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        {iconUrl && <img src={iconUrl} alt={weather.condition} style={{ width: 64, height: 64 }} />}
        <div>
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.8rem', fontWeight: 700 }}>
            {weather.temperature_air?.toFixed(1) ?? '--'}°C
          </div>
          <div style={{ fontFamily: 'Titillium Web, sans-serif', fontSize: '0.9rem', color: '#808080' }}>
            {weather.condition || 'Unknown'} — {weather.circuit_id?.replace(/_/g, ' ')}
          </div>
        </div>
        {weather.rain_chance > 30 && (
          <span style={{ background: 'rgba(0,103,255,0.15)', border: '1px solid rgba(0,103,255,0.3)', color: '#0067FF', padding: '4px 10px', borderRadius: 100, fontFamily: 'Orbitron, monospace', fontSize: '0.6rem', letterSpacing: '0.1em', marginLeft: 'auto' }}>
            RAIN {weather.rain_chance?.toFixed(0)}%
          </span>
        )}
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {stats.map(({ label, value, icon }) => (
          <div key={label} className="panel" style={{ padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.5rem', letterSpacing: '0.12em', color: '#555', textTransform: 'uppercase' }}>
                {label}
              </div>
              <span style={{ fontSize: '0.9rem' }}>{icon}</span>
            </div>
            <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', marginTop: 6 }}>
              {value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
