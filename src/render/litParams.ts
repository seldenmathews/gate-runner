import type * as THREE from 'three';

export type LitParams = {
  color?: THREE.ColorRepresentation;
  emissive?: THREE.ColorRepresentation;
  emissiveIntensity?: number;
  roughness?: number;
  metalness?: number;
  toneMapped?: boolean;
};
