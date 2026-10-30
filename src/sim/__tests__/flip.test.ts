import { createState } from '../create';
import { parseLevel } from '../level';
import { flippedOperator, gateLabel, registerGateHit } from '../math';
import { step } from '../step';
import type { GateState, Level } from '../types';

function gate(partial: Partial<GateState> & Pick<GateState, 'op' | 'rigged'>): GateState {
  return {
    id: 'g',
    z: 10,
    side: 'left',
    x: -2,
    halfWidth: 2,
    value: 20,
    hits: 0,
    hitsToFlip: 3,
    flipped: false,
    consumed: false,
    ...partial,
  };
}

describe('flippedOperator', () => {
  it('flips the sign or the operator and keeps the value', () => {
    expect(flippedOperator('sub')).toBe('add');
    expect(flippedOperator('add')).toBe('sub');
    expect(flippedOperator('div')).toBe('mul');
    expect(flippedOperator('mul')).toBe('div');
    expect(gateLabel(flippedOperator('sub'), 20)).toBe('+20');
    expect(gateLabel(flippedOperator('div'), 2)).toBe('x2');
  });
});

describe('registerGateHit', () => {
  it('ignores hits on a normal gate', () => {
    const normal = gate({ op: 'sub', rigged: false, hitsToFlip: 0 });
    expect(registerGateHit(normal)).toBe('ignored');
    expect(normal.op).toBe('sub');
    expect(normal.hits).toBe(0);
  });

  it('flips a rigged gate once it has taken enough hits, then ignores the rest', () => {
    const rigged = gate({ op: 'sub', value: 20, rigged: true, hitsToFlip: 3 });
    expect(registerGateHit(rigged)).toBe('hit');
    expect(registerGateHit(rigged)).toBe('hit');
    expect(rigged.op).toBe('sub');
    expect(registerGateHit(rigged)).toBe('flipped');
    expect(rigged.op).toBe('add');
    expect(rigged.value).toBe(20);
    expect(rigged.flipped).toBe(true);
    expect(registerGateHit(rigged)).toBe('ignored');
    expect(rigged.op).toBe('add');
  });

  it('turns a rigged divide into a multiply', () => {
    const rigged = gate({ op: 'div', value: 2, rigged: true, hitsToFlip: 1 });
    expect(registerGateHit(rigged)).toBe('flipped');
    expect(rigged.op).toBe('mul');
    expect(gateLabel(rigged.op, rigged.value)).toBe('x2');
  });

  it('does not flip a gate the squad has already passed', () => {
    const passed = gate({ op: 'sub', rigged: true, consumed: true });
    expect(registerGateHit(passed)).toBe('ignored');
    expect(passed.op).toBe('sub');
  });
});

describe('shooting a gate in the run', () => {
  const level: Level = {
    id: 'flip-run',
    name: 'Flip',
    brief: 'test',
    length: 200,
    squadStart: 8,
    speed: 20,
    roadHalfWidth: 4,
    fireRate: 5,
    damage: 1,
    gates: [
      { id: 'bad', z: 80, side: 'left', op: 'sub', value: 10, rigged: true, hitsToFlip: 6 },
      { id: 'safe', z: 80, side: 'right', op: 'add', value: 1, rigged: false, hitsToFlip: 0 },
    ],
    enemies: [],
    pickups: [],
    banners: [],
    finale: { kind: 'wall', name: 'Wall', hp: 10, dps: 0, duration: 1 },
  };

  it('rejects a normal gate that is not a pair partner', () => {
    expect(() =>
      parseLevel({
        ...level,
        gates: [level.gates[0]],
      }),
    ).toThrow(/pair/);
  });

  it('flips the rigged gate when the squad lines up on it, then adds', () => {
    const state = createState(level);
    const left = state.gates.find((item) => item.id === 'bad');
    expect(left).toBeDefined();
    const dt = 1 / 60;
    for (let i = 0; i < 60 * 8 && state.phase === 'run'; i += 1) {
      step(state, { targetX: left?.x ?? -2 }, dt);
    }
    const flipped = state.gates.find((item) => item.id === 'bad');
    expect(flipped?.flipped).toBe(true);
    expect(flipped?.op).toBe('add');
    expect(state.squad.count).toBe(18);
    expect(state.phase).not.toBe('lost');
  });

  it('does not flip a rigged gate the squad refuses to aim at', () => {
    const state = createState(level);
    const right = state.gates.find((item) => item.id === 'safe');
    const dt = 1 / 60;
    for (let i = 0; i < 60 * 8 && state.squad.z < 90; i += 1) {
      step(state, { targetX: right?.x ?? 2 }, dt);
    }
    const untouched = state.gates.find((item) => item.id === 'bad');
    expect(untouched?.flipped).toBe(false);
    expect(untouched?.op).toBe('sub');
    expect(untouched?.hits).toBe(0);
    expect(state.squad.count).toBe(9);
  });
});
