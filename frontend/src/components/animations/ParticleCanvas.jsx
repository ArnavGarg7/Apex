// src/components/animations/ParticleCanvas.jsx
import { useEffect, useRef } from 'react';
import { useSessionStore } from '@/store/sessionStore';
import { useUserStore } from '@/store/userStore';
import { reducedMotion } from '@/utils/motionPrefs';

const PARTICLE_COUNT = 15;
const ACCENT = { r: 204, g: 30, b: 30 }; // #CC1E1E

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

export default function ParticleCanvas() {
  const canvasRef = useRef(null);
  const gifRef    = useRef(null);
  const isLive    = useSessionStore((s) => s.isLive);
  const gpuTier   = useUserStore((s) => s.gpuTier);

  const shouldRender = isLive && gpuTier >= 2 && !reducedMotion;

  useEffect(() => {
    if (!shouldRender) return;

    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    let raf;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    // Init particles
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      angle: randomBetween(-0.2, 0.2),    // slight angle variance
      speed: randomBetween(0.3, 0.8),
      length: randomBetween(40, 80),
      opacity: 0.03,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        const dx = Math.cos(p.angle) * p.length;
        const dy = Math.sin(p.angle) * p.length;

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.strokeStyle = `rgb(${ACCENT.r},${ACCENT.g},${ACCENT.b})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - dx, p.y - dy);
        ctx.stroke();
        ctx.restore();

        // Move particle (GPU-composited: only transform-like math)
        p.x += Math.cos(p.angle) * p.speed;
        p.y += Math.sin(p.angle) * p.speed - p.speed * 0.1;

        // Wrap
        if (p.x > canvas.width + p.length) p.x = -p.length;
        if (p.y < -p.length) p.y = canvas.height + p.length;
      });

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [shouldRender]);

  if (!shouldRender) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        willChange: 'transform',  // hint for GPU compositing
      }}
    />
  );
}
