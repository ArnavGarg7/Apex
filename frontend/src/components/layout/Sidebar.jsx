// src/components/layout/Sidebar.jsx
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const LINKS = [
  { to: '/dashboard',    icon: '◼', label: 'Dashboard'    },
  { to: '/live',         icon: '◉', label: 'Live Timing'  },
  { to: '/strategy',     icon: '◈', label: 'Strategy'     },
  { to: '/h2h',          icon: '⇄', label: 'Compare' },
  { to: '/standings',    icon: '▲', label: 'Standings'    },
  { to: '/championship', icon: '❂', label: 'Championship' },
  { to: '/calendar',     icon: '◷', label: 'Calendar'     },
  { to: '/circuit',      icon: '○', label: 'Circuits'     },
  { to: '/weather',      icon: '☁', label: 'Weather'      },
  { to: '/news',         icon: '◎', label: 'AI News'      },
  { to: '/radio',        icon: '»', label: 'Race Control' },
  { to: '/encyclopedia', icon: '⊞', label: 'Encyclopedia' },
];

export default function Sidebar() {
  const [expanded, setExpanded] = useState(false);
  const location = useLocation();

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      style={{
        width: expanded ? 210 : 56,
        minHeight: '100%',
        background: 'linear-gradient(180deg, #141414 0%, #0f0f0f 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        transition: 'width 0.3s cubic-bezier(0.22,1,0.36,1)',
        overflow: 'hidden',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        paddingTop: 12,
        paddingBottom: 12,
        position: 'sticky',
        top: 56,
        height: 'calc(100vh - 56px)',
        boxShadow: expanded ? '4px 0 24px rgba(0,0,0,0.5)' : 'none',
        zIndex: 100,
      }}
      aria-label="Sidebar navigation"
    >
      {LINKS.map(({ to, icon, label }) => {
        const active = location.pathname === to || location.pathname.startsWith(to + '/');
        return (
          <Link
            key={to}
            to={to}
            title={label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '11px 16px',
              textDecoration: 'none',
              color: active ? '#FFFFFF' : '#555',
              borderLeft: active ? '3px solid #E10600' : '3px solid transparent',
              background: active
                ? 'linear-gradient(90deg, rgba(225,6,0,0.12) 0%, transparent 100%)'
                : 'transparent',
              transition: 'color 0.15s ease, background 0.15s ease',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* Active glow */}
            {active && (
              <div style={{
                position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                width: 3, height: '60%', background: '#E10600',
                boxShadow: '0 0 10px rgba(225,6,0,0.8), 0 0 20px rgba(225,6,0,0.4)',
                borderRadius: '0 2px 2px 0',
              }} />
            )}

            <span style={{
              fontSize: '1rem',
              flexShrink: 0,
              width: 24,
              textAlign: 'center',
              color: active ? '#E10600' : '#444',
              filter: active ? 'drop-shadow(0 0 4px rgba(225,6,0,0.6))' : 'none',
              transition: 'color 0.15s ease, filter 0.15s ease',
            }}>
              {icon}
            </span>

            <div style={{
              opacity: expanded ? 1 : 0,
              transform: expanded ? 'translateX(0)' : 'translateX(-8px)',
              transition: 'opacity 0.2s ease, transform 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              minWidth: 0,
            }}>
              <span style={{
                fontFamily: 'Titillium Web, sans-serif',
                fontSize: '0.8rem',
                fontWeight: active ? 700 : 500,
                color: active ? '#fff' : '#777',
                letterSpacing: '0.03em',
              }}>
                {label}
              </span>
            </div>
          </Link>
        );
      })}

      {/* Bottom version badge */}
      {expanded && (
        <div style={{
          marginTop: 'auto',
          padding: '12px 16px',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          opacity: expanded ? 0.4 : 0,
          transition: 'opacity 0.3s ease',
        }}>
          <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.45rem', color: '#555', letterSpacing: '0.15em' }}>
            APEX v2.0 — F1 INTELLIGENCE
          </span>
        </div>
      )}
    </aside>
  );
}
