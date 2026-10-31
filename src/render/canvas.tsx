import { Canvas } from '@react-three/fiber';
import type { ReactNode } from 'react';

/** Web canvas. iOS and Android use canvas.native.tsx. */
export function GameCanvas({ children }: { children: ReactNode }) {
  return (
    <Canvas
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      camera={{ position: [0, 6.4, 12], fov: 52, near: 0.1, far: 260 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      {children}
    </Canvas>
  );
}
