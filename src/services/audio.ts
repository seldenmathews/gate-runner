import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

const sources = {
  shoot: require('../../assets/audio/shoot.wav'),
  'gate-good': require('../../assets/audio/gate-good.wav'),
  'gate-bad': require('../../assets/audio/gate-bad.wav'),
  flip: require('../../assets/audio/flip.wav'),
  hit: require('../../assets/audio/hit.wav'),
  pickup: require('../../assets/audio/pickup.wav'),
  win: require('../../assets/audio/win.wav'),
  lose: require('../../assets/audio/lose.wav'),
  music: require('../../assets/audio/music.wav'),
} as const;

export type SoundName = Exclude<keyof typeof sources, 'music'>;

const POOL: Partial<Record<SoundName, number>> = { shoot: 3, hit: 2 };

const listeners = new Set<(muted: boolean) => void>();
const pools = new Map<SoundName, AudioPlayer[]>();
const cursors = new Map<SoundName, number>();
const lastPlayed = new Map<SoundName, number>();

let music: AudioPlayer | null = null;
let muted = false;
let started = false;
let ready = false;

function emit(): void {
  for (const listener of listeners) listener(muted);
}

export function subscribeMute(listener: (muted: boolean) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isMuted(): boolean {
  return muted;
}

export async function initAudio(): Promise<void> {
  if (started) return;
  started = true;
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: 'duckOthers',
    });
    music = createAudioPlayer(sources.music);
    music.loop = true;
    music.volume = 0.34;
    (Object.keys(sources) as (keyof typeof sources)[]).forEach((name) => {
      if (name === 'music') return;
      const count = POOL[name] ?? 1;
      const players = Array.from({ length: count }, () => {
        const player = createAudioPlayer(sources[name]);
        player.volume = name === 'shoot' ? 0.22 : 0.72;
        return player;
      });
      pools.set(name, players);
    });
    ready = true;
  } catch {
    ready = false;
  }
}

export function startMusic(): void {
  if (!ready || muted || !music) return;
  music.play();
}

export function toggleMute(): boolean {
  muted = !muted;
  if (!music) {
    emit();
    return muted;
  }
  if (muted) music.pause();
  else music.play();
  emit();
  return muted;
}

export function playSound(name: SoundName, time: number, gap: number): void {
  if (!ready || muted) return;
  const previous = lastPlayed.get(name) ?? -10;
  if (time - previous < gap) return;
  lastPlayed.set(name, time);
  const pool = pools.get(name);
  if (!pool || pool.length === 0) return;
  const index = (cursors.get(name) ?? 0) % pool.length;
  cursors.set(name, index + 1);
  const player = pool[index];
  if (!player) return;
  void player.seekTo(0).then(() => {
    if (!muted) player.play();
  });
}

export function releaseAudio(): void {
  music?.remove();
  music = null;
  for (const pool of pools.values()) {
    for (const player of pool) player.remove();
  }
  pools.clear();
  ready = false;
  started = false;
}
