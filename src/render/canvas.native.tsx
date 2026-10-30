import { Canvas } from '@react-three/fiber/native';
import type { ReactNode } from 'react';

export function GameCanvas({ children }: { children: ReactNode }) {
  return (
    <Canvas
      pointerEvents="none"
      style={{ flex: 1 }}
      camera={{ position: [0, 6.4, 12], fov: 52, near: 0.1, far: 260 }}
      gl={{ antialias: false }}
    >
      {children}
    </Canvas>
  );
}
