import {
  BULLET_HIT_RADIUS,
  BULLET_SPEED,
  MAX_PROJECTILES,
  MAX_SHOTS_PER_SECOND,
  MAX_DT,
  PICKUP_RADIUS,
  ROAD_MARGIN,
  STEER_RESPONSE,
} from './constants';
import { squadHalfWidth } from './formation';
import { applyGate, clamp, gateLabel, registerGateHit } from './math';
import { scoreOf } from './score';
import type {
  GameState,
  GateState,
  ProjectileKind,
  ProjectileState,
  SimEvent,
  SimInput,
} from './types';

interface Target {
  kind: ProjectileKind;
  id: string;
  x: number;
  y: number;
  z: number;
}

function finish(state: GameState, phase: 'won' | 'lost', events: SimEvent[]): void {
  if (state.phase === 'won' || state.phase === 'lost') return;
  state.phase = phase;
  state.score = scoreOf(state);
  events.push({ type: phase === 'won' ? 'win' : 'lose' });
}

function commit(state: GameState, dt: number, events: SimEvent[]): GameState {
  state.time += dt;
  state.events = events;
  if (state.phase !== 'won' && state.phase !== 'lost') {
    state.score = scoreOf(state);
  }
  return state;
}

function pickTarget(state: GameState): Target | null {
  if (state.phase === 'run') {
    let gate: GateState | null = null;
    let bestDz = Infinity;
    for (const candidate of state.gates) {
      if (!candidate.rigged || candidate.flipped || candidate.consumed) continue;
      const dz = candidate.z - state.squad.z;
      if (dz < 1.5 || dz > 34) continue;
      if (Math.abs(state.squad.x - candidate.x) > candidate.halfWidth * 0.98) continue;
      if (dz < bestDz) {
        gate = candidate;
        bestDz = dz;
      }
    }
    if (gate) return { kind: 'gate', id: gate.id, x: gate.x, y: 1.6, z: gate.z };

    let bestScore = Infinity;
    let enemyTarget: Target | null = null;
    const lateral = Math.max(2.2, squadHalfWidth(state.squad.count) + 0.45);
    for (const enemy of state.enemies) {
      if (!enemy.alive) continue;
      const dz = enemy.z - state.squad.z;
      if (dz < 0.2 || dz > 24) continue;
      const dx = Math.abs(enemy.x - state.squad.x);
      if (dx > lateral) continue;
      const score = dz + dx * 1.35;
      if (score < bestScore) {
        bestScore = score;
        enemyTarget = { kind: 'enemy', id: enemy.id, x: enemy.x, y: 0.7, z: enemy.z };
      }
    }
    if (enemyTarget) return enemyTarget;
  }

  if (state.phase === 'finale' && state.finale.hp > 0) {
    return { kind: 'boss', id: 'finale', x: state.finale.x, y: 1.35, z: state.finale.z };
  }
  return null;
}

function spawnProjectile(state: GameState, target: Target, events: SimEvent[]): void {
  let slot = state.projectiles.find((projectile) => !projectile.alive);
  if (!slot) {
    if (state.projectiles.length >= MAX_PROJECTILES) return;
    const created: ProjectileState = {
      id: 0,
      alive: false,
      kind: 'enemy',
      targetId: '',
      x: 0,
      y: 0,
      z: 0,
      tx: 0,
      ty: 0,
      tz: 0,
      damage: 0,
      age: 0,
    };
    state.projectiles.push(created);
    slot = created;
  }
  const spread = Math.min(0.9, squadHalfWidth(Math.max(1, state.squad.count)) * 0.55);
  const ox = Math.sin(state.nextProjectileId * 12.9898) * spread;
  slot.alive = true;
  slot.id = state.nextProjectileId;
  state.nextProjectileId += 1;
  slot.kind = target.kind;
  slot.targetId = target.id;
  slot.x = state.squad.x + ox;
  slot.y = 0.72;
  slot.z = state.squad.z + 0.55;
  slot.tx = target.x;
  slot.ty = target.y;
  slot.tz = target.z;
  slot.damage = state.squad.damage;
  slot.age = 0;
  events.push({ type: 'shoot', x: slot.x, z: slot.z });
}

function tryFire(state: GameState, dt: number, events: SimEvent[]): void {
  if (state.squad.count <= 0) return;
  const rate = Math.min(MAX_SHOTS_PER_SECOND, state.squad.count * state.squad.fireRate);
  if (rate <= 0) return;
  state.squad.cooldown -= dt;
  const interval = 1 / rate;
  let spawned = 0;
  while (state.squad.cooldown <= 0 && spawned < 3) {
    const target = pickTarget(state);
    if (!target) {
      state.squad.cooldown = 0;
      return;
    }
    state.squad.cooldown += interval;
    spawnProjectile(state, target, events);
    spawned += 1;
  }
}

function applyHit(state: GameState, projectile: ProjectileState, events: SimEvent[]): void {
  if (projectile.kind === 'gate') {
    const gate = state.gates.find((candidate) => candidate.id === projectile.targetId);
    if (!gate) return;
    const result = registerGateHit(gate);
    if (result === 'ignored') return;
    events.push({ type: 'gate-hit', x: gate.x, z: gate.z });
    if (result === 'flipped') {
      events.push({
        type: 'flip',
        x: gate.x,
        z: gate.z,
        id: gate.id,
        text: gateLabel(gate.op, gate.value),
      });
    }
    return;
  }
  if (projectile.kind === 'enemy') {
    const enemy = state.enemies.find((candidate) => candidate.id === projectile.targetId);
    if (!enemy || !enemy.alive) return;
    enemy.hp -= projectile.damage;
    events.push({ type: 'enemy-hit', x: enemy.x, z: enemy.z });
    if (enemy.hp <= 0) {
      enemy.alive = false;
      events.push({ type: 'enemy-down', x: enemy.x, z: enemy.z });
    }
    return;
  }
  state.finale.hp = Math.max(0, state.finale.hp - projectile.damage);
  events.push({ type: 'boss-hit', x: state.finale.x, z: state.finale.z });
}

function updateProjectiles(state: GameState, dt: number, events: SimEvent[]): void {
  const stepDist = BULLET_SPEED * dt;
  for (const projectile of state.projectiles) {
    if (!projectile.alive) continue;
    const dx = projectile.tx - projectile.x;
    const dz = projectile.tz - projectile.z;
    const dist = Math.hypot(dx, dz);
    projectile.age += dt;
    if (dist <= Math.max(BULLET_HIT_RADIUS, stepDist)) {
      projectile.x = projectile.tx;
      projectile.z = projectile.tz;
      projectile.alive = false;
      applyHit(state, projectile, events);
      continue;
    }
    projectile.x += (dx / dist) * stepDist;
    projectile.z += (dz / dist) * stepDist;
    if (projectile.age > 1.8) projectile.alive = false;
  }
}

function resolveGates(state: GameState, prevZ: number, events: SimEvent[]): boolean {
  const zs: number[] = [];
  for (const gate of state.gates) {
    if (gate.consumed) continue;
    if (prevZ < gate.z && gate.z <= state.squad.z && !zs.includes(gate.z)) {
      zs.push(gate.z);
    }
  }
  for (const z of zs) {
    const pair = state.gates.filter((gate) => gate.z === z && !gate.consumed);
    let chosen = pair[0];
    let best = Infinity;
    for (const gate of pair) {
      const dx = Math.abs(state.squad.x - gate.x);
      const contains = dx <= gate.halfWidth;
      const score = (contains ? 0 : 1000) + dx;
      if (!chosen || score < best) {
        best = score;
        chosen = gate;
      }
    }
    if (!chosen) continue;
    const before = state.squad.count;
    state.squad.count = applyGate(before, chosen.op, chosen.value);
    for (const gate of pair) gate.consumed = true;
    events.push({
      type: 'gate',
      positive: state.squad.count >= before,
      x: chosen.x,
      z: chosen.z,
      text: gateLabel(chosen.op, chosen.value),
      id: chosen.id,
    });
    if (state.squad.count <= 0) {
      finish(state, 'lost', events);
      return true;
    }
  }
  return false;
}

function resolvePickups(state: GameState, prevZ: number, events: SimEvent[]): void {
  for (const pickup of state.pickups) {
    if (pickup.taken) continue;
    if (!(prevZ < pickup.z && pickup.z <= state.squad.z)) continue;
    if (Math.abs(state.squad.x - pickup.x) > PICKUP_RADIUS) continue;
    pickup.taken = true;
    if (pickup.kind === 'gold') {
      state.squad.gold += Math.round(pickup.amount);
    } else if (pickup.kind === 'rate') {
      state.squad.fireRate = Math.min(8, state.squad.fireRate + pickup.amount);
      state.squad.weaponTier += 1;
    } else {
      state.squad.damage = Math.min(12, state.squad.damage + pickup.amount);
      state.squad.weaponTier += 1;
    }
    events.push({ type: 'pickup', kind: pickup.kind, x: pickup.x, z: pickup.z });
  }
}

function resolveContact(state: GameState, prevZ: number, events: SimEvent[]): boolean {
  const reach = squadHalfWidth(state.squad.count) + 0.4;
  let lost = 0;
  for (const enemy of state.enemies) {
    if (!enemy.alive || enemy.resolved) continue;
    if (!(prevZ < enemy.z && enemy.z <= state.squad.z)) continue;
    enemy.resolved = true;
    if (Math.abs(enemy.x - state.squad.x) <= reach) {
      enemy.alive = false;
      lost += 1;
    }
  }
  if (lost <= 0) return false;
  state.squad.count = Math.max(0, state.squad.count - lost);
  events.push({ type: 'squad-loss', count: lost, x: state.squad.x, z: state.squad.z });
  if (state.squad.count <= 0) {
    finish(state, 'lost', events);
    return true;
  }
  return false;
}

function stepFinale(state: GameState, dt: number, events: SimEvent[]): void {
  state.finale.elapsed += dt;
  tryFire(state, dt, events);
  updateProjectiles(state, dt, events);
  if (state.finale.dps > 0 && state.finale.hp > 0 && state.squad.count > 0) {
    state.finale.hurt += state.finale.dps * dt;
    let lost = 0;
    while (state.finale.hurt >= 1 && state.squad.count - lost > 0) {
      state.finale.hurt -= 1;
      lost += 1;
    }
    if (lost > 0) {
      state.squad.count -= lost;
      events.push({ type: 'squad-loss', count: lost, x: state.squad.x, z: state.squad.z });
    }
  }
  if (state.squad.count <= 0) {
    finish(state, 'lost', events);
    return;
  }
  if (state.finale.hp <= 0 || state.finale.elapsed >= state.finale.duration) {
    finish(state, 'won', events);
  }
}

/**
 * Advance the simulation by `dt` seconds.
 * Mutates `state` and returns it. Given the same state and input, the result is deterministic.
 */
export function step(state: GameState, input: SimInput, dt: number): GameState {
  if (state.phase === 'won' || state.phase === 'lost') {
    state.events = [];
    return state;
  }
  const safeDt = Math.min(MAX_DT, Math.max(0, dt));
  if (safeDt === 0) {
    state.events = [];
    return state;
  }

  const events: SimEvent[] = [];
  const limit = state.roadHalfWidth - ROAD_MARGIN;
  const target = clamp(input.targetX, -limit, limit);
  const blend = 1 - Math.exp(-STEER_RESPONSE * safeDt);
  state.squad.x += (target - state.squad.x) * blend;

  if (state.phase === 'run') {
    const prevZ = state.squad.z;
    state.squad.z = Math.min(state.length, state.squad.z + state.speed * safeDt);
    if (resolveGates(state, prevZ, events)) return commit(state, safeDt, events);
    resolvePickups(state, prevZ, events);
    tryFire(state, safeDt, events);
    updateProjectiles(state, safeDt, events);
    if (resolveContact(state, prevZ, events)) return commit(state, safeDt, events);
    if (state.squad.z >= state.length - 1e-6) {
      state.squad.z = state.length;
      state.phase = 'finale';
      events.push({ type: 'finale-start' });
    }
  } else {
    stepFinale(state, safeDt, events);
  }

  return commit(state, safeDt, events);
}
