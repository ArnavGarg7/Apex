// src/components/strategy/ShapWaterfall.jsx
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { gsap } from 'gsap';

export default function ShapWaterfall({ shapValues = [] }) {
  // shapValues: [{ feature, value, direction }]
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || !shapValues.length) return;

    const sorted = [...shapValues].sort((a, b) => Math.abs(b.value) - Math.abs(a.value)).slice(0, 10);
    const W = Math.min(600, svgRef.current.parentElement?.offsetWidth || 600);
    const rowH  = 30;
    const H     = sorted.length * rowH + 48;
    const labelW = 140;
    const barArea = W - labelW - 20;

    const svg = d3.select(svgRef.current);
    svg.attr('width', W).attr('height', H).selectAll('*').remove();

    const maxAbs  = d3.max(sorted, (d) => Math.abs(d.value)) || 1;
    const xScale  = d3.scaleLinear().domain([-maxAbs, maxAbs]).range([-barArea / 2, barArea / 2]);
    const gOrigin = W / 2;

    const g = svg.append('g').attr('transform', `translate(0, 24)`);

    // Zero line
    g.append('line')
      .attr('x1', gOrigin).attr('x2', gOrigin)
      .attr('y1', 0).attr('y2', sorted.length * rowH)
      .attr('stroke', 'rgba(255,255,255,0.1)').attr('stroke-width', 1);

    sorted.forEach((d, i) => {
      const isPit = d.direction === 'pit';
      const color = isPit ? '#E10600' : '#555555';
      const barW  = Math.abs(xScale(d.value) - xScale(0));
      const barX  = isPit ? gOrigin : gOrigin - barW;

      // Feature label
      g.append('text')
        .attr('x', labelW - 8)
        .attr('y', i * rowH + rowH / 2 + 4)
        .attr('text-anchor', 'end')
        .attr('fill', '#888')
        .attr('font-family', 'Titillium Web, sans-serif')
        .attr('font-size', '0.65rem')
        .text(d.feature.replace(/_/g, ' '));

      // Bar (animated)
      const rect = g.append('rect')
        .attr('x', barX)
        .attr('y', i * rowH + 4)
        .attr('width', 0)
        .attr('height', rowH - 8)
        .attr('fill', color)
        .attr('rx', 3)
        .attr('opacity', 0.85);

      rect.transition()
        .duration(500)
        .delay(i * 40)
        .ease(d3.easeQuadOut)
        .attr('width', barW);

      // Value label
      g.append('text')
        .attr('x', isPit ? gOrigin + barW + 4 : gOrigin - barW - 4)
        .attr('y', i * rowH + rowH / 2 + 4)
        .attr('text-anchor', isPit ? 'start' : 'end')
        .attr('fill', color)
        .attr('font-family', 'Orbitron, monospace')
        .attr('font-size', '0.55rem')
        .attr('opacity', 0)
        .text(`${d.value > 0 ? '+' : ''}${d.value.toFixed(3)}`)
        .transition()
        .delay(i * 40 + 400)
        .attr('opacity', 0.9);
    });

    // Legend
    const legend = svg.append('g').attr('transform', `translate(${W - 150}, 8)`);
    [{ color: '#E10600', label: 'Pit factor' }, { color: '#555', label: 'Stay-out factor' }].forEach(({ color, label }, i) => {
      legend.append('rect').attr('x', i * 80).attr('y', 0).attr('width', 10).attr('height', 10).attr('fill', color).attr('rx', 2);
      legend.append('text').attr('x', i * 80 + 14).attr('y', 8).attr('fill', '#666').attr('font-size', '0.55rem').attr('font-family', 'Titillium Web').text(label);
    });
  }, [shapValues]);

  if (!shapValues.length) {
    return <div style={{ color: '#555', fontFamily: 'Orbitron, monospace', fontSize: '0.7rem', textAlign: 'center', padding: 24 }}>NO SHAP DATA</div>;
  }

  return <svg ref={svgRef} style={{ display: 'block' }} />;
}
