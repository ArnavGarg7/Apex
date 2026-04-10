// src/components/standings/PointsChart.jsx
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { getTeamColor } from '@/utils/f1Colors';

export default function PointsChart({ data = [], width = 600, height = 280 }) {
  // data: [{ driverCode, teamName, rounds: [{ round, points_cumulative }] }]
  const svgRef = useRef(null);
  const margin = { top: 16, right: 60, bottom: 32, left: 40 };

  useEffect(() => {
    if (!svgRef.current || !data.length) return;
    const innerW = width  - margin.left  - margin.right;
    const innerH = height - margin.top   - margin.bottom;

    const allRounds = data.flatMap((d) => d.rounds?.map((r) => r.round) || []);
    const allPoints = data.flatMap((d) => d.rounds?.map((r) => r.points_cumulative) || []);

    const x = d3.scaleLinear().domain([d3.min(allRounds) || 1, d3.max(allRounds) || 24]).range([0, innerW]);
    const y = d3.scaleLinear().domain([0, d3.max(allPoints) || 100]).range([innerH, 0]).nice();

    const svg = d3.select(svgRef.current);
    svg.attr('width', width).attr('height', height).selectAll('*').remove();

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Grid
    g.append('g')
      .call(d3.axisLeft(y).ticks(5).tickSize(-innerW).tickFormat(''))
      .call((g) => g.selectAll('line').attr('stroke', 'rgba(255,255,255,0.04)'))
      .call((g) => g.selectAll('.domain').remove());

    g.append('g').attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(x).ticks(6).tickFormat((d) => `R${d}`))
      .call((g) => { g.selectAll('text').attr('fill', '#555').attr('font-size', '0.55rem'); g.selectAll('.domain, line').attr('stroke', '#333'); });
    g.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .call((g) => { g.selectAll('text').attr('fill', '#555').attr('font-size', '0.55rem'); g.selectAll('.domain, line').attr('stroke', '#333'); });

    const line = d3.line().x((d) => x(d.round)).y((d) => y(d.points_cumulative)).curve(d3.curveMonotoneX);

    data.forEach((driver, idx) => {
      if (!driver.rounds?.length) return;
      const color = getTeamColor(driver.teamName);

      const path = g.append('path')
        .datum(driver.rounds)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 2)
        .attr('opacity', 0.9)
        .attr('d', line);

      const totalLen = path.node().getTotalLength();
      path.attr('stroke-dasharray', totalLen).attr('stroke-dashoffset', totalLen)
        .transition().duration(600).delay(idx * 100).ease(d3.easeQuadOut)
        .attr('stroke-dashoffset', 0);

      // Driver label at end
      const last = driver.rounds[driver.rounds.length - 1];
      if (last) {
        g.append('text')
          .attr('x', x(last.round) + 4)
          .attr('y', y(last.points_cumulative) + 4)
          .attr('fill', color)
          .attr('font-family', 'Orbitron, monospace')
          .attr('font-size', '0.55rem')
          .attr('font-weight', 700)
          .attr('opacity', 0)
          .text(driver.driverCode)
          .transition().delay(idx * 100 + 600).attr('opacity', 1);
      }
    });
  }, [data, width, height]);

  return <svg ref={svgRef} style={{ display: 'block' }} />;
}
