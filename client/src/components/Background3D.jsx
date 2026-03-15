import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sphere, MeshDistortMaterial, Environment } from '@react-three/drei';
import * as THREE from 'three';

function FloatingShapes() {
  return (
    <>
      <ambientLight intensity={1} />
      <directionalLight position={[10, 10, 5]} intensity={2} color="#ffffff" />
      <directionalLight position={[-10, -10, -5]} intensity={1} color="#ffebf0" />
      
      {/* Top Left Organic Blobs */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        <Sphere args={[1.2, 64, 64]} position={[-4, 3, -6]}>
          <MeshDistortMaterial color="#ff4b4b" distort={0.4} speed={2} roughness={0.1} transmission={0.9} thickness={1} transparent opacity={0.4} clearcoat={1} clearcoatRoughness={0.1} />
        </Sphere>
      </Float>

      {/* Bottom Right organic blobs */}
      <Float speed={1.5} rotationIntensity={0.8} floatIntensity={2}>
        <Sphere args={[2, 64, 64]} position={[5, -2, -8]}>
          <MeshDistortMaterial color="#ff7b54" distort={0.3} speed={1.5} roughness={0.2} transmission={0.8} thickness={2} transparent opacity={0.3} clearcoat={1} />
        </Sphere>
      </Float>

      {/* Center Left small blob */}
      <Float speed={3} rotationIntensity={1} floatIntensity={1.5}>
        <Sphere args={[0.8, 64, 64]} position={[-2, -3, -4]}>
          <MeshDistortMaterial color="#ffb703" distort={0.5} speed={3} roughness={0.2} transmission={0.9} transparent opacity={0.5} clearcoat={1} />
        </Sphere>
      </Float>
      
      {/* Top Right small blob */}
      <Float speed={2.5} rotationIntensity={1.5} floatIntensity={2}>
        <Sphere args={[0.6, 64, 64]} position={[4, 4, -5]}>
          <MeshDistortMaterial color="#d90429" distort={0.4} speed={2} roughness={0.1} transmission={0.9} transparent opacity={0.4} clearcoat={1} />
        </Sphere>
      </Float>
    </>
  );
}

export default function Background3D() {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none bg-gradient-to-br from-gray-50/80 to-gray-200/80">
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }} gl={{ alpha: true, antialias: true }}>
        <FloatingShapes />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
