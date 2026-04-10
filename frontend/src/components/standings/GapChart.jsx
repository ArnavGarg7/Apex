// src/components/standings/GapChart.jsx
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { getTeamColor } from '@/utils/f1Colors';

export default function GapChart({ standings = [], width = 600, height = 260 }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || !standings.length) return;
    const margin = { top: 16, right: 20, bottom: 16, left: 140 };
    const innerW  = width  - margin.left - margin.right;
    const innerH  = height - margin.top  - margin.bottom;
    const barH    = Math.min(22, (innerH / standings.length) - 4);

    const maxGap = d3.max(standings, (d) => d.gap_to_leader) || 1;
    const x = d3.scaleLinear().domain([0, maxGap]).range([0, innerW]).nice();

    const svg = d3.select(svgRef.current);
    svg.attr('width', width).attr('height', height).selectAll('*').remove();

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    standings.forEach((d, i) => {
      const color = getTeamColor(d.team_name);
      const y = i * (barH + 4);

      // Driver label
      g.append('text')
        .attr('x', -8)
        .attr('y', y + barH / 2 + 4)
        .attr('text-anchor', 'end')
        .attr('fill', '#808080')
        .attr('font-family', 'Orbitron, monospace')
        .attr('font-size', '0.6rem')
        .text(d.driver_code || d.team_name?.substring(0, 8));

      // Bar
      g.append('rect')
        .attr('x', 0).attr('y', y).attr('width', 0).attr('height', barH)
        .attr('fill', d.position === 1 ? '#FFD700' : color)
        .attr('rx', 3).attr('opacity', 0.85)
        .transition().duration(500).delay(i * 35).ease(d3.easeQuadOut)
        .attr('width', d.position === 1 ? 4 : x(d.gap_to_leader));

      // Value
      if (d.position !== 1) {
        g.append('text')
          .attr('x', x(d.gap_to_leader) + 6)
          .attr('y', y + barH / 2 + 4)
          .attr('fill', '#555')
          .attr('font-family', 'Orbitron, monospace')
          .attr('font-size', '0.55rem')
          .attr('opacity', 0)
          .text(`-${d.gap_to_leader}pts`)
          .transition().delay(i * 35 + 400).attr('opacity', 1);
      }
    });
  }, [standings, width, height]);

  return <svg ref={svgRef} style={{ display: 'block' }} />;
}
