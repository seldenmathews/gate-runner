import level1 from './level-1.json';
import level2 from './level-2.json';
import level3 from './level-3.json';
import { parseLevel } from '../sim/level';
import type { Level } from '../sim/types';

export const LEVELS: Level[] = [level1, level2, level3].map((raw, index) =>
  parseLevel(raw, `level-${index + 1}.json`),
);

export const LEVEL_COUNT = LEVELS.length;

export function getLevel(id: string): Level | undefined {
  return LEVELS.find((level) => level.id === id);
}

export function levelNumber(id: string): number {
  const index = LEVELS.findIndex((level) => level.id === id);
  return index + 1;
}

export function nextLevelId(id: string): string | null {
  const index = LEVELS.findIndex((level) => level.id === id);
  if (index < 0 || index >= LEVELS.length - 1) return null;
  return LEVELS[index + 1]?.id ?? null;
}
