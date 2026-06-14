// src/components/shared/RaceStory.jsx
// AI-generated post-race narrative card with typewriter reveal
import { useState, useEffect, useRef } from 'react';
import { useRaceData } from '@/hooks/useRaceData';
import { useUserStore } from '@/store/userStore';

const API_BASE = 'https://apex-backend-uqtw7bvyla-uc.a.run.app';

// ── Typewriter hook ───────────────────────────────────────────────────────────
function useTypewriter(text, speed = 14, active = true) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!text || !active) { setDisplayed(text || ''); setDone(true); return; }
    setDisplayed('');
    setDone(false);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(id); setDone(true); }
    }, speed);
    return () => clearInterval(id);
  }, [text, active]);
  return { displayed, done };
}

// ── Inline round story fetcher (for Calendar expand) ─────────────────────────
export function RaceStoryInline({ year, round }) {
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const { displayed } = useTypewriter(story?.story, 10, !!story);

  const fetchStory = async () => {
    if (fetched || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/story/race?year=${year}&round=${round}`);
      const data = await res.json();
      setStory(data);
    } catch (e) {
      setStory({ story: 'Race story temporarily unavailable.', event_name: `Round ${round}`, error: true });
    } finally {
      setLoading(false);
      setFetched(true);
    }
  };

  return (
    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      {!fetched && !loading && (
        <button
          onClick={fetchStory}
          style={{
            background: 'rgba(225,6,0,0.08)', border: '1px solid rgba(225,6,0,0.25)',
            color: '#E10600', borderRadius: 6, padding: '6px 14px', cursor: 'pointer',
            fontFamily: 'Orbitron, monospace', fontSize: '0.55rem', letterSpacing: '0.1em',
          }}
        >
          ✦ GENERATE RACE STORY
        </button>
      )}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
          <div className="apex-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
          <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.5rem', color: '#444', letterSpacing: '0.12em' }}>
            GENERATING AI NARRATIVE...
          </span>
        </div>
      )}
      {story && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{
              fontFamily: 'Orbitron, monospace', fontSize: '0.42rem', color: '#E10600',
              border: '1px solid rgba(225,6,0,0.3)', padding: '2px 7px', borderRadius: 3,
              letterSpacing: '0.12em',
            }}>
              ✦ GEMINI
            </span>
            {story.winner && (
              <span style={{ fontFamily: 'Titillium Web', fontSize: '0.65rem', color: '#555' }}>
                Winner: <strong style={{ color: '#ccc' }}>{story.winner}</strong>
              </span>
            )}
          </div>
          <p style={{
            fontFamily: 'Titillium Web, sans-serif', fontSize: '0.78rem', color: '#aaa',
            lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0,
          }}>
            {displayed}
          </p>
          {story.top5?.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              {story.top5.map(p => (
                <span key={p} style={{
                  fontFamily: 'Orbitron, monospace', fontSize: '0.48rem', color: '#555',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid #222',
                  padding: '3px 8px', borderRadius: 3, letterSpacing: '0.08em',
                }}>{p}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Dashboard card (latest completed race story) ──────────────────────────────
export default function RaceStory({ year = 2025 }) {
  const { data, loading, refetch } = useRaceData(`/api/story/latest?year=${year}`, { 
    immediate: true,
    cacheKey: `apex_story_cache_${year}`
  });
  const { displayed, done } = useTypewriter(data?.story, 12, !!data?.story);

  if (loading) return (
    <div className="panel" style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div className="apex-spinner" style={{ width: 24, height: 24, borderWidth: 2, flexShrink: 0 }} />
      <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.55rem', color: '#444', letterSpacing: '0.15em' }}>
        LOADING RACE STORY...
      </div>
    </div>
  );

  if (!data?.story) return null;

  return (
    <div className="panel" style={{ borderTop: '2px solid rgba(225,6,0,0.4)', padding: '20px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <div className="panel-header" style={{ marginBottom: 2 }}>
            {data.event_name || 'Latest Race'} — Race Story
          </div>
          <div style={{ fontFamily: 'Titillium Web', fontSize: '0.65rem', color: '#444' }}>
            Winner: <strong style={{ color: '#ccc' }}>{data.winner} ({data.winner_team})</strong>
          </div>
        </div>
        <span style={{
          fontFamily: 'Orbitron, monospace', fontSize: '0.42rem', color: '#E10600',
          border: '1px solid rgba(225,6,0,0.3)', padding: '3px 9px', borderRadius: 3,
          letterSpacing: '0.12em', flexShrink: 0,
        }}>
          ✦ GEMINI AI
        </span>
      </div>

      {/* Narrative */}
      <p style={{
        fontFamily: 'Titillium Web, sans-serif', fontSize: '0.82rem', color: '#999',
        lineHeight: 1.75, margin: 0, whiteSpace: 'pre-wrap',
      }}>
        {displayed}
        {!done && <span style={{ opacity: 0.5, animation: 'breathe 0.8s ease-in-out infinite' }}>▌</span>}
      </p>

      {/* Stat chips */}
      {(data.sc_laps?.length > 0 || data.dnfs?.length > 0) && (
        <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
          {data.sc_laps?.length > 0 && (
            <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.48rem', color: '#F59E0B', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', padding: '3px 9px', borderRadius: 3 }}>
              SC: LAP{data.sc_laps.length > 1 ? 'S' : ''} {data.sc_laps.join(', ')}
            </span>
          )}
          {data.dnfs?.length > 0 && (
            <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.48rem', color: '#E10600', background: 'rgba(225,6,0,0.06)', border: '1px solid rgba(225,6,0,0.2)', padding: '3px 9px', borderRadius: 3 }}>
              DNF×{data.dnfs.length}
            </span>
          )}
          {data.fastest_lap_driver && (
            <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.48rem', color: '#a855f7', background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.2)', padding: '3px 9px', borderRadius: 3 }}>
              FL: {data.fastest_lap_driver}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
