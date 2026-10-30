import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'audio');
mkdirSync(root, { recursive: true });

const RATE = 22050;

function tone(freq, t, type = 'sine') {
  const phase = 2 * Math.PI * freq * t;
  if (type === 'square') return Math.sign(Math.sin(phase));
  if (type === 'triangle') return (2 / Math.PI) * Math.asin(Math.sin(phase));
  return Math.sin(phase);
}

function env(t, attack, duration, release) {
  if (t < 0 || t > duration) return 0;
  if (t < attack) return t / Math.max(0.001, attack);
  const rel = duration - release;
  if (t > rel) return Math.max(0, 1 - (t - rel) / Math.max(0.001, release));
  return 1;
}

function render(duration, fn) {
  const n = Math.floor(RATE * duration);
  const samples = new Float32Array(n);
  let peak = 0.0001;
  for (let i = 0; i < n; i += 1) {
    const t = i / RATE;
    const value = fn(t, duration);
    samples[i] = value;
    peak = Math.max(peak, Math.abs(value));
  }
  const gain = 0.86 / peak;
  for (let i = 0; i < n; i += 1) samples[i] *= gain;
  return samples;
}

function writeWav(name, samples) {
  const header = 44;
  const buffer = Buffer.alloc(header + samples.length * 2);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + samples.length * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(RATE, 24);
  buffer.writeUInt32LE(RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[i] ?? 0));
    buffer.writeInt16LE(Math.round(clamped * 32767), header + i * 2);
  }
  writeFileSync(join(root, name), buffer);
}

writeWav(
  'shoot.wav',
  render(0.07, (t, d) => tone(1800 - t * 8000, t) * env(t, 0.004, d, 0.05) * 0.5),
);
writeWav(
  'gate-good.wav',
  render(0.22, (t, d) => {
    const a = tone(523.25, t) * env(t, 0.01, 0.12, 0.06);
    const b = tone(783.99, Math.max(0, t - 0.08)) * env(Math.max(0, t - 0.08), 0.01, 0.12, 0.06);
    return (a + b) * env(t, 0.005, d, 0.04);
  }),
);
writeWav(
  'gate-bad.wav',
  render(0.24, (t, d) => tone(110 - t * 40, t, 'triangle') * env(t, 0.005, d, 0.12)),
);
writeWav(
  'flip.wav',
  render(0.32, (t, d) => {
    const sweep = tone(420 + t * 1800, t) * env(t, 0.01, d, 0.12);
    const spark = (Math.sin(t * 9000) > 0 ? 1 : -1) * env(t, 0.001, 0.08, 0.04) * 0.25;
    return sweep * 0.7 + spark;
  }),
);
writeWav(
  'hit.wav',
  render(0.09, (t, d) => (Math.sin(t * 18000) > 0 ? 1 : -1) * env(t, 0.002, d, 0.06) * 0.4),
);
writeWav(
  'pickup.wav',
  render(0.36, (t) => {
    const notes = [523.25, 659.25, 783.99];
    return notes.reduce((sum, freq, index) => {
      const start = index * 0.08;
      return sum + tone(freq, Math.max(0, t - start)) * env(t - start, 0.008, 0.16, 0.08);
    }, 0);
  }),
);
writeWav(
  'win.wav',
  render(0.7, (t) => {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    return notes.reduce((sum, freq, index) => {
      const start = index * 0.1;
      return sum + tone(freq, Math.max(0, t - start)) * env(t - start, 0.01, 0.28, 0.12);
    }, 0);
  }),
);
writeWav(
  'lose.wav',
  render(0.6, (t) => {
    const notes = [392, 311.13, 261.63];
    return notes.reduce((sum, freq, index) => {
      const start = index * 0.14;
      return sum + tone(freq, Math.max(0, t - start), 'triangle') * env(t - start, 0.01, 0.24, 0.1);
    }, 0);
  }),
);

const music = render(8, (t, d) => {
  const beat = 60 / 96;
  const step = Math.floor(t / (beat / 2));
  const bassNotes = [110, 110, 82.41, 110, 87.31, 87.31, 82.41, 98];
  const leadNotes = [0, 220, 0, 261.63, 0, 246.94, 0, 196, 0, 220, 0, 164.81, 0, 196, 0, 246.94];
  const bass = bassNotes[Math.floor(t / beat) % bassNotes.length] ?? 110;
  const lead = leadNotes[step % leadNotes.length] ?? 0;
  const local = t % beat;
  const hat =
    step % 2 === 0
      ? (Math.sin(t * 14000) > 0 ? 1 : -1) * env(t % (beat / 2), 0.001, 0.03, 0.02) * 0.08
      : 0;
  const body = tone(bass, t) * env(local, 0.02, beat * 0.95, 0.12) * 0.45;
  const fifth = tone(bass * 1.5, t) * env(local, 0.02, beat * 0.7, 0.1) * 0.12;
  const melody = lead === 0 ? 0 : tone(lead, t) * env(t % (beat / 2), 0.01, beat / 2, 0.08) * 0.22;
  const fade = env(t, 0.05, d, 0.05);
  return (body + fifth + melody + hat) * fade;
});
writeWav('music.wav', music);
console.log(`wrote audio to ${root}`);
