import { MAX_ENEMIES } from './constants';
import type {
  BannerDef,
  EnemyGroupDef,
  FinaleDef,
  GateDef,
  GateOp,
  Level,
  PickupDef,
  PickupKind,
  Side,
} from './types';

export class LevelParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LevelParseError';
  }
}

const OPS: readonly GateOp[] = ['add', 'sub', 'mul', 'div'];
const SIDES: readonly Side[] = ['left', 'right'];
const PICKUPS: readonly PickupKind[] = ['gold', 'rate', 'damage'];
const FINALES = ['boss', 'wall'] as const;

function fail(where: string, message: string): never {
  throw new LevelParseError(`${where}: ${message}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function expectRecord(value: unknown, where: string): Record<string, unknown> {
  if (!isRecord(value)) fail(where, 'expected an object');
  return value;
}

function expectString(value: unknown, where: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    fail(where, 'expected a non-empty string');
  }
  return value;
}

function expectNumber(value: unknown, where: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    fail(where, 'expected a finite number');
  }
  return value;
}

function expectInt(value: unknown, where: string, min: number, max: number): number {
  const n = expectNumber(value, where);
  if (!Number.isInteger(n) || n < min || n > max) {
    fail(where, `expected an integer from ${min} to ${max}`);
  }
  return n;
}

function expectBool(value: unknown, where: string): boolean {
  if (typeof value !== 'boolean') fail(where, 'expected a boolean');
  return value;
}

function expectEnum<T extends string>(value: unknown, where: string, allowed: readonly T[]): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    fail(where, `expected one of ${allowed.join(', ')}`);
  }
  return value as T;
}

function parseGate(value: unknown, where: string): GateDef {
  const raw = expectRecord(value, where);
  const op = expectEnum(raw.op, `${where}.op`, OPS);
  const minValue = op === 'div' || op === 'mul' ? 2 : 1;
  const rigged = raw.rigged === undefined ? false : expectBool(raw.rigged, `${where}.rigged`);
  const hitsToFlip =
    raw.hitsToFlip === undefined ? 0 : expectInt(raw.hitsToFlip, `${where}.hitsToFlip`, 0, 80);
  if (rigged && hitsToFlip < 1) {
    fail(where, 'a rigged gate needs hitsToFlip of at least 1');
  }
  if (!rigged && hitsToFlip !== 0) {
    fail(where, 'only rigged gates can set hitsToFlip');
  }
  return {
    id: expectString(raw.id, `${where}.id`),
    z: expectNumber(raw.z, `${where}.z`),
    side: expectEnum(raw.side, `${where}.side`, SIDES),
    op,
    value: expectInt(raw.value, `${where}.value`, minValue, 99),
    rigged,
    hitsToFlip,
  };
}

function parseEnemy(value: unknown, where: string): EnemyGroupDef {
  const raw = expectRecord(value, where);
  return {
    id: expectString(raw.id, `${where}.id`),
    z: expectNumber(raw.z, `${where}.z`),
    x: expectNumber(raw.x, `${where}.x`),
    count: expectInt(raw.count, `${where}.count`, 1, 24),
    hp: expectInt(raw.hp, `${where}.hp`, 1, 40),
    spread: expectNumber(raw.spread, `${where}.spread`),
  };
}

function parsePickup(value: unknown, where: string): PickupDef {
  const raw = expectRecord(value, where);
  const kind = expectEnum(raw.kind, `${where}.kind`, PICKUPS);
  const amount = expectNumber(raw.amount, `${where}.amount`);
  if (amount <= 0) fail(`${where}.amount`, 'expected a positive number');
  if (kind !== 'gold' && !Number.isInteger(amount) && kind === 'damage') {
    fail(`${where}.amount`, 'damage pickups add a whole number');
  }
  return {
    id: expectString(raw.id, `${where}.id`),
    z: expectNumber(raw.z, `${where}.z`),
    x: expectNumber(raw.x, `${where}.x`),
    kind,
    amount,
  };
}

function parseBanner(value: unknown, where: string): BannerDef {
  const raw = expectRecord(value, where);
  const z = expectNumber(raw.z, `${where}.z`);
  const until = expectNumber(raw.until, `${where}.until`);
  if (until <= z) fail(where, 'until must be greater than z');
  return { z, until, text: expectString(raw.text, `${where}.text`) };
}

function parseFinale(value: unknown, where: string): FinaleDef {
  const raw = expectRecord(value, where);
  const dps = expectNumber(raw.dps, `${where}.dps`);
  const duration = expectNumber(raw.duration, `${where}.duration`);
  if (dps < 0) fail(`${where}.dps`, 'expected 0 or more');
  if (duration <= 0) fail(`${where}.duration`, 'expected a duration greater than 0');
  return {
    kind: expectEnum(raw.kind, `${where}.kind`, FINALES),
    name: expectString(raw.name, `${where}.name`),
    hp: expectInt(raw.hp, `${where}.hp`, 1, 5000),
    dps,
    duration,
  };
}

function assertUnique(ids: string[], where: string): void {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) fail(where, `duplicate id "${id}"`);
    seen.add(id);
  }
}

/**
 * Parse and validate a level file. The simulation only accepts the object this returns,
 * so a bad file fails at load time instead of mid-run.
 */
export function parseLevel(input: unknown, label = 'level'): Level {
  const raw = expectRecord(input, label);
  const length = expectNumber(raw.length, `${label}.length`);
  const roadHalfWidth = expectNumber(raw.roadHalfWidth, `${label}.roadHalfWidth`);
  const speed = expectNumber(raw.speed, `${label}.speed`);
  const fireRate = expectNumber(raw.fireRate, `${label}.fireRate`);
  if (length < 40 || length > 2000) fail(`${label}.length`, 'expected a length from 40 to 2000');
  if (roadHalfWidth < 2.5 || roadHalfWidth > 7) {
    fail(`${label}.roadHalfWidth`, 'expected a half-width from 2.5 to 7');
  }
  if (speed < 6 || speed > 30) fail(`${label}.speed`, 'expected a speed from 6 to 30');
  if (fireRate <= 0 || fireRate > 12)
    fail(`${label}.fireRate`, 'expected a fire rate from 0 to 12');

  if (!Array.isArray(raw.gates) || raw.gates.length === 0) {
    fail(`${label}.gates`, 'expected a non-empty array');
  }
  const gates = raw.gates.map((gate, index) => parseGate(gate, `${label}.gates[${index}]`));
  const enemies = Array.isArray(raw.enemies)
    ? raw.enemies.map((enemy, index) => parseEnemy(enemy, `${label}.enemies[${index}]`))
    : [];
  const pickups = Array.isArray(raw.pickups)
    ? raw.pickups.map((pickup, index) => parsePickup(pickup, `${label}.pickups[${index}]`))
    : [];
  const banners = Array.isArray(raw.banners)
    ? raw.banners.map((banner, index) => parseBanner(banner, `${label}.banners[${index}]`))
    : [];

  assertUnique(
    [...gates.map((g) => g.id), ...enemies.map((e) => e.id), ...pickups.map((p) => p.id)],
    label,
  );

  const byZ = new Map<number, GateDef[]>();
  for (const gate of gates) {
    if (gate.z <= 0 || gate.z >= length) {
      fail(`${label}.gates`, `gate "${gate.id}" must sit between 0 and the level length`);
    }
    const group = byZ.get(gate.z) ?? [];
    group.push(gate);
    byZ.set(gate.z, group);
  }
  for (const [z, group] of byZ) {
    if (group.length !== 2) {
      fail(`${label}.gates`, `z=${z} must be a pair of gates, found ${group.length}`);
    }
    const sides = new Set(group.map((gate) => gate.side));
    if (!sides.has('left') || !sides.has('right')) {
      fail(`${label}.gates`, `z=${z} needs one left gate and one right gate`);
    }
  }

  let enemyTotal = 0;
  for (const group of enemies) {
    enemyTotal += group.count;
    if (group.z <= 0 || group.z >= length) {
      fail(`${label}.enemies`, `"${group.id}" must sit between 0 and the level length`);
    }
    if (group.spread < 0 || group.spread > roadHalfWidth * 2) {
      fail(`${label}.enemies`, `"${group.id}" spread is outside the road`);
    }
    if (Math.abs(group.x) > roadHalfWidth) {
      fail(`${label}.enemies`, `"${group.id}" x is outside the road`);
    }
  }
  if (enemyTotal > MAX_ENEMIES) {
    fail(`${label}.enemies`, `a level can spawn at most ${MAX_ENEMIES} enemies`);
  }

  for (const pickup of pickups) {
    if (pickup.z <= 0 || pickup.z >= length) {
      fail(`${label}.pickups`, `"${pickup.id}" must sit between 0 and the level length`);
    }
    if (Math.abs(pickup.x) > roadHalfWidth) {
      fail(`${label}.pickups`, `"${pickup.id}" x is outside the road`);
    }
  }

  const runSeconds = length / speed;
  if (runSeconds < 20 || runSeconds > 70) {
    fail(label, `run length is ${runSeconds.toFixed(1)}s; keep the road between 20 and 70 seconds`);
  }

  return {
    id: expectString(raw.id, `${label}.id`),
    name: expectString(raw.name, `${label}.name`),
    brief: expectString(raw.brief, `${label}.brief`),
    length,
    squadStart: expectInt(raw.squadStart, `${label}.squadStart`, 1, 40),
    speed,
    roadHalfWidth,
    fireRate,
    damage: expectInt(raw.damage, `${label}.damage`, 1, 8),
    gates,
    enemies,
    pickups,
    banners,
    finale: parseFinale(raw.finale, `${label}.finale`),
  };
}

export function bannerAt(level: Level, z: number): string | null {
  for (const banner of level.banners) {
    if (z >= banner.z && z < banner.until) return banner.text;
  }
  return null;
}
