import * as THREE from 'three';
import { formationSlot } from '../sim/formation';

function mergeParts(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const opened = parts.map((part) => (part.index ? part.toNonIndexed() : part));
  let vertices = 0;
  for (const part of opened) vertices += part.getAttribute('position').count;
  const position = new Float32Array(vertices * 3);
  const normal = new Float32Array(vertices * 3);
  let offset = 0;
  for (const part of opened) {
    const pos = part.getAttribute('position');
    const nor = part.getAttribute('normal');
    position.set(pos.array as ArrayLike<number>, offset * 3);
    normal.set(nor.array as ArrayLike<number>, offset * 3);
    offset += pos.count;
  }
  for (const part of parts) part.dispose();
  for (const part of opened) {
    if (!parts.includes(part)) part.dispose();
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normal, 3));
  return geometry;
}

export function createSoldierGeometry(): THREE.BufferGeometry {
  const body = new THREE.BoxGeometry(0.3, 0.46, 0.18);
  body.translate(0, 0.36, 0);
  const head = new THREE.BoxGeometry(0.2, 0.16, 0.18);
  head.translate(0, 0.68, 0);
  const gun = new THREE.BoxGeometry(0.05, 0.05, 0.4);
  gun.translate(0.12, 0.42, 0.26);
  const pack = new THREE.BoxGeometry(0.16, 0.2, 0.08);
  pack.translate(0, 0.42, -0.12);
  return mergeParts([body, head, gun, pack]);
}

export function createVisorGeometry(): THREE.BufferGeometry {
  const visor = new THREE.BoxGeometry(0.13, 0.04, 0.02);
  visor.translate(0, 0.7, 0.1);
  return visor;
}

export function createEnemyGeometry(): THREE.BufferGeometry {
  const body = new THREE.BoxGeometry(0.34, 0.4, 0.2);
  body.translate(0, 0.32, 0);
  const head = new THREE.BoxGeometry(0.22, 0.16, 0.2);
  head.translate(0, 0.58, 0.03);
  const arm = new THREE.BoxGeometry(0.08, 0.26, 0.08);
  arm.translate(0.2, 0.34, 0.14);
  return mergeParts([body, head, arm]);
}

const dummy = new THREE.Object3D();

export function writeSquad(
  mesh: THREE.InstancedMesh | null,
  count: number,
  x: number,
  z: number,
  time: number,
): void {
  if (!mesh) return;
  const n = Math.max(0, Math.min(count, mesh.instanceMatrix.count));
  mesh.count = n;
  for (let i = 0; i < n; i += 1) {
    const slot = formationSlot(i, count);
    const bob = Math.sin(time * 13 + i * 0.65) * 0.04;
    dummy.position.set(x + slot.x, bob, -(z + slot.z));
    dummy.rotation.set(0.14, Math.PI, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
}

export function writeEnemies(
  mesh: THREE.InstancedMesh | null,
  enemies: { x: number; z: number; alive: boolean }[],
  time: number,
): void {
  if (!mesh) return;
  mesh.count = enemies.length;
  for (let i = 0; i < enemies.length; i += 1) {
    const enemy = enemies[i];
    if (!enemy || !enemy.alive) {
      dummy.position.set(0, -20, 0);
      dummy.scale.set(0, 0, 0);
    } else {
      dummy.position.set(enemy.x, Math.sin(time * 2.4 + i) * 0.03, -enemy.z);
      dummy.scale.set(1, 1, 1);
    }
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
}

export function writeProjectiles(
  mesh: THREE.InstancedMesh | null,
  projectiles: { alive: boolean; x: number; y: number; z: number }[],
): void {
  if (!mesh) return;
  let drawn = 0;
  for (const projectile of projectiles) {
    if (!projectile.alive) continue;
    dummy.position.set(projectile.x, projectile.y, -projectile.z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(0.07, 0.07, 0.32);
    dummy.updateMatrix();
    mesh.setMatrixAt(drawn, dummy.matrix);
    drawn += 1;
    if (drawn >= mesh.instanceMatrix.count) break;
  }
  mesh.count = drawn;
  mesh.instanceMatrix.needsUpdate = true;
}
