// src/components/strategy/TyreStintBar.jsx
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { getCompoundColor } from '@/utils/f1Colors';
import { gsap } from 'gsap';

export default function TyreStintBar({ stints = [], totalLaps = 60, pitLapPrediction = null, confidence = 0 }) {
  const svgRef = useRef(null);
  const lineRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || !stints.length) return;

    const svg    = d3.select(svgRef.current);
    const W      = svgRef.current.parentElement?.offsetWidth || 600;
    const H      = 80;
    const pad    = { left: 40, right: 20, top: 16, bottom: 24 };
    const innerW = W - pad.left - pad.right;
    const innerH = H - pad.top  - pad.bottom;

    svg.attr('width', W).attr('height', H).selectAll('*').remove();

    const g = svg.append('g').attr('transform', `translate(${pad.left},${pad.top})`);

    const x = d3.scaleLinear().domain([0, totalLaps]).range([0, innerW]);

    // Axis
    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(x).ticks(8).tickFormat((d) => `L${d}`))
      .call((g) => { g.selectAll('text').attr('fill', '#555').attr('font-size', '0.55rem'); g.selectAll('.domain, line').attr('stroke', '#333'); });

    // Stints draw left to right with stagger
    stints.forEach((stint, i) => {
      const xStart = x(stint.startLap);
      const xEnd   = x(stint.endLap || totalLaps);
      const color  = getCompoundColor(stint.compound);

      const rect = g.append('rect')
        .attr('x', xStart)
        .attr('y', 0)
        .attr('width', 0)
        .attr('height', innerH)
        .attr('fill', color)
        .attr('rx', 3)
        .attr('opacity', 0.85);

      rect.transition()
        .duration(800)
        .delay(i * 80)
        .ease(d3.easeQuadOut)
        .attr('width', xEnd - xStart);

      // Stint label
      g.append('text')
        .attr('x', xStart + (xEnd - xStart) / 2)
        .attr('y', innerH / 2 + 4)
        .attr('text-anchor', 'middle')
        .attr('fill', stint.compound === 'MEDIUM' ? '#000' : '#fff')
        .attr('font-family', 'Orbitron, monospace')
        .attr('font-size', '0.55rem')
        .attr('font-weight', 700)
        .attr('opacity', 0)
        .text(stint.compound?.charAt(0) || '?')
        .transition()
        .delay(i * 80 + 600)
        .attr('opacity', 1);
    });

    // Predicted pit line (GSAP drawSVG via stroke-dashoffset)
    if (pitLapPrediction) {
      const px = x(pitLapPrediction);

      // Confidence band
      const bandW    = Math.max(4, confidence * 30);
      g.append('rect')
        .attr('x',      px - bandW / 2)
        .attr('y',      0)
        .attr('width',  bandW)
        .attr('height', innerH)
        .attr('fill',   '#E10600')
        .attr('opacity', 0)
        .transition()
        .delay(900)
        .attr('opacity', confidence * 0.08);

      const pitLine = g.append('line')
        .attr('x1', px).attr('x2', px)
        .attr('y1', innerH).attr('y2', innerH)
        .attr('stroke', '#E10600')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4 3')
        .attr('opacity', 0.9);

      pitLine.transition()
        .duration(600)
        .delay(850)
        .ease(d3.easeQuadOut)
        .attr('y1', 0);

      g.append('text')
        .attr('x', px + 4)
        .attr('y', -4)
        .attr('fill', '#E10600')
        .attr('font-family', 'Orbitron, monospace')
        .attr('font-size', '0.55rem')
        .attr('opacity', 0)
        .text(`PIT L${pitLapPrediction}`)
        .transition()
        .delay(1200)
        .attr('opacity', 1);
    }
  }, [stints, totalLaps, pitLapPrediction, confidence]);

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg ref={svgRef} style={{ display: 'block' }} />
    </div>
  );
}
