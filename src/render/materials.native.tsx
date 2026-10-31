import * as THREE from 'three';
import type { LitParams } from './litParams';

/**
 * Lambert is lit by the scene lights and its shader does not sample three's
 * half-float DFG lookup, which Expo GL cannot upload.
 */
export function createLitMaterial(params: LitParams): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({
    color: params.color,
    emissive: params.emissive,
    emissiveIntensity: params.emissiveIntensity,
    toneMapped: params.toneMapped,
  });
}

export function LitMaterial(props: LitParams) {
  return (
    <meshLambertMaterial
      color={props.color}
      emissive={props.emissive}
      emissiveIntensity={props.emissiveIntensity}
      toneMapped={props.toneMapped}
    />
  );
}
