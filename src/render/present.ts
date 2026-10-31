import { colors } from '../theme';
import type { SimEvent } from '../sim/types';
import { playSound } from '../services/audio';
import { pulse } from '../services/haptics';
import type { ParticleField } from './particles';

export function presentEvents(
  events: SimEvent[],
  time: number,
  origin: { x: number; z: number },
  particles: ParticleField,
  kick: (amount: number) => void,
): void {
  for (const event of events) {
    switch (event.type) {
      case 'shoot':
        playSound('shoot', time, 0.09);
        break;
      case 'gate':
        playSound(event.positive ? 'gate-good' : 'gate-bad', time, 0);
        pulse(event.positive ? 'light' : 'heavy', time);
        kick(event.positive ? 0.3 : 0.52);
        particles.burst(
          event.x,
          1.4,
          event.z,
          20,
          event.positive ? colors.mint : colors.danger,
          3.2,
          0.45,
        );
        break;
      case 'flip':
        playSound('flip', time, 0);
        pulse('flip', time);
        kick(0.78);
        particles.burst(event.x, 1.8, event.z, 18, colors.cyan, 4.2, 0.55);
        particles.burst(event.x, 1.5, event.z, 14, colors.violet, 3.4, 0.5);
        break;
      case 'gate-hit':
        particles.burst(event.x, 1.7, event.z, 4, colors.ink, 1.6, 0.22);
        break;
      case 'enemy-hit':
        particles.burst(event.x, 0.8, event.z, 3, colors.gold, 1.4, 0.18);
        break;
      case 'enemy-down':
        playSound('hit', time, 0.05);
        pulse('light', time);
        particles.burst(event.x, 0.7, event.z, 8, colors.danger, 2.4, 0.35);
        break;
      case 'squad-loss':
        playSound('gate-bad', time, 0.08);
        pulse('warning', time);
        kick(0.48);
        particles.burst(event.x, 0.6, event.z, 14, colors.danger, 2.8, 0.4);
        break;
      case 'pickup':
        playSound('pickup', time, 0);
        pulse('light', time);
        particles.burst(
          event.x,
          0.8,
          event.z,
          14,
          event.kind === 'gold'
            ? colors.gold
            : event.kind === 'damage'
              ? colors.danger
              : colors.cyan,
          2.6,
          0.45,
        );
        break;
      case 'boss-hit':
        kick(0.08);
        particles.burst(event.x, 1.4, event.z, 4, colors.boss, 1.8, 0.2);
        break;
      case 'win':
        playSound('win', time, 0);
        pulse('success', time);
        kick(0.9);
        particles.burst(origin.x, 1.2, origin.z + 2, 36, colors.mint, 4.5, 0.8);
        break;
      case 'lose':
        playSound('lose', time, 0);
        pulse('error', time);
        kick(0.95);
        particles.burst(origin.x, 1, origin.z, 24, colors.danger, 3.2, 0.7);
        break;
      default:
        break;
    }
  }
}
