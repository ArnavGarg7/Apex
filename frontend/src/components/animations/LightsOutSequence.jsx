// src/components/animations/LightsOutSequence.jsx
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ifMotion } from '@/utils/motionPrefs';

const STORAGE_KEY = 'lightsOutShown';

export default function LightsOutSequence({ onComplete }) {
  const overlayRef = useRef(null);
  const lightsRef  = useRef([]);

  useEffect(() => {
    // If already shown this session, skip immediately
    if (sessionStorage.getItem(STORAGE_KEY)) {
      onComplete?.();
      return;
    }

    ifMotion(
      () => {
        // Full GSAP lights-out sequence
        const tl = gsap.timeline({
          onComplete: () => {
            sessionStorage.setItem(STORAGE_KEY, '1');
            onComplete?.();
          },
        });

        // Start with overlay fully black
        tl.set(overlayRef.current, { opacity: 1 });
        tl.set(lightsRef.current, { scale: 0, opacity: 0 });

        // 5 red circles appear left to right, stagger 0.4s
        tl.to(lightsRef.current, {
          scale: 1,
          opacity: 1,
          duration: 0.3,
          stagger: 0.4,
          ease: 'back.out(1.7)',
        });

        // Add red glow to each light sequentially
        lightsRef.current.forEach((el, i) => {
          tl.to(el, {
            boxShadow: '0 0 30px #E10600, 0 0 60px rgba(225,6,0,0.5)',
            duration: 0.2,
          }, `+=${i === 0 ? 0 : 0}`);
        });

        // Hold 0.5s
        tl.to({}, { duration: 0.5 });

        // All 5 extinguish simultaneously (LIGHTS OUT!)
        tl.to(lightsRef.current, {
          opacity: 0,
          scale: 0.6,
          duration: 0.2,
          stagger: 0,
          ease: 'power2.in',
        });

        // Overlay fades out
        tl.to(overlayRef.current, {
          opacity: 0,
          duration: 0.3,
          ease: 'power2.out',
        });
      },
      () => {
        // Reduced motion: skip immediately
        sessionStorage.setItem(STORAGE_KEY, '1');
        onComplete?.();
      }
    );
  }, []);

  return (
    <div
      ref={overlayRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
        pointerEvents: 'none',
      }}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          ref={(el) => (lightsRef.current[i] = el)}
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #FF2200, #AA0000)',
            border: '2px solid rgba(255,60,0,0.4)',
            transformOrigin: 'center',
          }}
          aria-hidden="true"
        />
      ))}
      {/* PIT BOARD for context */}
      <div style={{
        position: 'absolute',
        bottom: '15%',
        fontFamily: 'Orbitron, monospace',
        fontSize: '0.65rem',
        letterSpacing: '0.4em',
        color: 'rgba(255,255,255,0.3)',
        textTransform: 'uppercase',
      }}>
        APEX F1 INTELLIGENCE
      </div>
    </div>
  );
}
