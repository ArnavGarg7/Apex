// src/pages/News.jsx — Gemini AI-powered news feed
import { useEffect } from 'react';
import PageTransition from '@/components/animations/PageTransition';
import { useRaceData } from '@/hooks/useRaceData';

export default function News() {
  const { data, loading, error, refetch } = useRaceData('/api/news/latest', { immediate: true });

  return (
    <PageTransition>
      <title>APEX | F1 AI News Intelligence</title>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.2rem', marginBottom: 4 }}>AI News Intelligence</h1>
          <p style={{ color: '#555', fontSize: '0.8rem' }}>A full week of F1 developments — aggregated by Gemini AI.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            padding: '5px 12px',
            background: 'rgba(57,181,74,0.08)',
            border: '1px solid rgba(57,181,74,0.2)',
            borderRadius: 4,
            display: 'flex', alignItems: 'center', gap: 7,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#39B54A', boxShadow: '0 0 8px #39B54A', animation: 'breathe 2s ease-in-out infinite' }} />
            <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.52rem', color: '#39B54A', letterSpacing: '0.12em' }}>AI GROUNDED</span>
          </div>
          <button onClick={refetch} className="btn btn-ghost" style={{ fontSize: '0.62rem', padding: '5px 12px' }}>
            REFRESH
          </button>
        </div>
      </div>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', gap: 16 }}>
          <div className="apex-spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.6rem', color: '#444', letterSpacing: '0.2em', animation: 'breathe 2s ease-in-out infinite' }}>
            QUERYING INTELLIGENCE FEED...
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="panel" style={{ borderTop: '2px solid #E10600', padding: '36px 28px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.65rem', color: '#E10600', letterSpacing: '0.15em', marginBottom: 8 }}>
            FEED DISRUPTION
          </div>
          <div style={{ fontSize: '0.78rem', color: '#555', marginBottom: 20, fontFamily: 'Titillium Web' }}>
            {error.includes('Gemini') || error.includes('API') 
              ? 'Gemini AI service temporarily unavailable.' 
              : error}
          </div>
          <button onClick={refetch} className="btn btn-primary" style={{ fontSize: '0.65rem' }}>
            RETRY
          </button>
        </div>
      )}

      {!loading && !error && data?.articles && (() => {
        const articles = data.articles;
        const lead = articles[0];
        const rest = articles.slice(1);
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Featured lead article */}
            <article
              className="panel card-hover"
              style={{
                borderTop: '2px solid #E10600',
                padding: '28px 32px',
                display: 'flex', flexDirection: 'column', gap: 12,
                background: 'linear-gradient(135deg, rgba(225,6,0,0.04) 0%, rgba(0,0,0,0) 100%)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.52rem', color: '#E10600', fontWeight: 700, letterSpacing: '0.12em' }}>
                  {(lead.source || 'F1 NEWS').toUpperCase()}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    fontFamily: 'Orbitron, monospace', fontSize: '0.45rem', color: '#E10600',
                    background: 'rgba(225,6,0,0.1)', border: '1px solid rgba(225,6,0,0.3)',
                    padding: '2px 8px', borderRadius: 3, letterSpacing: '0.15em',
                  }}>LEAD STORY</span>
                  <span style={{ fontFamily: 'Titillium Web', fontSize: '0.65rem', color: '#555' }}>{lead.time || 'Just now'}</span>
                </div>
              </div>
              <h2 style={{ fontFamily: 'Titillium Web, sans-serif', fontWeight: 700, fontSize: '1.25rem', color: '#fff', lineHeight: 1.3, margin: 0 }}>
                {lead.title}
              </h2>
              <p style={{ fontFamily: 'Titillium Web, sans-serif', fontSize: '0.85rem', color: '#aaa', lineHeight: 1.7, margin: 0 }}>
                {lead.summary}
              </p>
              <div style={{ height: 1, background: 'linear-gradient(90deg, rgba(225,6,0,0.5), transparent)', marginTop: 4 }} />
            </article>

            {/* Grid of remaining articles */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 16 }}>
              {rest.map((article, i) => (
                <article
                  key={i}
                  className="panel card-hover"
                  style={{
                    borderTop: `2px solid ${i % 3 === 0 ? '#3671C6' : i % 3 === 1 ? '#E10600' : '#F59E0B'}`,
                    display: 'flex', flexDirection: 'column', gap: 10,
                    padding: '18px 20px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.5rem', color: '#888', fontWeight: 700, letterSpacing: '0.1em' }}>
                      {(article.source || 'F1 NEWS').toUpperCase()}
                    </span>
                    <span style={{ fontFamily: 'Titillium Web', fontSize: '0.62rem', color: '#555' }}>
                      {article.time || 'Just now'}
                    </span>
                  </div>
                  <h2 style={{ fontFamily: 'Titillium Web, sans-serif', fontWeight: 700, fontSize: '0.92rem', color: '#f0f0f0', lineHeight: 1.35, margin: 0 }}>
                    {article.title}
                  </h2>
                  <p style={{ fontFamily: 'Titillium Web, sans-serif', fontSize: '0.76rem', color: '#777', lineHeight: 1.6, margin: 0, flex: 1 }}>
                    {article.summary}
                  </p>
                  <div style={{ height: 1, background: 'linear-gradient(90deg, rgba(255,255,255,0.05), transparent)', marginTop: 4 }} />
                </article>
              ))}
            </div>
          </div>
        );
      })()}

      {!loading && !error && !data && (
        <div className="panel" style={{ textAlign: 'center', padding: '60px 24px', color: '#444' }}>
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.65rem', letterSpacing: '0.2em' }}>
            NO ARTICLES LOADED
          </div>
          <button onClick={refetch} className="btn btn-ghost" style={{ marginTop: 16, fontSize: '0.65rem' }}>
            FETCH NEWS
          </button>
        </div>
      )}
    </PageTransition>
  );
}
