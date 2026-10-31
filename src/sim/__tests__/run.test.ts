import { LEVELS } from '../../levels';
import { autoTarget } from '../auto';
import { createState } from '../create';
import { step } from '../step';
import type { GameState, Level, SimInput } from '../types';

const DT = 1 / 60;

function run(state: GameState, seconds: number, input: (state: GameState) => SimInput): GameState {
  const steps = Math.round(seconds / DT);
  for (let i = 0; i < steps; i += 1) {
    step(state, input(state), DT);
    if (state.phase === 'won' || state.phase === 'lost') break;
  }
  return state;
}

function arena(partial: Partial<Level> = {}): Level {
  return {
    id: 'arena',
    name: 'Arena',
    brief: 'test',
    length: 160,
    squadStart: 8,
    speed: 20,
    roadHalfWidth: 4,
    fireRate: 4,
    damage: 1,
    gates: [],
    enemies: [],
    pickups: [],
    banners: [],
    finale: { kind: 'wall', name: 'Wall', hp: 30, dps: 0, duration: 3 },
    ...partial,
  };
}

describe('steering', () => {
  it('clamps the squad to the road', () => {
    const state = createState(arena());
    run(state, 1.2, () => ({ targetX: 100 }));
    expect(state.squad.x).toBeLessThanOrEqual(4 - 0.55 + 0.001);
    expect(state.squad.x).toBeGreaterThan(3);
    const other = createState(arena());
    run(other, 1.2, () => ({ targetX: -100 }));
    expect(other.squad.x).toBeGreaterThanOrEqual(-(4 - 0.55) - 0.001);
    expect(other.squad.x).toBeLessThan(-3);
  });
});

describe('gates in a run', () => {
  const gates: Level['gates'] = [
    { id: 'left', z: 40, side: 'left', op: 'add', value: 5, rigged: false, hitsToFlip: 0 },
    { id: 'right', z: 40, side: 'right', op: 'sub', value: 3, rigged: false, hitsToFlip: 0 },
  ];

  it('applies only the gate the squad drives through', () => {
    const state = createState(arena({ gates }));
    const right = state.gates.find((gate) => gate.id === 'right');
    run(state, 4, () => ({ targetX: right?.x ?? 2 }));
    expect(state.squad.count).toBe(5);
    expect(state.gates.every((gate) => gate.consumed)).toBe(true);
  });

  it('breaks a dead-center tie toward the left gate', () => {
    const state = createState(arena({ gates }));
    run(state, 4, () => ({ targetX: 0 }));
    expect(state.squad.count).toBe(13);
  });

  it('does not let bullets flip a normal gate', () => {
    const state = createState(arena({ gates, squadStart: 20, fireRate: 6 }));
    const left = state.gates.find((gate) => gate.id === 'left');
    run(state, 4, () => ({ targetX: left?.x ?? -2 }));
    const passed = state.gates.find((gate) => gate.id === 'left');
    expect(passed?.hits).toBe(0);
    expect(passed?.op).toBe('add');
  });
});

describe('enemies and the finale', () => {
  it('trades one squad member per enemy still standing at contact', () => {
    const state = createState(
      arena({
        enemies: [{ id: 'pack', z: 30, x: 0, count: 4, hp: 999, spread: 0.4 }],
        fireRate: 0.01,
      }),
    );
    run(state, 3, () => ({ targetX: 0 }));
    expect(state.squad.count).toBe(4);
    expect(state.enemies.every((enemy) => !enemy.alive)).toBe(true);
  });

  it('clears a pack with gunfire before contact', () => {
    const state = createState(
      arena({
        squadStart: 10,
        damage: 20,
        fireRate: 6,
        speed: 10,
        enemies: [{ id: 'pack', z: 50, x: 0, count: 4, hp: 1, spread: 0.6 }],
      }),
    );
    run(state, 8, () => ({ targetX: 0 }));
    expect(state.squad.count).toBe(10);
    expect(state.enemies.every((enemy) => !enemy.alive)).toBe(true);
  });

  it('scores survivors when the finale breaks', () => {
    const state = createState(
      arena({
        length: 40,
        speed: 40,
        squadStart: 6,
        damage: 10,
        fireRate: 6,
        finale: { kind: 'boss', name: 'Boss', hp: 30, dps: 0, duration: 8 },
      }),
    );
    run(state, 12, () => ({ targetX: 0 }));
    expect(state.phase).toBe('won');
    expect(state.squad.count).toBe(6);
    expect(state.score).toBe(6 * 100 + 400);
  });

  it('loses when a gate wipes the squad', () => {
    const state = createState(
      arena({
        gates: [
          { id: 'left', z: 24, side: 'left', op: 'sub', value: 50, rigged: false, hitsToFlip: 0 },
          { id: 'right', z: 24, side: 'right', op: 'add', value: 1, rigged: false, hitsToFlip: 0 },
        ],
      }),
    );
    const left = state.gates.find((gate) => gate.id === 'left');
    run(state, 4, () => ({ targetX: left?.x ?? -2 }));
    expect(state.phase).toBe('lost');
    expect(state.squad.count).toBe(0);
  });
});

describe('shipped levels', () => {
  it.each(LEVELS.map((level) => [level.id, level] as const))(
    'level %s is clearable by the scripted advisor',
    (_id, level) => {
      const state = createState(level);
      run(state, 90, (current) => ({ targetX: autoTarget(current) }));
      expect(state.phase).toBe('won');
      expect(state.squad.count).toBeGreaterThan(0);
    },
  );

  it('replays the same inputs to the same squad', () => {
    const play = () => {
      const state = createState(LEVELS[0]!);
      run(state, 12, (current) => ({ targetX: autoTarget(current) }));
      return {
        count: state.squad.count,
        x: state.squad.x,
        z: state.squad.z,
        score: state.score,
        ops: state.gates.map((gate) => `${gate.id}:${gate.op}:${gate.hits}`),
      };
    };
    expect(play()).toEqual(play());
  });
});
