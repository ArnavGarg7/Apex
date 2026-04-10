// src/components/strategy/PitGauge.jsx
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const MIN_ANGLE = -130; // degrees
const MAX_ANGLE =  130;

function probToAngle(prob) {
  return MIN_ANGLE + (prob * (MAX_ANGLE - MIN_ANGLE));
}

export default function PitGauge({ confidence = 0, isPitWindow = false }) {
  const needleRef   = useRef(null);
  const overlayRef  = useRef(null);
  const labelRef    = useRef(null);

  useEffect(() => {
    const angle = probToAngle(confidence);

    gsap.to(needleRef.current, {
      rotate: angle,
      duration: 0.5,
      ease: 'elastic.out(1, 0.6)',
    });

    if (isPitWindow) {
      // Snap needle to right
      gsap.to(needleRef.current, { rotate: MAX_ANGLE, duration: 0.2, ease: 'power3.out' });

      // Red pulse on face
      const tl = gsap.timeline({ repeat: -1 });
      tl.to(overlayRef.current, { opacity: 0.15, duration: 0.4, ease: 'power2.out' })
        .to(overlayRef.current, { opacity: 0,    duration: 0.8, ease: 'power2.in' })
        .to({}, { duration: 0.3 });

      // PIT NOW text
      gsap.fromTo(labelRef.current,
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' }
      );

      return () => { tl.kill(); };
    } else {
      gsap.to(overlayRef.current, { opacity: 0, duration: 0.3 });
      gsap.to(labelRef.current,   { scale: 0, opacity: 0, duration: 0.2 });
    }
  }, [confidence, isPitWindow]);

  const gaugeColor = confidence > 0.6 ? '#E10600' : confidence > 0.4 ? '#F59E0B' : '#808080';

  return (
    <div style={{ position: 'relative', width: 320, height: 200, margin: '0 auto', userSelect: 'none' }}>
      <svg viewBox="0 0 320 200" style={{ width: '100%', height: '100%' }}>
        {/* Gauge arc background */}
        <path
          d="M 40 170 A 120 120 0 0 1 280 170"
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="18"
          strokeLinecap="round"
        />

        {/* Confidence arc */}
        <path
          d="M 40 170 A 120 120 0 0 1 280 170"
          fill="none"
          stroke={gaugeColor}
          strokeWidth="18"
          strokeLinecap="round"
          strokeDasharray={`${confidence * 377} 377`}
          style={{ filter: `drop-shadow(0 0 4px ${gaugeColor}80)`, transition: 'stroke-dasharray 0.5s ease, stroke 0.3s ease' }}
        />

        {/* Tick marks */}
        {[0, 0.25, 0.5, 0.75, 1].map((v) => {
          const a = (probToAngle(v) * Math.PI) / 180;
          const cx = 160 + 105 * Math.sin(a);
          const cy = 170 - 105 * Math.cos(a);
          const x1 = 160 + 115 * Math.sin(a), y1 = 170 - 115 * Math.cos(a);
          return (
            <line key={v} x1={cx} y1={cy} x2={x1} y2={y1}
              stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round"
            />
          );
        })}

        {/* Centre */}
        <circle cx="160" cy="170" r="10" fill="#1A1A1A" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      </svg>

      {/* Needle */}
      <div
        ref={needleRef}
        style={{
          position: 'absolute',
          left: '50%',
          top: 80,
          width: 2,
          height: 90,
          background: 'linear-gradient(#E10600, rgba(225,6,0,0.3))',
          transformOrigin: '50% 90px',
          transform: `translateX(-50%) rotate(${MIN_ANGLE}deg)`,
          borderRadius: 1,
          transition: 'none',
          willChange: 'transform',
        }}
      />

      {/* Red pulse overlay */}
      <div
        ref={overlayRef}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center bottom, rgba(225,6,0,0.3), transparent 70%)',
          opacity: 0,
          pointerEvents: 'none',
        }}
      />

      {/* PIT NOW label */}
      <div
        ref={labelRef}
        style={{
          position: 'absolute',
          bottom: 30,
          left: '50%',
          transform: 'translateX(-50%) scale(0)',
          fontFamily: 'Orbitron, monospace',
          fontSize: '0.9rem',
          fontWeight: 900,
          letterSpacing: '0.2em',
          color: '#E10600',
          whiteSpace: 'nowrap',
          textShadow: '0 0 20px rgba(225,6,0,0.8)',
          opacity: 0,
        }}
      >
        PIT NOW
      </div>

      {/* Confidence % */}
      <div style={{
        position: 'absolute',
        bottom: isPitWindow ? 50 : 20,
        left: '50%',
        transform: 'translateX(-50%)',
        fontFamily: 'Orbitron, monospace',
        fontSize: '1.4rem',
        fontWeight: 700,
        color: gaugeColor,
        textAlign: 'center',
        transition: 'color 0.3s ease',
      }}>
        {Math.round(confidence * 100)}%
        <div style={{ fontFamily: 'Titillium Web', fontSize: '0.6rem', color: '#555', letterSpacing: '0.15em', marginTop: 2 }}>
          PIT CONFIDENCE
        </div>
      </div>
    </div>
  );
}
