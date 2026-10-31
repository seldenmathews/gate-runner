import { BULLET_SPEED, MAX_SHOTS_PER_SECOND } from './constants';
import { applyGate, flippedOperator } from './math';
import type { GameState, GateState } from './types';

function canHack(gate: GateState, dist: number, speed: number, rate: number): boolean {
  const timeToGate = dist / Math.max(0.001, speed);
  const bulletTime = Math.max(0, dist - 1.5) / BULLET_SPEED;
  const window = Math.max(0, timeToGate - bulletTime);
  return gate.hits + window * rate + 0.01 >= gate.hitsToFlip;
}

/**
 * Scripted advisor used by the winnable-level tests and by `?autodrive=1` on web and native.
 * It hacks a rigged gate only when the flipped result is better and the bullets can land in time.
 */
export function autoTarget(state: GameState): number {
  const z = state.squad.z;
  let nextZ = Infinity;
  for (const gate of state.gates) {
    if (!gate.consumed && gate.z > z + 0.4 && gate.z < nextZ) nextZ = gate.z;
  }
  if (!Number.isFinite(nextZ)) {
    for (const enemy of state.enemies) {
      if (!enemy.alive) continue;
      const dz = enemy.z - z;
      if (dz > 0.5 && dz < 22) return enemy.x;
    }
    return 0;
  }

  const dist = nextZ - z;
  const rate = Math.min(
    MAX_SHOTS_PER_SECOND,
    Math.max(0, state.squad.count) * state.squad.fireRate,
  );
  let bestX = 0;
  let bestCount = -1;
  for (const gate of state.gates) {
    if (gate.consumed || gate.z !== nextZ) continue;
    const hacking = gate.rigged && !gate.flipped;
    const reachable = !hacking || canHack(gate, dist, state.speed, rate);
    const op = hacking && reachable ? flippedOperator(gate.op) : gate.op;
    const count = applyGate(state.squad.count, op, gate.value);
    if (count > bestCount) {
      bestCount = count;
      bestX = gate.x;
    }
  }
  return bestX;
}
