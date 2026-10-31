import type { GameState } from './types';

/**
 * Survivors are the score. Gold and damage done to the finale are bonuses.
 * During the run the finale term is zero, so the number jumps when the fight ends.
 */
export function scoreOf(state: GameState): number {
  const units = state.squad.count * 100;
  const gold = state.squad.gold;
  const ratio = state.finale.maxHp <= 0 ? 0 : 1 - state.finale.hp / state.finale.maxHp;
  const finale = Math.round(Math.max(0, ratio) * 400);
  return Math.max(0, units + gold + finale);
}
