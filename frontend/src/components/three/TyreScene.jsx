// src/components/three/TyreScene.jsx
import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { getCompoundColor } from '@/utils/f1Colors';

function TyreMesh({ compound }) {
  const meshRef = useRef();
  const color = getCompoundColor(compound);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.8;
    }
  });

  return (
    <group ref={meshRef}>
      {/* Outer tyre torus */}
      <mesh>
        <torusGeometry args={[1, 0.42, 16, 48]} />
        <meshStandardMaterial color="#111111" roughness={0.85} metalness={0.05} />
      </mesh>
      {/* Tyre sidewall with compound color */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.62, 0.62, 0.05, 32]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.4} emissive={color} emissiveIntensity={0.2} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.62, 0.62, 0.05, 32]} position={[0, 0.82, 0]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.4} emissive={color} emissiveIntensity={0.2} />
      </mesh>
    </group>
  );
}

export default function TyreScene({ compound = 'SOFT' }) {
  return (
    <div style={{ width: 200, height: 200 }}>
      <Canvas camera={{ position: [0, 0, 3.5], fov: 40 }} style={{ background: 'transparent' }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[3, 3, 2]} intensity={1.0} />
        <pointLight position={[-2, 1, 2]} color={getCompoundColor(compound)} intensity={1.5} />
        <TyreMesh compound={compound} />
      </Canvas>
    </div>
  );
}
