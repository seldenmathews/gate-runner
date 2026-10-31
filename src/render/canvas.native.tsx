import {
  applyNativeRendererState,
  installNativeGlGuards,
  nativeRendererParameters,
} from './nativeGl';
import { Canvas } from '@react-three/fiber/native';
import type { ReactNode } from 'react';

installNativeGlGuards();

export function GameCanvas({ children }: { children: ReactNode }) {
  return (
    <Canvas
      pointerEvents="none"
      style={{ flex: 1 }}
      flat
      linear
      camera={{ position: [0, 6.4, 12], fov: 52, near: 0.1, far: 260 }}
      gl={{ ...nativeRendererParameters }}
      onCreated={({ gl }) => {
        applyNativeRendererState(gl);
      }}
    >
      {children}
    </Canvas>
  );
}
