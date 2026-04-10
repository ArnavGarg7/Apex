// src/pages/Splash.jsx — Interactive 3D car + ESTABLISH UPLINK CTA button
import { useState, useEffect, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Html, useProgress, useGLTF } from '@react-three/drei';
import { useGpuTier } from '@/hooks/useGpuTier';
import LogotypeReveal from '@/components/animations/LogotypeReveal';

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div style={{ color: '#E10600', fontFamily: 'Orbitron', fontSize: '0.75rem', letterSpacing: '0.2em', whiteSpace: 'nowrap' }}>
        RENDERING {progress.toFixed(0)}%
      </div>
    </Html>
  );
}

function F1CarModel() {
  const { scene } = useGLTF('/assets/models/f1-car.glb');
  return <primitive object={scene} scale={1} position={[0, -0.2, 0]} />;
}

function InteractiveCarScene({ height = 360 }) {
  return (
    <div style={{ height, width: '100%', position: 'relative', cursor: 'grab' }}>
      <Canvas
        camera={{ position: [0, 1.5, 4.5], fov: 42 }}
        style={{ background: 'transparent' }}
        shadows
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.35} />
        <directionalLight position={[-3, 5, 2]} intensity={1.4} castShadow />
        <pointLight position={[2, 1, 2]} color="#E10600" intensity={2} distance={7} />
        <pointLight position={[-2, 0.5, -2]} color="#3671C6" intensity={0.6} distance={5} />
        <pointLight position={[0, -0.5, 0]} color="#E10600" intensity={0.3} distance={3} />

        <Suspense fallback={<Loader />}>
          <F1CarModel />
        </Suspense>

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={1.2}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.8}
        />
        <fog attach="fog" args={['#0D0D0D', 10, 25]} />
      </Canvas>

      {/* Drag hint */}
      <div style={{
        position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
        fontFamily: 'Orbitron, monospace', fontSize: '0.5rem', color: '#444',
        letterSpacing: '0.2em', animation: 'breathe 3s ease-in-out infinite',
        whiteSpace: 'nowrap',
      }}>
        ← DRAG TO ROTATE →
      </div>
    </div>
  );
}

export default function Splash() {
  const [progress, setProgress] = useState(0);
  const [revealDone, setRevealDone] = useState(false);
  const [carReady, setCarReady] = useState(false);
  const navigate = useNavigate();
  const gpuTier = useGpuTier();

  // Simulate asset loading progress
  useEffect(() => {
    let p = 0;
    const timer = setInterval(() => {
      p += Math.random() * 12 + 4;
      if (p >= 100) {
        p = 100;
        clearInterval(timer);
        setTimeout(() => setCarReady(true), 500);
      }
      setProgress(Math.min(100, p));
    }, 180);
    return () => clearInterval(timer);
  }, []);

  const canEnter = progress >= 100 && revealDone;

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#0D0D0D',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 0, overflow: 'hidden',
    }}>
      {/* Background radial glow */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center bottom, rgba(225,6,0,0.07) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      {/* Scanline */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, transparent, rgba(225,6,0,0.4), transparent)',
        animation: 'scan-line 4s linear infinite',
        pointerEvents: 'none',
      }} />

      {/* Grid lines overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.03,
        backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
        backgroundSize: '80px 80px',
      }} />

      {/* 3D Car — Background Layer */}
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        opacity: 0.5, // Reduced opacity as requested
        pointerEvents: 'none', // Allow clicks to pass through to the button
      }}>
        <InteractiveCarScene height="100vh" />
      </div>

      {/* Main Content — Centered Hero Layer */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '0 24px',
      }}>
        {/* Logo reveal */}
        <div style={{ marginBottom: 10 }}>
          <LogotypeReveal onComplete={() => setRevealDone(true)} />
        </div>

        {/* Tagline */}
        <div style={{
          fontFamily: 'Titillium Web, sans-serif',
          fontSize: '0.82rem',
          color: '#888',
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          marginBottom: 40,
        }}>
          Formula 1 Intelligence Platform
        </div>

        {/* ESTABLISH UPLINK button */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => canEnter && navigate('/auth')}
            disabled={!canEnter}
            style={{
              fontFamily: 'Orbitron, monospace',
              fontWeight: 700,
              fontSize: '0.8rem',
              letterSpacing: '0.3em',
              color: canEnter ? '#fff' : '#444',
              background: canEnter
                ? 'linear-gradient(180deg, #E10600 0%, #B00500 100%)'
                : 'transparent',
              border: canEnter ? '1px solid rgba(255,255,255,0.2)' : '1px solid #2a2a2a',
              borderRadius: 4,
              padding: '16px 48px',
              cursor: canEnter ? 'pointer' : 'default',
              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: canEnter
                ? '0 0 40px rgba(225,6,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)'
                : 'none',
              animation: canEnter ? 'pulse-cta 2s ease-in-out infinite' : 'none',
            }}
          >
            {canEnter ? 'ESTABLISH UPLINK' : 'INITIALIZING SYSTEM...'}
          </button>

          {/* Progress bar — Integrated below button */}
          <div style={{ width: '100%', maxWidth: 240, margin: '24px auto 0' }}>
            <div className="progress-bar" style={{ height: 2, background: 'rgba(255,255,255,0.05)' }}>
              <div className="progress-bar-fill" style={{
                width: `${progress}%`,
                background: '#E10600',
                boxShadow: '0 0 10px #E10600'
              }} />
            </div>
          </div>
        </div>
      </div>
        {/* Loading sub-dots */}
        {!canEnter && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 12 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 4, height: 4, borderRadius: '50%', background: '#333',
                animation: `breathe 1.2s ease-in-out ${i * 0.2}s infinite`,
              }} />
            ))}
          </div>
        )}
      </div>

      {/* Corner tags */}
      <div style={{ position: 'absolute', bottom: 20, right: 24, fontFamily: 'Orbitron, monospace', fontSize: '0.45rem', color: '#2a2a2a', letterSpacing: '0.15em' }}>
        APEX v2.0 — F1 INTELLIGENCE SYSTEM
      </div>
    </div>
  );
}
