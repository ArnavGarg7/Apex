// src/pages/HeadToHead.jsx — Historical telemetry & race pace comparison
import { useState, useEffect, useRef } from 'react';
import PageTransition from '@/components/animations/PageTransition';
import { useRaceData } from '@/hooks/useRaceData';
import { useUserStore } from '@/store/userStore';
import { getTeamColor } from '@/utils/f1Colors';
import * as d3 from 'd3';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';

const COMPOUND_COLORS = {
  SOFT: '#F94E5A',
  MEDIUM: '#FFD400',
  HARD: '#EDEDED',
  INTERMEDIATE: '#44A540',
  WET: '#1E6FE3',
};

// ── D3 Line Chart for Telemetry ──────────────────────────────────────────────
function TelemetryChart({ data1 = [], data2 = [], color1 = '#E10600', color2 = '#3671C6', yKey = 'speed', maxY }) {
  const svgRef = useRef();

  useEffect(() => {
    const el = svgRef.current;
    if (!el || (!data1.length && !data2.length)) return;

    const w      = el.parentElement.offsetWidth;
    const h      = 200;
    const margin = { top: 12, right: 12, bottom: 30, left: 44 };
    const iW     = w - margin.left - margin.right;
    const iH     = h - margin.top  - margin.bottom;

    const all    = [...data1, ...data2].filter(d => d.distance != null && d[yKey] != null);
    if (!all.length) return;

    const svg = d3.select(el).attr('width', w).attr('height', h);
    svg.selectAll('*').remove();
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([0, d3.max(all, d => d.distance)]).range([0, iW]);
    const y = d3.scaleLinear().domain([0, maxY || d3.max(all, d => d[yKey])]).nice().range([iH, 0]);

    g.append('g')
      .call(d3.axisLeft(y).tickSize(-iW).tickFormat(''))
      .selectAll('line').attr('stroke', 'rgba(255,255,255,0.04)')
      .select(function() { return this.parentNode; })
      .select('.domain').remove();

    const axisStyle = sel => {
      sel.selectAll('text').attr('fill', '#555').attr('font-size', '0.55rem').attr('font-family', 'monospace');
      sel.selectAll('.domain, line').attr('stroke', '#2a2a2a');
    };
    g.append('g').attr('transform', `translate(0,${iH})`).call(d3.axisBottom(x).ticks(6)).call(axisStyle);
    g.append('g').call(d3.axisLeft(y).ticks(5)).call(axisStyle);

    const line = d3.line().x(d => x(d.distance)).y(d => y(d[yKey])).curve(d3.curveMonotoneX);

    [{d: data1, c: color1}, {d: data2, c: color2}].forEach(({d, c}) => {
      if (!d.length) return;
      g.append('path').datum(d).attr('fill','none').attr('stroke', c)
        .attr('stroke-width', 6).attr('opacity', 0.12).attr('d', line);
      const path = g.append('path').datum(d).attr('fill','none').attr('stroke', c)
        .attr('stroke-width', 2).attr('d', line);
      const len = path.node().getTotalLength();
      path.attr('stroke-dasharray', len).attr('stroke-dashoffset', len)
        .transition().duration(900).ease(d3.easeQuadOut).attr('stroke-dashoffset', 0);
    });

    g.append('text').attr('x', iW / 2).attr('y', iH + 26)
      .attr('fill', '#444').attr('font-size', '0.52rem').attr('font-family', 'Orbitron, monospace')
      .attr('text-anchor', 'middle').text('DISTANCE (m)');
  }, [data1, data2, color1, color2, yKey, maxY]);

  return <svg ref={svgRef} style={{ display: 'block', width: '100%' }} />;
}

// ── D3 Scatter Chart for Race Pace ──────────────────────────────────────────
function RacePaceChart({ data1 = [], data2 = [], color1 = '#E10600', color2 = '#3671C6' }) {
  const svgRef = useRef();

  useEffect(() => {
    const el = svgRef.current;
    if (!el || (!data1.length && !data2.length)) return;

    const w      = el.parentElement.offsetWidth;
    const h      = 300;
    const margin = { top: 20, right: 12, bottom: 40, left: 50 };
    const iW     = w - margin.left - margin.right;
    const iH     = h - margin.top  - margin.bottom;

    const all = [...data1, ...data2];
    if (!all.length) return;

    const svg = d3.select(el).attr('width', w).attr('height', h);
    svg.selectAll('*').remove();
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([0, d3.max(all, d => d.lap)]).range([0, iW]);
    // Limit Y axis to mostly normal lap times (eliminate huge SC outliers at the top edge)
    const medianTime = d3.median(all, d => d.time_s);
    const yMin = d3.min(all, d => d.time_s) - 1;
    const yMax = medianTime * 1.15; // Cut off anything 15% slower than median to keep zoom tight
    const y = d3.scaleLinear().domain([yMax, yMin]).nice().range([iH, 0]); // Invert so faster (lower time) is at the TOP!

    g.append('g')
      .call(d3.axisLeft(y).tickSize(-iW).tickFormat(d => `${Math.floor(d/60)}:${(d%60).toFixed(1).padStart(4,'0')}`))
      .selectAll('line').attr('stroke', 'rgba(255,255,255,0.04)')
      .select(function() { return this.parentNode; })
      .select('.domain').remove();

    const axisStyle = sel => {
      sel.selectAll('text').attr('fill', '#666').attr('font-size', '0.55rem').attr('font-family', 'monospace');
      sel.selectAll('.domain, line').attr('stroke', '#2a2a2a');
    };
    g.append('g').attr('transform', `translate(0,${iH})`).call(d3.axisBottom(x).ticks(10)).call(axisStyle);
    g.append('g').call(d3.axisLeft(y).ticks(6).tickFormat(d => `${Math.floor(d/60)}:${(d%60).toFixed(1).padStart(4,'0')}`)).call(axisStyle);

    // X label
    g.append('text').attr('x', iW / 2).attr('y', iH + 32)
      .attr('fill', '#555').attr('font-size', '0.55rem').attr('font-family', 'Orbitron, monospace')
      .attr('text-anchor', 'middle').text('LAP NUMBER');

    // Scatter points
    const drawScatter = (data, baseColor) => {
      // Filter out laps outside our tight Y zoom
      const valid = data.filter(d => d.time_s <= yMax);
      
      const dots = g.selectAll('circle.d')
        .data(valid).enter()
        .append('circle')
        .attr('cx', d => x(d.lap))
        .attr('cy', d => y(d.time_s))
        .attr('r', 0)
        .attr('fill', d => COMPOUND_COLORS[d.compound] || baseColor)
        .attr('stroke', baseColor)
        .attr('stroke-width', 1.5)
        .attr('opacity', 0.85);

      dots.transition().duration(800).delay((d,i) => i * 15).ease(d3.easeElasticOut).attr('r', 3.5);

      // Connect lines to show stints
      const line = d3.line().x(d => x(d.lap)).y(d => y(d.time_s));
      g.append('path')
        .datum(valid)
        .attr('fill', 'none')
        .attr('stroke', baseColor)
        .attr('stroke-width', 1)
        .attr('opacity', 0.4)
        .attr('d', line);
    };

    drawScatter(data1, color1);
    drawScatter(data2, color2);

  }, [data1, data2, color1, color2]);

  return <svg ref={svgRef} style={{ display: 'block', width: '100%' }} />;
}


// ── Main Page ───────────────────────────────────────────────────────────────
export default function HeadToHead() {
  const [mode,    setMode]    = useState('quali'); // 'quali' | 'race'
  const [year,    setYear]    = useState(2024);
  const [round,   setRound]   = useState(1);
  const [driver1, setDriver1] = useState('');
  const [driver2, setDriver2] = useState('');
  const [comparing, setComparing] = useState(false);
  const [compData, setCompData] = useState(null);
  const [compError, setCompError] = useState(null);

  const token = useUserStore((s) => s.idToken);

  const { data: calendar } = useRaceData(`/api/calendar/${year}`, { immediate: true, deps: [year] });
  const { data: results, refetch: fetchResults } = useRaceData(`/api/historical/results?year=${year}&round=${round}`);

  useEffect(() => { fetchResults(); }, [year, round]);

  useEffect(() => {
    if (results?.length >= 2 && !driver1) {
      setDriver1(results[0]?.driver_code || '');
      setDriver2(results[1]?.driver_code || '');
    }
  }, [results]);

  const runComparison = async () => {
    if (!driver1 || !driver2 || !token) return;
    setComparing(true);
    setCompError(null);
    setCompData(null);
    try {
      const endpoint = mode === 'quali' ? 'telemetry-compare' : 'race-pace';
      const res = await fetch(
        `${API_BASE}/api/historical/${endpoint}?year=${year}&round=${round}&driver1=${driver1}&driver2=${driver2}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setCompData(json);
    } catch (e) {
      setCompError(e.message);
    } finally {
      setComparing(false);
    }
  };

  // Clear data when mode changes so user knows they need to fetch again
  useEffect(() => { setCompData(null); setCompError(null); }, [mode]);

  const d1Color = getTeamColor(results?.find(r => r.driver_code === driver1)?.team);
  const d2Color = getTeamColor(results?.find(r => r.driver_code === driver2)?.team);

  return (
    <PageTransition>
      <title>APEX | {mode === 'quali' ? 'Telemetry' : 'Race Pace'} Intelligence</title>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.2rem', marginBottom: 4 }}>Compare Analyzer</h1>
          <p style={{ color: '#555', fontSize: '0.8rem' }}>Deep-dive into 2018–2025 performance data.</p>
        </div>
        
        {/* Mode Toggle */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', borderRadius: 24, padding: 4 }}>
          <button
            onClick={() => setMode('quali')}
            style={{
              background: mode === 'quali' ? '#007FFF' : 'transparent',
              color: mode === 'quali' ? '#fff' : '#666',
              border: 'none', padding: '6px 16px', borderRadius: 20,
              fontFamily: 'Orbitron, monospace', fontSize: '0.65rem', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.3s ease'
            }}
          >
            QUALIFYING LAP
          </button>
          <button
            onClick={() => setMode('race')}
            style={{
              background: mode === 'race' ? '#007FFF' : 'transparent',
              color: mode === 'race' ? '#fff' : '#666',
              border: 'none', padding: '6px 16px', borderRadius: 20,
              fontFamily: 'Orbitron, monospace', fontSize: '0.65rem', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.3s ease'
            }}
          >
            RACE PACE
          </button>
        </div>
      </div>

      {/* Control deck */}
      <div className="panel" style={{ marginBottom: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, alignItems: 'end' }}>
        <div className="field">
          <label className="label">SEASON</label>
          <select value={year} onChange={e => { setYear(Number(e.target.value)); setDriver1(''); setDriver2(''); setCompData(null); }} className="apex-select">
            {[2025,2024,2023,2022,2021,2020,2019,2018].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div className="field">
          <label className="label">EVENT</label>
          <select value={round} onChange={e => { setRound(Number(e.target.value)); setDriver1(''); setDriver2(''); setCompData(null); }} className="apex-select">
            {(calendar || []).map(c => (
              <option key={c.round_number} value={c.round_number}>{c.event_name}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="label">DRIVER 1</label>
          <select
            value={driver1}
            onChange={e => setDriver1(e.target.value)}
            className="apex-select"
            style={{ borderLeft: `3px solid ${d1Color}` }}
          >
            <option value="">Select…</option>
            {(results || []).map(r => <option key={r.driver_code} value={r.driver_code}>{r.driver_code}</option>)}
          </select>
        </div>

        <div className="field">
          <label className="label">DRIVER 2</label>
          <select
            value={driver2}
            onChange={e => setDriver2(e.target.value)}
            className="apex-select"
            style={{ borderLeft: `3px solid ${d2Color}` }}
          >
            <option value="">Select…</option>
            {(results || []).map(r => <option key={r.driver_code} value={r.driver_code}>{r.driver_code}</option>)}
          </select>
        </div>

        <button
          className="btn btn-primary"
          onClick={runComparison}
          disabled={!driver1 || !driver2 || driver1 === driver2 || comparing}
          style={{ height: 38, fontSize: '0.65rem', letterSpacing: '0.12em' }}
        >
          {comparing ? 'LOADING...' : 'ANALYZE'}
        </button>
      </div>

      {/* VS badge */}
      {driver1 && driver2 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 2, background: `linear-gradient(90deg, transparent, ${d1Color})` }} />
          <div style={{ fontFamily: 'Orbitron', fontWeight: 900, fontSize: '1rem', color: '#333', letterSpacing: '0.1em' }}>
            <span style={{ color: d1Color }}>{driver1}</span>
            {' vs '}
            <span style={{ color: d2Color }}>{driver2}</span>
          </div>
          <div style={{ flex: 1, height: 2, background: `linear-gradient(90deg, ${d2Color}, transparent)` }} />
        </div>
      )}

      {/* Loading */}
      {comparing && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0', gap: 16 }}>
          <div className="apex-spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.55rem', color: '#444', letterSpacing: '0.2em', animation: 'breathe 2s ease-in-out infinite' }}>
            EXTRACTING {mode === 'quali' ? 'TELEMETRY' : 'RACE LAPS'} FROM FASTF1...
          </div>
        </div>
      )}

      {compError && !comparing && (
        <div className="panel" style={{ borderTop: '2px solid #E10600', textAlign: 'center', padding: '36px 24px' }}>
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.65rem', color: '#E10600', letterSpacing: '0.15em', marginBottom: 8 }}>
            EXTRACTION FAILED
          </div>
          <div style={{ fontSize: '0.75rem', color: '#555', fontFamily: 'Titillium Web' }}>{compError}</div>
        </div>
      )}

      {/* Analysis Results */}
      {compData && !comparing && (
        <div style={{ display: 'grid', gap: 18 }}>
          
          {mode === 'quali' ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {[{ code: driver1, color: d1Color }, { code: driver2, color: d2Color }].map(({ code, color }) => {
                  const lt = compData[code]?.lap_time;
                  return (
                    <div key={code} className="panel" style={{ textAlign: 'center', borderTop: `2px solid ${color}` }}>
                      <div style={{ fontFamily: 'Orbitron', fontSize: '0.6rem', color, letterSpacing: '0.15em', marginBottom: 8 }}>{code}</div>
                      <div style={{ fontFamily: 'Orbitron', fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>
                        {lt ? `${Math.floor(lt/60)}:${(lt%60).toFixed(3).padStart(6,'0')}` : '--'}
                      </div>
                      <div style={{ fontFamily: 'Titillium Web', fontSize: '0.65rem', color: '#555', marginTop: 4 }}>FASTEST LAP</div>
                    </div>
                  );
                })}
              </div>

              <div className="panel">
                <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  SPEED TRACE (km/h)
                  <span style={{ fontWeight: 400, fontSize: '0.6rem' }}>
                    <span style={{ color: d1Color }}>━━ {driver1}</span>
                    {'  '}
                    <span style={{ color: d2Color }}>━━ {driver2}</span>
                  </span>
                </div>
                <TelemetryChart 
                  data1={compData[driver1]?.telemetry} 
                  data2={compData[driver2]?.telemetry} 
                  color1={d1Color} color2={d2Color} yKey="speed" 
                />
              </div>

              <div className="panel">
                <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  THROTTLE (%)
                </div>
                <TelemetryChart 
                  data1={compData[driver1]?.telemetry} 
                  data2={compData[driver2]?.telemetry} 
                  color1={d1Color} color2={d2Color} yKey="throttle" maxY={105} 
                />
              </div>
            </>
          ) : (
            <>
              {/* Race Pace Legend */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 4 }}>
                {Object.entries(COMPOUND_COLORS).map(([name, col]) => (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: col, border: '1px solid #444' }} />
                    <span style={{ fontSize: '0.55rem', fontFamily: 'Orbitron', color: '#888' }}>{name}</span>
                  </div>
                ))}
              </div>

              <div className="panel">
                <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  RACE DEGRADATION MAP
                  <span style={{ fontWeight: 400, fontSize: '0.6rem' }}>
                    <span style={{ color: d1Color }}>━━ {driver1}</span>
                    {'  '}
                    <span style={{ color: d2Color }}>━━ {driver2}</span>
                  </span>
                </div>
                <p style={{ fontSize: '0.7rem', color: '#555', marginBottom: 12 }}>
                  Higher placement = Faster Lap. Compares raw lap times excluding extreme outliers (like SC laps).
                </p>
                <RacePaceChart 
                  data1={compData[driver1] || []} 
                  data2={compData[driver2] || []} 
                  color1={d1Color} color2={d2Color} 
                />
              </div>
            </>
          )}

        </div>
      )}

      {!compData && !comparing && !compError && (
        <div className="panel" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.65rem', color: '#333', letterSpacing: '0.2em', marginBottom: 8 }}>
            SELECT SEASON, EVENT AND TWO DRIVERS
          </div>
        </div>
      )}
    </PageTransition>
  );
}
