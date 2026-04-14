import React, { useEffect, useState } from 'react';
import PageTransition from '@/components/animations/PageTransition';
import { useRaceData } from '@/hooks/useRaceData';
import CountdownTimer from '@/components/shared/CountdownTimer';
import { RaceStoryInline } from '@/components/shared/RaceStory';

function isRaceWeekend(dateStr) {
  if (!dateStr) return false;
  const race = new Date(dateStr);
  const now  = new Date();
  const diff = Math.abs(race - now) / 3600000; // hours
  return diff < 72; // within 3 days of race
}

function formatDate(dateStr) {
  if (!dateStr) return '--';
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return '--'; }
}

export default function Calendar() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(2025);
  const [expandedRound, setExpandedRound] = useState(null);
  const { data: events, loading, refetch } = useRaceData(`/api/calendar/${year}`, { immediate: true, deps: [year] });


  const now = new Date();

  return (
    <PageTransition>
      <title>APEX | Race Calendar</title>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.2rem', marginBottom: 4 }}>Race Calendar</h1>
          <p style={{ color: '#555', fontSize: '0.8rem' }}>Full season schedule with countdown timers.</p>
        </div>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="apex-select"
          style={{ width: 'auto', minWidth: 100 }}
          id="calendar-year-select"
        >
          {Array.from({ length: 9 }, (_, i) => currentYear - i + 1).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <div className="apex-spinner" style={{ width: 32, height: 32 }} />
        </div>
      ) : !events || events.length === 0 ? (
        <div className="panel" style={{ textAlign: 'center', padding: '60px 24px', color: '#444' }}>
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.7rem', letterSpacing: '0.2em' }}>
            NO CALENDAR DATA FOR {year}
          </div>
          <div style={{ marginTop: 8, fontSize: '0.75rem', color: '#333' }}>
            Try selecting a different season (2018–2025)
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 6, maxWidth: 960 }}>
          {events.map((event) => {
            const raceDate = event.session5_date || event.session5;
            const isPast   = raceDate && new Date(raceDate) < now;
            const isNow    = isRaceWeekend(raceDate);

            return (
              <React.Fragment key={event.round_number}>
                <div
                  className="panel"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '48px 1fr auto auto',
                    alignItems: 'center',
                    gap: 16,
                    padding: '14px 20px',
                    borderLeft: isNow ? '3px solid #E10600' : isPast ? '3px solid #222' : '3px solid #2a2a2a',
                    opacity: isPast ? 0.55 : 1,
                    transition: 'opacity 0.2s ease, transform 0.15s ease, box-shadow 0.15s ease',
                  }}
                >
                  {/* Round */}
                  <div style={{
                    fontFamily: 'Orbitron, monospace', fontWeight: 900, fontSize: '1rem',
                    color: isNow ? '#E10600' : '#333', textAlign: 'center',
                  }}>
                    {event.round_number}
                  </div>

                  {/* Event info */}
                  <div>
                    <div style={{ fontFamily: 'Titillium Web, sans-serif', fontWeight: 700, fontSize: '0.92rem', marginBottom: 2 }}>
                      {event.event_name}
                    </div>
                    <div style={{ fontFamily: 'Titillium Web, sans-serif', fontSize: '0.72rem', color: '#555' }}>
                      {event.location} · {event.country}
                      {event.event_format && (
                        <span style={{ marginLeft: 8, padding: '1px 6px', background: 'rgba(255,255,255,0.04)', borderRadius: 2, fontSize: '0.62rem' }}>
                          {event.event_format.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Date */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.68rem', color: '#666' }}>
                      {formatDate(raceDate)}
                    </div>
                  </div>

                  {/* Status */}
                  <div style={{ flexShrink: 0, minWidth: 100, textAlign: 'right' }}>
                    {isNow && <span className="badge badge-live">RACE WEEKEND</span>}
                    {!isPast && !isNow && raceDate && <CountdownTimer targetDate={raceDate} />}
                    {isPast && (
                      <button
                        onClick={() => setExpandedRound(expandedRound === event.round_number ? null : event.round_number)}
                        style={{
                          background: expandedRound === event.round_number ? 'rgba(225,6,0,0.1)' : 'transparent',
                          border: expandedRound === event.round_number ? '1px solid rgba(225,6,0,0.5)' : '1px solid rgba(255,255,255,0.2)',
                          color: expandedRound === event.round_number ? '#E10600' : '#ddd',
                          borderRadius: 4, padding: '4px 12px', cursor: 'pointer',
                          fontFamily: 'Orbitron, monospace', fontSize: '0.55rem', letterSpacing: '0.1em', fontWeight: 600,
                          transition: 'all 0.2s',
                          boxShadow: expandedRound === event.round_number ? '0 0 10px rgba(225,6,0,0.3)' : 'none',
                        }}
                      >
                        {expandedRound === event.round_number ? '▲ STORY' : '▼ AI STORY'}
                      </button>
                    )}
                  </div>
                </div>
                {/* Story expand panel */}
                {isPast && expandedRound === event.round_number && (
                  <RaceStoryInline year={year} round={event.round_number} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}
    </PageTransition>
  );
}
