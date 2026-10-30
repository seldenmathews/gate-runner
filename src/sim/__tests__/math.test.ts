import { applyGate, gateLabel } from '../math';

describe('applyGate', () => {
  it('adds and subtracts', () => {
    expect(applyGate(5, 'add', 3)).toBe(8);
    expect(applyGate(5, 'sub', 3)).toBe(2);
  });

  it('wipes the squad at zero and never goes negative', () => {
    expect(applyGate(5, 'sub', 9)).toBe(0);
    expect(applyGate(0, 'sub', 4)).toBe(0);
  });

  it('multiplies and divides, rounding halves away from zero', () => {
    expect(applyGate(4, 'mul', 3)).toBe(12);
    expect(applyGate(7, 'div', 2)).toBe(4);
    expect(applyGate(1, 'div', 2)).toBe(1);
    expect(applyGate(10, 'div', 3)).toBe(3);
  });

  it('caps a runaway multiply', () => {
    expect(applyGate(200, 'mul', 3)).toBe(240);
  });

  it('leaves the count alone when dividing by zero', () => {
    expect(applyGate(9, 'div', 0)).toBe(9);
  });

  it('grows a zero squad with add but not with multiply', () => {
    expect(applyGate(0, 'add', 5)).toBe(5);
    expect(applyGate(0, 'mul', 5)).toBe(0);
  });
});

describe('gateLabel', () => {
  it('prints the operator the player reads on the gate', () => {
    expect(gateLabel('add', 20)).toBe('+20');
    expect(gateLabel('sub', 20)).toBe('-20');
    expect(gateLabel('mul', 2)).toBe('x2');
    expect(gateLabel('div', 2)).toBe('/2');
  });
});
