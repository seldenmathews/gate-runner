import { gateFrame } from './formation';
import type { EnemyState, GameState, Level } from './types';

function expandEnemies(level: Level): EnemyState[] {
  const enemies: EnemyState[] = [];
  for (const group of level.enemies) {
    for (let i = 0; i < group.count; i += 1) {
      const t = group.count === 1 ? 0.5 : i / (group.count - 1);
      enemies.push({
        id: `${group.id}-${i}`,
        groupId: group.id,
        x: group.x + (t - 0.5) * group.spread,
        z: group.z,
        hp: group.hp,
        maxHp: group.hp,
        alive: true,
        resolved: false,
      });
    }
  }
  return enemies;
}

/** Fresh mutable run state. The level definition itself is never modified. */
export function createState(level: Level): GameState {
  return {
    levelId: level.id,
    phase: 'run',
    time: 0,
    speed: level.speed,
    roadHalfWidth: level.roadHalfWidth,
    length: level.length,
    squad: {
      count: level.squadStart,
      x: 0,
      z: 0,
      fireRate: level.fireRate,
      damage: level.damage,
      gold: 0,
      weaponTier: 0,
      cooldown: 0,
    },
    gates: level.gates.map((gate) => {
      const frame = gateFrame(gate.side, level.roadHalfWidth);
      return {
        id: gate.id,
        z: gate.z,
        side: gate.side,
        x: frame.x,
        halfWidth: frame.halfWidth,
        op: gate.op,
        value: gate.value,
        rigged: gate.rigged,
        hits: 0,
        hitsToFlip: gate.hitsToFlip,
        flipped: false,
        consumed: false,
      };
    }),
    enemies: expandEnemies(level),
    pickups: level.pickups.map((pickup) => ({
      id: pickup.id,
      x: pickup.x,
      z: pickup.z,
      kind: pickup.kind,
      amount: pickup.amount,
      taken: false,
    })),
    projectiles: [],
    finale: {
      kind: level.finale.kind,
      name: level.finale.name,
      hp: level.finale.hp,
      maxHp: level.finale.hp,
      dps: level.finale.dps,
      duration: level.finale.duration,
      elapsed: 0,
      hurt: 0,
      x: 0,
      z: level.length + 8,
    },
    score: level.squadStart * 100,
    events: [],
    nextProjectileId: 1,
  };
}
