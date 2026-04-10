// src/components/three/CircuitScene.jsx
import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, PerspectiveCamera } from '@react-three/drei';
import { useUserStore } from '@/store/userStore';
import { CIRCUIT_SVG_PATHS } from '@/utils/circuitCoords';

function CircuitTrackFallback({ circuitId }) {
  // Procedural track ring as fallback
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <torusGeometry args={[3, 0.2, 4, 64]} />
      <meshStandardMaterial
        color="#E8E8E0"
        emissive="#E8E8E0"
        emissiveIntensity={0.15}
        roughness={0.8}
      />
    </mesh>
  );
}

function FlyoverCamera() {
  const camRef = useRef();
  const angleRef = useRef(0);

  useFrame((_, delta) => {
    angleRef.current += delta * (Math.PI * 2 / 8); // Full lap in 8 seconds
    const r = 5;
    const x = Math.cos(angleRef.current) * r;
    const z = Math.sin(angleRef.current) * r;
    if (camRef.current) {
      camRef.current.position.set(x, 6, z);
      camRef.current.lookAt(0, 0, 0);
    }
  });

  return <PerspectiveCamera ref={camRef} makeDefault fov={60} />;
}

export default function CircuitScene({ circuitId = 'silverstone', height = 350 }) {
  const gpuTier = useUserStore((s) => s.gpuTier);

  if (gpuTier !== null && gpuTier < 2) return null;

  return (
    <div style={{ height, width: '100%', borderRadius: 8, overflow: 'hidden' }}>
      <Canvas style={{ background: '#0D0D0D' }} shadows>
        <FlyoverCamera />
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 10, 5]} intensity={1.0} />
        <pointLight position={[0, 3, 0]} color="#E10600" intensity={0.5} distance={10} />

        <Suspense fallback={null}>
          <CircuitTrackFallback circuitId={circuitId} />
        </Suspense>

        {/* Ground plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0]}>
          <planeGeometry args={[30, 30]} />
          <meshStandardMaterial color="#0A0A0A" />
        </mesh>

        <fog attach="fog" args={['#0D0D0D', 10, 30]} />
      </Canvas>
    </div>
  );
}
