import { bannerAt } from '../sim/level';
import { gateLabel } from '../sim/math';
import type { GameState, Level } from '../sim/types';

export interface HackReadout {
  hits: number;
  needed: number;
  label: string;
}

export interface HudSnapshot {
  count: number;
  score: number;
  phase: GameState['phase'];
  banner: string | null;
  fireRate: number;
  damage: number;
  gold: number;
  finaleName: string;
  finaleKind: GameState['finale']['kind'];
  finaleHp: number;
  finaleMaxHp: number;
  finaleActive: boolean;
  hack: HackReadout | null;
  fps: number;
}

export function toHud(state: GameState, level: Level, fps: number): HudSnapshot {
  return {
    count: state.squad.count,
    score: state.score,
    phase: state.phase,
    banner: state.phase === 'run' ? bannerAt(level, state.squad.z) : null,
    fireRate: state.squad.fireRate,
    damage: state.squad.damage,
    gold: state.squad.gold,
    finaleName: state.finale.name,
    finaleKind: state.finale.kind,
    finaleHp: state.finale.hp,
    finaleMaxHp: state.finale.maxHp,
    finaleActive: state.phase !== 'run',
    hack: activeHack(state),
    fps,
  };
}

export function hudKey(hud: HudSnapshot): string {
  const hack = hud.hack ? `${hud.hack.hits}/${hud.hack.needed}/${hud.hack.label}` : '';
  return [
    hud.count,
    hud.score,
    hud.phase,
    hud.banner ?? '',
    hud.fireRate.toFixed(2),
    hud.damage,
    hud.gold,
    hud.finaleHp,
    hud.finaleActive ? 1 : 0,
    hack,
    hud.fps,
  ].join('|');
}

function activeHack(state: GameState): HackReadout | null {
  if (state.phase !== 'run') return null;
  let best: GameState['gates'][number] | null = null;
  let bestDz = Infinity;
  for (const gate of state.gates) {
    if (!gate.rigged || gate.flipped || gate.consumed) continue;
    const dz = gate.z - state.squad.z;
    if (dz < 0 || dz > 42) continue;
    if (Math.abs(state.squad.x - gate.x) > gate.halfWidth) continue;
    if (dz < bestDz) {
      best = gate;
      bestDz = dz;
    }
  }
  if (!best) return null;
  return {
    hits: best.hits,
    needed: best.hitsToFlip,
    label: gateLabel(best.op, best.value),
  };
}
