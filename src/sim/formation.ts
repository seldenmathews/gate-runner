import { GATE_GAP, SLOT_SPACING_X, SLOT_SPACING_Z } from './constants';
import type { Side } from './types';

export function formationCols(count: number): number {
  if (count <= 1) return 1;
  return Math.min(8, Math.max(2, Math.ceil(Math.sqrt(count))));
}

/** Local offset from the squad center for soldier `index`. Row 0 is the front. */
export function formationSlot(index: number, count: number): { x: number; z: number } {
  const cols = formationCols(count);
  const col = index % cols;
  const row = Math.floor(index / cols);
  const width = (cols - 1) * SLOT_SPACING_X;
  return {
    x: -width / 2 + col * SLOT_SPACING_X,
    z: -row * SLOT_SPACING_Z,
  };
}

export function squadHalfWidth(count: number): number {
  const cols = formationCols(Math.max(1, count));
  return ((cols - 1) * SLOT_SPACING_X) / 2 + 0.28;
}

export function gateFrame(side: Side, roadHalfWidth: number): { x: number; halfWidth: number } {
  const inner = GATE_GAP / 2;
  const halfWidth = (roadHalfWidth - inner) / 2;
  const x = side === 'left' ? -(inner + halfWidth) : inner + halfWidth;
  return { x, halfWidth };
}
