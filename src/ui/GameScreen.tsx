import { router } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import { Component, useEffect, useRef, useState } from 'react';
import {
  AppState,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import type { ErrorInfo, ReactNode } from 'react';
import { toHud, type HudSnapshot } from '../game/snapshot';
import { nextLevelId } from '../levels';
import { GameCanvas } from '../render/canvas';
import { Scene } from '../render/Scene';
import { isMuted, startMusic, subscribeMute, toggleMute } from '../services/audio';
import { recordRun, type Progress } from '../services/progress';
import { ROAD_MARGIN } from '../sim/constants';
import { createState } from '../sim/create';
import type { Level, SimInput } from '../sim/types';
import { colors, fonts } from '../theme';
import { Hud } from './Hud';
import { ResultOverlay } from './ResultOverlay';

interface GameScreenProps {
  level: Level;
  autodrive: boolean;
}

export function GameScreen({ level, autodrive }: GameScreenProps) {
  const [runId, setRunId] = useState(0);
  return (
    <Run
      key={`${level.id}:${runId}`}
      level={level}
      autodrive={autodrive}
      onRestart={() => setRunId((value) => value + 1)}
    />
  );
}

function Run({
  level,
  autodrive,
  onRestart,
}: {
  level: Level;
  autodrive: boolean;
  onRestart: () => void;
}) {
  useKeepAwake();
  const [state] = useState(() => createState(level));
  const inputRef = useRef<SimInput>({ targetX: 0 });
  const pausedRef = useRef(false);
  const [hud, setHud] = useState<HudSnapshot>(() => toHud(state, level, 0));
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(isMuted);
  const [notice, setNotice] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Progress | null>(null);
  const saved = useRef(false);
  const { width } = useWindowDimensions();
  const backgrounded = useRef(false);

  useEffect(() => subscribeMute(setMuted), []);

  useEffect(() => {
    startMusic();
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      backgrounded.current = next !== 'active';
      pausedRef.current = backgrounded.current || paused;
    });
    return () => sub.remove();
  }, [paused]);

  useEffect(() => {
    if (Platform.OS !== 'web') return undefined;
    const limit = level.roadHalfWidth - ROAD_MARGIN;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' || event.key === 'a') inputRef.current.targetX = -limit;
      if (event.key === 'ArrowRight' || event.key === 'd') inputRef.current.targetX = limit;
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [level.roadHalfWidth]);

  useEffect(() => {
    if (saved.current) return;
    if (hud.phase !== 'won' && hud.phase !== 'lost') return;
    saved.current = true;
    void recordRun(level.id, hud.score, hud.phase === 'won').then(setOutcome);
  }, [hud.phase, hud.score, level.id]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(null), 1100);
    return () => clearTimeout(timer);
  }, [notice]);

  const ended = hud.phase === 'won' || hud.phase === 'lost';
  const next = nextLevelId(level.id);
  const steer = (pageX: number) => {
    if (ended || pausedRef.current || autodrive) return;
    const limit = level.roadHalfWidth - ROAD_MARGIN;
    const t = Math.max(0, Math.min(1, pageX / Math.max(1, width)));
    inputRef.current.targetX = -limit + t * limit * 2;
  };

  return (
    <View style={styles.root}>
      <RenderBoundary>
        <GameCanvas>
          <Scene
            state={state}
            inputRef={inputRef}
            pausedRef={pausedRef}
            autodrive={autodrive}
            level={level}
            onHud={(nextHud, flash) => {
              setHud(nextHud);
              if (flash) setNotice(flash);
            }}
          />
        </GameCanvas>
      </RenderBoundary>
      <View
        style={StyleSheet.absoluteFill}
        onStartShouldSetResponder={() => !ended}
        onMoveShouldSetResponder={() => !ended}
        onResponderGrant={(event) => steer(event.nativeEvent.pageX)}
        onResponderMove={(event) => steer(event.nativeEvent.pageX)}
      />
      <Hud
        levelName={level.name}
        hud={hud}
        paused={paused}
        muted={muted}
        autodrive={autodrive}
        devFps={__DEV__}
        notice={notice}
        onPause={() => {
          setPaused((value) => {
            const nextPaused = !value;
            pausedRef.current = nextPaused || backgrounded.current;
            return nextPaused;
          });
        }}
        onMute={() => toggleMute()}
      />
      {paused && !ended ? (
        <View style={styles.pause}>
          <Text style={styles.pauseTitle}>PAUSED</Text>
          <Pressable
            style={styles.pauseButton}
            onPress={() => {
              pausedRef.current = backgrounded.current;
              setPaused(false);
            }}
          >
            <Text style={styles.pauseButtonText}>RESUME</Text>
          </Pressable>
          <Pressable style={styles.pauseGhost} onPress={onRestart}>
            <Text style={styles.pauseGhostText}>RETRY</Text>
          </Pressable>
          <Pressable style={styles.pauseGhost} onPress={() => router.replace('/')}>
            <Text style={styles.pauseGhostText}>LEVEL SELECT</Text>
          </Pressable>
        </View>
      ) : null}
      {ended ? (
        <ResultOverlay
          won={hud.phase === 'won'}
          score={hud.score}
          squad={hud.count}
          best={outcome?.bestScores[level.id]}
          nextUnlocked={outcome !== null}
          hasNext={next !== null}
          onRetry={onRestart}
          onNext={() => {
            if (next) {
              router.replace({ pathname: '/play/[levelId]', params: { levelId: next } });
            }
          }}
          onLevels={() => router.replace('/')}
        />
      ) : null}
    </View>
  );
}

class RenderBoundary extends Component<{ children: ReactNode }, { message: string | null }> {
  state = { message: null as string | null };

  static getDerivedStateFromError(error: Error): { message: string } {
    return { message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(error, info.componentStack);
  }

  render(): ReactNode {
    if (!this.state.message) return this.props.children;
    return (
      <View style={styles.boundary}>
        <Text style={styles.pauseTitle}>RENDERER FAILED</Text>
        <Text style={styles.boundaryText}>{this.state.message}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  pause: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(5,8,14,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  pauseTitle: { color: colors.ink, fontFamily: fonts.display, fontSize: 72, lineHeight: 72 },
  pauseButton: {
    backgroundColor: colors.cyan,
    borderRadius: 14,
    minHeight: 56,
    minWidth: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseButtonText: { color: '#041018', fontFamily: fonts.bold, fontSize: 18, letterSpacing: 1.2 },
  pauseGhost: { padding: 10 },
  pauseGhostText: { color: colors.muted, fontFamily: fonts.bold, letterSpacing: 1.2 },
  boundary: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  boundaryText: {
    color: colors.muted,
    fontFamily: fonts.medium,
    textAlign: 'center',
    marginTop: 12,
  },
});
