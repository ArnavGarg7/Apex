// src/components/animations/LogotypeReveal.jsx
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { reducedMotion } from '@/utils/motionPrefs';

export default function LogotypeReveal({ onComplete }) {
  const lettersRef = useRef([]);
  const taglineRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (reducedMotion) {
      gsap.set(containerRef.current, { opacity: 1 });
      onComplete?.();
      return;
    }

    const tl = gsap.timeline({ onComplete });

    // Each letter: y 60→0, opacity 0→1, stagger 0.08s, ease back.out
    tl.fromTo(
      lettersRef.current,
      { y: 80, opacity: 0, rotateX: -40 },
      {
        y: 0,
        opacity: 1,
        rotateX: 0,
        duration: 0.7,
        stagger: 0.08,
        ease: 'back.out(1.7)',
      }
    );

    // Red line under APEX
    tl.from('.apex-logotype-line', { scaleX: 0, duration: 0.4, ease: 'power2.out' }, '-=0.3');

    // Tagline fades in 0.5s after last letter
    tl.fromTo(
      taglineRef.current,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' },
      '+=0.1'
    );
  }, []);

  const letters = ['A', 'P', 'E', 'X'];

  return (
    <div ref={containerRef} style={{ textAlign: 'center', perspective: '600px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', position: 'relative' }}>
        {letters.map((letter, i) => (
          <span
            key={i}
            ref={(el) => (lettersRef.current[i] = el)}
            style={{
              display: 'inline-block',
              fontFamily: 'Orbitron, monospace',
              fontSize: 'clamp(3rem, 8vw, 6rem)',
              fontWeight: 900,
              color: i === 0 ? '#E10600' : '#FFFFFF',
              letterSpacing: '0.15em',
              lineHeight: 1,
              textShadow: i === 0 ? '0 0 40px rgba(225,6,0,0.6)' : 'none',
            }}
          >
            {letter}
          </span>
        ))}
      </div>

      {/* Red underline */}
      <div
        className="apex-logotype-line"
        style={{
          height: 3,
          background: 'linear-gradient(90deg, transparent, #E10600, transparent)',
          borderRadius: 2,
          margin: '8px auto 0',
          width: '80%',
          transformOrigin: 'left center',
        }}
      />

      {/* Tagline */}
      <p
        ref={taglineRef}
        style={{
          marginTop: 16,
          fontFamily: 'Titillium Web, sans-serif',
          fontSize: '0.75rem',
          fontWeight: 300,
          letterSpacing: '0.4em',
          color: '#808080',
          textTransform: 'uppercase',
        }}
      >
        F1 Intelligence Dashboard
      </p>
    </div>
  );
}
