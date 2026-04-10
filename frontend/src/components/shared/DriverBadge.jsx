// src/components/shared/DriverBadge.jsx
import { getTeamColor } from '@/utils/f1Colors';

export default function DriverBadge({ driverCode, teamName, driverName, size = 'sm' }) {
  const teamColor = getTeamColor(teamName);
  const isLarge = size === 'lg';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: isLarge ? 10 : 6 }}>
      {/* Team color stripe */}
      <div style={{
        width: 3,
        height: isLarge ? 32 : 24,
        background: teamColor,
        borderRadius: 2,
        flexShrink: 0,
        boxShadow: `0 0 6px ${teamColor}60`,
      }} />
      <div>
        <div style={{
          fontFamily: 'Orbitron, monospace',
          fontWeight: 700,
          fontSize: isLarge ? '0.9rem' : '0.7rem',
          letterSpacing: '0.1em',
          color: '#FFFFFF',
          lineHeight: 1,
        }}>
          {driverCode}
        </div>
        {isLarge && driverName && (
          <div style={{
            fontFamily: 'Titillium Web, sans-serif',
            fontSize: '0.65rem',
            color: '#808080',
            marginTop: 2,
            letterSpacing: '0.05em',
          }}>
            {driverName}
          </div>
        )}
        {teamName && (
          <div style={{
            fontFamily: 'Titillium Web, sans-serif',
            fontSize: '0.55rem',
            color: teamColor,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            opacity: 0.85,
          }}>
            {teamName}
          </div>
        )}
      </div>
    </div>
  );
}
