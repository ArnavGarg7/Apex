// src/pages/RadioSentiment.jsx — Radio Sentiment Hub
import { useState, useEffect } from 'react';
import PageTransition from '@/components/animations/PageTransition';
import { useSessionStore } from '@/store/sessionStore';
import { useUserStore } from '@/store/userStore';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';

export default function RadioSentiment() {
  const { sessionKey, isLive } = useSessionStore();
  const token = useUserStore((s) => s.idToken);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSentiment = async () => {
    if (!sessionKey || !token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/radio/sentiment?session_key=${sessionKey}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch and analyze radio sentiment');
      const data = await res.json();
      setMessages(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch on mount
    fetchSentiment();
    
    // Set up polling interval every 30s during live session
    if (isLive) {
      const interval = setInterval(fetchSentiment, 30000);
      return () => clearInterval(interval);
    }
  }, [sessionKey, isLive]);

  const getTagColor = (emotion) => {
    switch(emotion) {
      case 'DANGER': return '#E10600'; // F1 Red
      case 'WARNING': return '#F59E0B'; // Amber
      case 'CLEAR': return '#39B54A'; // Green
      default: return '#3671C6'; // Blue
    }
  };

  return (
    <PageTransition>
      <title>APEX | Radio Sentiment Hub</title>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.2rem', marginBottom: 4 }}>Radio & Race Control Hub</h1>
          <p style={{ color: '#555', fontSize: '0.8rem' }}>AI-categorized live sentiment tracking.</p>
        </div>
        
        <button
          className="btn btn-ghost"
          onClick={fetchSentiment}
          disabled={loading}
          style={{ height: 32, fontSize: '0.65rem' }}
        >
          {loading ? 'SCREWING ON HEADSET...' : 'REFRESH'}
        </button>
      </div>

      {loading && messages.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', gap: 16 }}>
          <div className="apex-spinner" style={{ width: 44, height: 44, borderWidth: 3 }} />
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.6rem', color: '#444', letterSpacing: '0.2em' }}>
            CONNECTING TO RACE CONTROL...
          </div>
        </div>
      ) : error ? (
        <div className="panel" style={{ borderTop: '2px solid #E10600', textAlign: 'center', padding: '36px 24px' }}>
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.65rem', color: '#E10600', letterSpacing: '0.15em', marginBottom: 8 }}>
            CONNECTION GONE DEAD
          </div>
          <div style={{ fontSize: '0.75rem', color: '#555', fontFamily: 'Titillium Web' }}>{error}</div>
        </div>
      ) : messages.length === 0 ? (
        <div className="panel" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.65rem', color: '#333', letterSpacing: '0.2em' }}>
            NO MESSAGES TRANSMITTED
          </div>
          <p style={{ color: '#555', fontSize: '0.7rem', marginTop: 10 }}>It's quiet out there. A little too quiet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {messages.map((msg, i) => {
            const dateStr = msg.date ? new Date(msg.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second:'2-digit' }) : '--:--:--';
            const color = getTagColor(msg.emotion);
            return (
              <div key={i} className="panel" style={{ padding: '16px 20px', borderLeft: `3px solid ${color}` }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                       <div style={{ 
                         fontFamily: 'Orbitron, monospace', fontSize: '0.6rem', color: '#111', 
                         background: color, padding: '3px 8px', borderRadius: 12, fontWeight: 800,
                         letterSpacing: '0.1em'
                       }}>
                         {msg.emotion}
                       </div>
                       <div style={{ fontFamily: 'Titillium Web', fontSize: '0.7rem', color: '#666' }}>
                         {dateStr}
                       </div>
                    </div>
                    {msg.lap_number && (
                      <div style={{ fontFamily: 'Orbitron', fontSize: '0.65rem', color: '#888' }}>
                        LAP {msg.lap_number}
                      </div>
                    )}
                 </div>
                 
                 <div style={{ fontFamily: 'Titillium Web, sans-serif', fontSize: '1.05rem', color: '#e0e0e0', fontWeight: 600 }}>
                   {msg.message}
                 </div>
              </div>
            );
          })}
        </div>
      )}
    </PageTransition>
  );
}
