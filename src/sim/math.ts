import { MAX_SQUAD } from './constants';
import type { GateOp, GateState } from './types';

/**
 * Apply one math gate to a squad count.
 * Results are rounded to the nearest integer and clamped to [0, MAX_SQUAD].
 * A result of 0 is a wipe. Division by zero leaves the count unchanged.
 */
export function applyGate(count: number, op: GateOp, value: number): number {
  let next = count;
  switch (op) {
    case 'add':
      next = count + value;
      break;
    case 'sub':
      next = count - value;
      break;
    case 'mul':
      next = count * value;
      break;
    case 'div':
      next = value === 0 ? count : count / value;
      break;
    default: {
      const unreachable: never = op;
      return unreachable;
    }
  }
  if (!Number.isFinite(next)) return 0;
  return Math.max(0, Math.min(MAX_SQUAD, Math.round(next)));
}

/** sub ↔ add and div ↔ mul. The value stays, so -20 becomes +20 and /2 becomes x2. */
export function flippedOperator(op: GateOp): GateOp {
  switch (op) {
    case 'add':
      return 'sub';
    case 'sub':
      return 'add';
    case 'mul':
      return 'div';
    case 'div':
      return 'mul';
    default: {
      const unreachable: never = op;
      return unreachable;
    }
  }
}

export type GateHitResult = 'ignored' | 'hit' | 'flipped';

/**
 * Register one bullet on a gate.
 * Normal gates ignore hits. A rigged gate flips once, and only once, at the threshold.
 */
export function registerGateHit(gate: GateState): GateHitResult {
  if (!gate.rigged || gate.flipped || gate.consumed || gate.hitsToFlip <= 0) {
    return 'ignored';
  }
  gate.hits += 1;
  if (gate.hits >= gate.hitsToFlip) {
    gate.flipped = true;
    gate.op = flippedOperator(gate.op);
    return 'flipped';
  }
  return 'hit';
}

export function gateLabel(op: GateOp, value: number): string {
  switch (op) {
    case 'add':
      return `+${value}`;
    case 'sub':
      return `-${value}`;
    case 'mul':
      return `x${value}`;
    case 'div':
      return `/${value}`;
    default: {
      const unreachable: never = op;
      return unreachable;
    }
  }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
