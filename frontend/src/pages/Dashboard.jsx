// src/pages/Dashboard.jsx — Rich dashboard with stats panels and next-race widget
import { useEffect, useState } from 'react';
import PageTransition from '@/components/animations/PageTransition';
import { useRaceData } from '@/hooks/useRaceData';
import { useLivePoll } from '@/hooks/useLivePoll';
import { useSessionStore } from '@/store/sessionStore';
import TimingTable from '@/components/live/TimingTable';
import MagneticWrapper from '@/components/animations/MagneticWrapper';
import NextRaceCountdown from '@/components/shared/NextRaceCountdown';
import { getTeamColor } from '@/utils/f1Colors';

export default function Dashboard() {
  const { setSession, updateTiming, setLive, isLive, currentSession, timingData } = useSessionStore();
  const { data: standings } = useRaceData('/api/standings/2025', { immediate: true });
  const { data: calendar  } = useRaceData('/api/calendar/2025',  { immediate: true });

  useLivePoll('/api/live/session', (d) => { setSession(d); setLive(d?.is_live || false); }, 10000);
  useLivePoll('/api/live/timing',  updateTiming, 5000, isLive);


  const leader         = standings?.drivers?.[0];
  const nextRace       = (calendar || []).find(e => {
    const d = e.session5_date || e.session5;
    return d && new Date(d) > new Date();
  });
  const completedRaces = (calendar || []).filter(e => {
    const d = e.session5_date || e.session5;
    return d && new Date(d) < new Date();
  }).length;

  const stats = [
    { label: 'Session',   value: currentSession?.session_type   || '--'      },
    { label: 'Status',    value: currentSession?.status          || 'Inactive'},
    { label: 'Circuit',   value: currentSession?.circuit_short_name || '--'   },
  ];

  return (
    <PageTransition>
      <title>APEX | F1 Intelligence Dashboard</title>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.4rem', marginBottom: 6 }}>
          {currentSession?.country_name
            ? `${currentSession.country_name} Grand Prix`
            : 'F1 Intelligence Dashboard'}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {isLive && <span className="badge badge-live">LIVE</span>}
          <span style={{ fontFamily: 'Titillium Web', fontSize: '0.78rem', color: '#555' }}>
            {currentSession?.session_name || 'No active session • 2025 Season overview below'}
          </span>
        </div>
      </div>

      {/* Session stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        {stats.map(({ label, value }) => (
          <MagneticWrapper key={label} strength={0.25}>
            <div className="panel" style={{ padding: '18px 22px' }}>
              <div className="panel-header" style={{ marginBottom: 10 }}>{label}</div>
              <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>{value}</div>
            </div>
          </MagneticWrapper>
        ))}
      </div>

      {/* Main grid: timing + standings snapshot */}
      <div style={{ display: 'grid', gridTemplateColumns: isLive ? '1fr 320px' : '1fr', gap: 20, marginBottom: 20 }}>

        {/* Live timing or next race */}
        <div className="panel" style={{ borderTop: '2px solid #E10600' }}>
          {isLive ? (
            <>
              <div className="panel-header">Top-5 Timing Strip</div>
              {timingData.length > 0 ? (
                <TimingTable data={timingData.slice(0, 5)} />
              ) : (
                <div style={{ color: '#444', fontFamily: 'Orbitron, monospace', fontSize: '0.7rem', padding: '24px 0', textAlign: 'center', letterSpacing: '0.15em' }}>
                  AWAITING TIMING DATA...
                </div>
              )}
            </>
          ) : (
            <>
              <div className="panel-header">Next Grand Prix</div>
              <NextRaceCountdown />
            </>
          )}
        </div>

        {/* Standings snapshot — only shown alongside live timing */}
        {isLive && leader && (
          <div className="panel">
            <div className="panel-header">Championship Leader</div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '20px 0' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: `linear-gradient(135deg, ${getTeamColor(leader.team_name)}, #111)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.2rem', fontFamily: 'Orbitron', fontWeight: 800, color: '#fff',
                boxShadow: `0 0 24px ${getTeamColor(leader.team_name)}44`,
              }}>
                {(leader.driver_code || leader.driver_name?.split(' ').pop() || 'P1').slice(0,3)}
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Titillium Web', fontWeight: 700, fontSize: '1rem' }}>{leader.driver_name}</div>
                <div style={{ color: '#555', fontSize: '0.75rem' }}>{leader.team_name}</div>
              </div>
              <div style={{ fontFamily: 'Orbitron', fontSize: '2rem', fontWeight: 900, color: '#E10600' }}>
                {leader.points} <span style={{ fontSize: '0.8rem', color: '#555' }}>PTS</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Season overview cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        {[
          {
            label: 'Races Completed',
            value: completedRaces || '--',
            sub: 'of ' + (calendar?.length || '--') + ' rounds',
            color: '#3671C6',
          },
          {
            label: 'WDC Leader',
            value: standings?.drivers?.[0]?.driver_code || '--',
            sub: `${standings?.drivers?.[0]?.points || '--'} pts`,
            color: '#E10600',
          },
          {
            label: 'WCC Leader',
            value: standings?.constructors?.[0]?.team_name?.split(' ').pop() || '--',
            sub: `${standings?.constructors?.[0]?.points || '--'} pts`,
            color: '#F59E0B',
          },
          {
            label: 'Next Race',
            value: nextRace?.location || '--',
            sub: nextRace?.event_name || 'Season complete',
            color: '#39B54A',
          },
        ].map(({ label, value, sub, color }) => (
          <MagneticWrapper key={label} strength={0.2}>
            <div className="panel card-hover" style={{ padding: '18px 22px', borderTop: `2px solid ${color}22` }}>
              <div className="panel-header" style={{ marginBottom: 8 }}>{label}</div>
              <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.05rem', fontWeight: 800, color }}>{value}</div>
              <div style={{ fontFamily: 'Titillium Web', fontSize: '0.72rem', color: '#555', marginTop: 4 }}>{sub}</div>
            </div>
          </MagneticWrapper>
        ))}
      </div>
    </PageTransition>
  );
}
