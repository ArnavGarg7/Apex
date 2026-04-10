// src/components/live/LapChart.jsx
import { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { getTeamColor } from '@/utils/f1Colors';

export default function LapChart({ data = {}, width = 600, height = 300 }) {
  // data: { [driverCode]: { laps: [{ lap, position }], teamName, pitLaps: [] } }
  const svgRef = useRef(null);
  const margin = { top: 16, right: 24, bottom: 32, left: 32 };
  const innerW  = width  - margin.left  - margin.right;
  const innerH  = height - margin.top   - margin.bottom;

  useEffect(() => {
    if (!svgRef.current) return;
    const drivers = Object.entries(data);
    if (!drivers.length) return;

    const allLaps = drivers.flatMap(([, d]) => d.laps || []);
    if (!allLaps.length) return;

    const maxLap = d3.max(allLaps, (d) => d.lap) || 1;
    const maxPos = d3.max(allLaps, (d) => d.position) || 20;

    const x = d3.scaleLinear().domain([1, maxLap]).range([0, innerW]);
    const y = d3.scaleLinear().domain([1, maxPos]).range([0, innerH]);

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg
      .attr('width',  width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(y).tickSize(-innerW).tickFormat('').ticks(5))
      .call((g) => g.selectAll('line').attr('stroke', 'rgba(255,255,255,0.04)'))
      .call((g) => g.selectAll('.domain').remove());

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(x).ticks(6).tickFormat((d) => `L${d}`))
      .call((g) => { g.selectAll('text').attr('fill', '#555').attr('font-size', '0.55rem'); g.selectAll('.domain, line').attr('stroke', '#333'); });

    // Y axis
    g.append('g')
      .call(d3.axisLeft(y).ticks(5).tickFormat((d) => `P${d}`))
      .call((g) => { g.selectAll('text').attr('fill', '#555').attr('font-size', '0.55rem'); g.selectAll('.domain, line').attr('stroke', '#333'); });

    const line = d3.line()
      .x((d) => x(d.lap))
      .y((d) => y(d.position))
      .curve(d3.curveMonotoneX);

    drivers.forEach(([code, info], idx) => {
      const color = getTeamColor(info.teamName);
      const laps  = info.laps || [];
      if (!laps.length) return;

      const path = g.append('path')
        .datum(laps)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 2)
        .attr('d', line);

      // Draw-in animation via stroke-dasharray trick
      const totalLength = path.node().getTotalLength();
      path
        .attr('stroke-dasharray', totalLength)
        .attr('stroke-dashoffset', totalLength)
        .transition()
        .duration(600)
        .delay(idx * 100)
        .ease(d3.easeQuadOut)
        .attr('stroke-dashoffset', 0);

      // Pit stop markers
      (info.pitLaps || []).forEach((lapN) => {
        g.append('circle')
          .attr('cx', x(lapN))
          .attr('cy', y(laps.find((l) => l.lap === lapN)?.position || 1))
          .attr('r', 0)
          .attr('fill', color)
          .attr('stroke', '#0D0D0D')
          .attr('stroke-width', 1.5)
          .transition()
          .duration(300)
          .delay(700 + idx * 100)
          .attr('r', 4);
      });
    });
  }, [data, width, height]);

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg ref={svgRef} style={{ display: 'block', background: 'transparent' }} />
    </div>
  );
}
