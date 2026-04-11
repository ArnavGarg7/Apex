// src/pages/Encyclopedia.jsx — Driver Intelligence Cards & Constructors database
import { useState, useEffect } from 'react';
import PageTransition from '@/components/animations/PageTransition';
import { useRaceData } from '@/hooks/useRaceData';
import { useUserStore } from '@/store/userStore';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';

// ── AI Driver Card Component ────────────────────────────────────────────────
function DriverCard({ driver }) {
  const [bioData, setBioData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const token = useUserStore((s) => s.idToken);

  const fetchBio = async () => {
    if (bioData || loading) return; // Already fetched
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/historical/driver-bio/${driver.driver_id}?name=${encodeURIComponent(driver.full_name)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('API Error');
      const json = await res.json();
      setBioData(json);
    } catch (e) {
      setBioData({ bio: 'Bio temporarily unavailable.', legacy_score: '--' });
    } finally {
      setLoading(false);
    }
  };

  const handleFlip = () => {
    if (!flipped && !bioData) fetchBio();
    setFlipped(!flipped);
  };

  // Fun color variations based on legacy score
  const scoreColor = bioData?.legacy_score >= 90 ? '#E10600' : bioData?.legacy_score >= 70 ? '#39B54A' : '#38AAFF';

  return (
    <div
      style={{
        perspective: '1000px',
        width: '100%',
        minHeight: 140,
        cursor: 'pointer',
      }}
      onClick={handleFlip}
    >
      <div style={{
        width: '100%',
        height: '100%',
        transition: 'transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1)',
        transformStyle: 'preserve-3d',
        transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        position: 'relative'
      }}>
        
        {/* FRONT FACE (Basic Stats) */}
        <div className="panel card-hover" style={{
          position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden',
          padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 6,
          background: 'linear-gradient(145deg, #181818 0%, #111 100%)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.65rem', color: '#E10600', fontWeight: 700, letterSpacing: '0.1em' }}>
              {driver.code || 'UNK'}
            </span>
            <span style={{ fontFamily: 'Titillium Web', fontSize: '0.65rem', color: '#444' }}>
              {driver.nationality || 'Unknown'}
            </span>
          </div>
          
          <div style={{ fontFamily: 'Titillium Web, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: '#e0e0e0', lineHeight: 1.2, marginTop: 'auto' }}>
            {driver.full_name || driver.driver_id || '--'}
          </div>
          <div style={{ fontFamily: 'Orbitron', fontSize: '0.5rem', color: '#555', letterSpacing: '0.1em' }}>
            BORN: {driver.dob || '--'}
          </div>
        </div>

        {/* BACK FACE (AI Bio + Legacy Score) */}
        <div className="panel" style={{
          position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 4,
          background: 'linear-gradient(145deg, #111 0%, #0a0a0a 100%)',
          borderTop: bioData ? `2px solid ${scoreColor}` : '2px solid #555'
        }}>
          {loading ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <div className="apex-spinner" style={{ width: 24, height: 24, borderWidth: 2 }} />
            </div>
          ) : bioData ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.5rem', color: '#777', letterSpacing: '0.1em' }}>AI DOSSIER</span>
                <span style={{ fontFamily: 'Titillium Web', fontWeight: 800, fontSize: '0.7rem', color: scoreColor }}>
                  LEGACY SCORE: {bioData.legacy_score}
                </span>
              </div>
              <div style={{ fontFamily: 'Titillium Web', fontSize: '0.68rem', color: '#ccc', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {bioData.bio}
              </div>
            </>
          ) : null}
        </div>

      </div>
    </div>
  );
}


// ── Main Page ───────────────────────────────────────────────────────────────
export default function Encyclopedia() {
  const [tab, setTab] = useState('drivers');
  const [search, setSearch] = useState('');
  
  // Show 60 at a time to keep UI snappy
  const [limit, setLimit] = useState(60);

  const { data: drivers, loading: dLoading } = useRaceData('/api/historical/drivers', { immediate: true });
  const { data: teams,   loading: tLoading } = useRaceData('/api/historical/constructors', { immediate: true });

  const source  = tab === 'drivers' ? (drivers  || []) : (teams || []);
  const loading = tab === 'drivers' ? dLoading : tLoading;

  const filtered = source.filter(item => {
    const q = search.toLowerCase();
    return (
      (item.full_name      || '').toLowerCase().includes(q) ||
      (item.name           || '').toLowerCase().includes(q) ||
      (item.code           || '').toLowerCase().includes(q) ||
      (item.nationality    || '').toLowerCase().includes(q) ||
      (item.constructor_id || '').toLowerCase().includes(q)
    );
  });

  const visibleItems = filtered.slice(0, limit);

  return (
    <PageTransition>
      <title>APEX | Intelligence Cards</title>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.2rem', marginBottom: 4 }}>Intelligence Cards</h1>
        <p style={{ color: '#555', fontSize: '0.8rem' }}>
          Explore the database of F1 history. Click any driver card to generate an AI career dossier.
        </p>
      </div>

      {/* Controls */}
      <div className="panel" style={{ marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', padding: '14px 20px' }}>
        <div className="seg-control">
          <button className={`seg-btn ${tab === 'drivers' ? 'active' : ''}`} onClick={() => { setTab('drivers'); setSearch(''); setLimit(60); }}>
            DRIVERS
          </button>
          <button className={`seg-btn ${tab === 'teams' ? 'active' : ''}`} onClick={() => { setTab('teams'); setSearch(''); setLimit(60); }}>
            CONSTRUCTORS
          </button>
        </div>

        <input
          type="text"
          placeholder={tab === 'drivers' ? 'Search driver, code or nationality…' : 'Search team name or nationality…'}
          value={search}
          onChange={e => { setSearch(e.target.value); setLimit(60); }}
          className="apex-select"
          style={{ flex: 1, minWidth: 220, maxWidth: 400 }}
        />

        <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.54rem', color: '#555', letterSpacing: '0.12em', whiteSpace: 'nowrap' }}>
          {filtered.length} {tab === 'drivers' ? 'DRIVERS' : 'TEAMS'}
        </span>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', gap: 16 }}>
          <div className="apex-spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.55rem', color: '#444', letterSpacing: '0.2em' }}>
            ASSEMBLING DOSSIERS...
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="panel" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.65rem', color: '#444', letterSpacing: '0.15em' }}>
            {search ? `NO DOSSIERS FOR "${search.toUpperCase()}"` : 'NO DATA AVAILABLE'}
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {visibleItems.map((item, i) => (
              tab === 'drivers' ? (
                <DriverCard key={item.driver_id || i} driver={item} />
              ) : (
                <div key={item.constructor_id || i} className="panel card-hover" style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 6, minHeight: 140 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.52rem', color: '#555', letterSpacing: '0.08em' }}>
                      {item.constructor_id || '---'}
                    </span>
                    <span style={{ fontFamily: 'Titillium Web', fontSize: '0.65rem', color: '#444' }}>
                      {item.nationality || ''}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'Titillium Web, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: '#e0e0e0', lineHeight: 1.2, marginTop: 'auto' }}>
                    {item.name || item.constructor_id || '--'}
                  </div>
                </div>
              )
            ))}
          </div>

          {filtered.length > limit && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 30, marginBottom: 20 }}>
              <button 
                className="btn btn-ghost" 
                onClick={() => setLimit(prev => prev + 60)}
                style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.6rem', letterSpacing: '0.1em' }}
              >
                LOAD MORE
              </button>
            </div>
          )}
        </>
      )}
    </PageTransition>
  );
}
