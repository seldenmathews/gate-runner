export type GateOp = 'add' | 'sub' | 'mul' | 'div';

export type Side = 'left' | 'right';

export type PickupKind = 'gold' | 'rate' | 'damage';

export type Phase = 'run' | 'finale' | 'won' | 'lost';

export type ProjectileKind = 'gate' | 'enemy' | 'boss';

export interface GateDef {
  id: string;
  z: number;
  side: Side;
  op: GateOp;
  value: number;
  rigged: boolean;
  hitsToFlip: number;
}

export interface EnemyGroupDef {
  id: string;
  z: number;
  x: number;
  count: number;
  hp: number;
  spread: number;
}

export interface PickupDef {
  id: string;
  z: number;
  x: number;
  kind: PickupKind;
  amount: number;
}

export interface BannerDef {
  z: number;
  until: number;
  text: string;
}

export interface FinaleDef {
  kind: 'boss' | 'wall';
  name: string;
  hp: number;
  dps: number;
  duration: number;
}

export interface Level {
  id: string;
  name: string;
  brief: string;
  length: number;
  squadStart: number;
  speed: number;
  roadHalfWidth: number;
  fireRate: number;
  damage: number;
  gates: GateDef[];
  enemies: EnemyGroupDef[];
  pickups: PickupDef[];
  banners: BannerDef[];
  finale: FinaleDef;
}

export interface GateState {
  id: string;
  z: number;
  side: Side;
  x: number;
  halfWidth: number;
  op: GateOp;
  value: number;
  rigged: boolean;
  hits: number;
  hitsToFlip: number;
  flipped: boolean;
  consumed: boolean;
}

export interface EnemyState {
  id: string;
  groupId: string;
  x: number;
  z: number;
  hp: number;
  maxHp: number;
  alive: boolean;
  resolved: boolean;
}

export interface PickupState {
  id: string;
  x: number;
  z: number;
  kind: PickupKind;
  amount: number;
  taken: boolean;
}

export interface ProjectileState {
  id: number;
  alive: boolean;
  kind: ProjectileKind;
  targetId: string;
  x: number;
  y: number;
  z: number;
  tx: number;
  ty: number;
  tz: number;
  damage: number;
  age: number;
}

export interface FinaleState {
  kind: 'boss' | 'wall';
  name: string;
  hp: number;
  maxHp: number;
  dps: number;
  duration: number;
  elapsed: number;
  hurt: number;
  x: number;
  z: number;
}

export interface SquadState {
  count: number;
  x: number;
  z: number;
  fireRate: number;
  damage: number;
  gold: number;
  weaponTier: number;
  cooldown: number;
}

export type SimEvent =
  | { type: 'gate'; positive: boolean; x: number; z: number; text: string; id: string }
  | { type: 'flip'; x: number; z: number; text: string; id: string }
  | { type: 'gate-hit'; x: number; z: number }
  | { type: 'shoot'; x: number; z: number }
  | { type: 'enemy-hit'; x: number; z: number }
  | { type: 'enemy-down'; x: number; z: number }
  | { type: 'pickup'; kind: PickupKind; x: number; z: number }
  | { type: 'squad-loss'; count: number; x: number; z: number }
  | { type: 'boss-hit'; x: number; z: number }
  | { type: 'finale-start' }
  | { type: 'win' }
  | { type: 'lose' };

export interface GameState {
  levelId: string;
  phase: Phase;
  time: number;
  speed: number;
  roadHalfWidth: number;
  length: number;
  squad: SquadState;
  gates: GateState[];
  enemies: EnemyState[];
  pickups: PickupState[];
  projectiles: ProjectileState[];
  finale: FinaleState;
  score: number;
  events: SimEvent[];
  nextProjectileId: number;
}

export interface SimInput {
  /** Desired squad center, in world units across the road. */
  targetX: number;
}
