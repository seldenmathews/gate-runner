import * as THREE from 'three';
import type { LitParams } from './litParams';

export type { LitParams };

/** Web keeps standard materials. iOS uses materials.native.tsx so it never samples the DFG LUT. */
export function createLitMaterial(params: LitParams): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial(params);
}

export function LitMaterial(props: LitParams) {
  return <meshStandardMaterial {...props} />;
}
