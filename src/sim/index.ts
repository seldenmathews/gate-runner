export { autoTarget } from './auto';
export {
  BULLET_SPEED,
  MAX_ENEMIES,
  MAX_PROJECTILES,
  MAX_SHOTS_PER_SECOND,
  MAX_SQUAD,
} from './constants';
export { createState } from './create';
export { formationSlot, gateFrame, squadHalfWidth } from './formation';
export { bannerAt, LevelParseError, parseLevel } from './level';
export { applyGate, flippedOperator, gateLabel, registerGateHit } from './math';
export { scoreOf } from './score';
export { step } from './step';
export type { GameState, GateOp, Level, Phase, SimEvent, SimInput } from './types';
