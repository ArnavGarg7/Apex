// src/components/three/F1CarScene.jsx
import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment, PresentationControls, Html, useProgress } from '@react-three/drei';
import { useUserStore } from '@/store/userStore';

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div style={{ color: '#E10600', fontFamily: 'Orbitron', fontSize: '1rem', whiteSpace: 'nowrap' }}>
        LOADING ASSETS {progress.toFixed(0)}%
      </div>
    </Html>
  );
}

function F1CarModel() {
  const { scene } = useGLTF('/assets/models/f1-car.glb');
  return <primitive object={scene} scale={1} position={[0, -0.2, 0]} />;
}

export default function F1CarScene({ height = 300 }) {
  const gpuTier = useUserStore((s) => s.gpuTier);

  if (gpuTier !== null && gpuTier < 2) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>
        <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.65rem', letterSpacing: '0.2em' }}>
          3D DISABLED — LOW GPU
        </span>
      </div>
    );
  }

  return (
    <div style={{ height, width: '100%', position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 1.5, 4], fov: 45 }}
        style={{ background: '#0D0D0D' }}
        shadows
        gl={{ antialias: true, alpha: false }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.3} />
        <directionalLight position={[-3, 4, 2]} intensity={1.2} castShadow />
        <pointLight position={[2, 1, 2]} color="#E10600" intensity={1.5} distance={6} />
        <pointLight position={[-2, 0.5, -2]} color="#3671C6" intensity={0.5} distance={4} />

        {/* Auto-rotating car */}
        <PresentationControls
          global
          rotation={[0, 0, 0]}
          polar={[-Math.PI / 4, Math.PI / 4]}
          azimuth={[-Math.PI, Math.PI]}
          speed={1}
        >
          <group rotation={[0, 0, 0]}>
            <Suspense fallback={<Loader />}>
              <F1CarModel />
            </Suspense>
          </group>
        </PresentationControls>

        <fog attach="fog" args={['#0D0D0D', 8, 20]} />
      </Canvas>
    </div>
  );
}
