import type { GateOp } from './sim/types';

export const colors = {
  bg: '#070b12',
  bgRaised: '#121826',
  line: '#2a3850',
  ink: '#e8eef8',
  muted: '#93a0b8',
  cyan: '#3ee0ff',
  mint: '#3dff9a',
  danger: '#ff3355',
  gold: '#ffc44d',
  violet: '#b388ff',
  fog: '#162033',
  sky: '#0b1220',
  road: '#1b2436',
  rail: '#8aa0c2',
  squad: '#d9c4a6',
  visor: '#7ef0ff',
  enemy: '#ff3b55',
  boss: '#ff7a3c',
};

export const opColor: Record<GateOp, string> = {
  add: colors.mint,
  sub: colors.danger,
  mul: colors.gold,
  div: colors.violet,
};

export const fonts = {
  display: 'Teko_700Bold',
  medium: 'Rajdhani_500Medium',
  semibold: 'Rajdhani_600SemiBold',
  bold: 'Rajdhani_700Bold',
};
