import * as THREE from 'three';

export const MAX_PARTICLES = 360;

interface Slot {
  alive: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  max: number;
  size: number;
  color: THREE.Color;
}

const dummy = new THREE.Object3D();

export class ParticleField {
  readonly slots: Slot[];
  mesh: THREE.InstancedMesh | null = null;

  constructor() {
    this.slots = Array.from({ length: MAX_PARTICLES }, () => ({
      alive: false,
      x: 0,
      y: 0,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      life: 0,
      max: 1,
      size: 0.1,
      color: new THREE.Color(),
    }));
  }

  burst(
    x: number,
    y: number,
    z: number,
    count: number,
    color: string,
    speed: number,
    life: number,
  ): void {
    let spawned = 0;
    for (const slot of this.slots) {
      if (spawned >= count) break;
      if (slot.alive) continue;
      const angle = spawned * 2.399963;
      const mag = speed * (0.45 + (spawned % 5) * 0.12);
      slot.alive = true;
      slot.x = x;
      slot.y = y;
      slot.z = z;
      slot.vx = Math.cos(angle) * mag;
      slot.vz = Math.sin(angle) * mag * 0.65;
      slot.vy = speed * (0.7 + (spawned % 3) * 0.28);
      slot.life = life;
      slot.max = life;
      slot.size = 0.08 + (spawned % 4) * 0.025;
      slot.color.set(color);
      spawned += 1;
    }
  }

  update(dt: number): void {
    const mesh = this.mesh;
    if (!mesh) return;
    let index = 0;
    for (const slot of this.slots) {
      if (!slot.alive) continue;
      slot.life -= dt;
      if (slot.life <= 0) {
        slot.alive = false;
        continue;
      }
      slot.vy -= 7.5 * dt;
      slot.x += slot.vx * dt;
      slot.y += slot.vy * dt;
      slot.z += slot.vz * dt;
      const fade = Math.max(0.15, slot.life / slot.max);
      dummy.position.set(slot.x, slot.y, -slot.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(slot.size * fade);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
      mesh.setColorAt(index, slot.color);
      index += 1;
    }
    mesh.count = index;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }
}
