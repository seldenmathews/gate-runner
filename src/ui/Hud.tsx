import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { HudSnapshot } from '../game/snapshot';
import { colors, fonts } from '../theme';

interface HudProps {
  levelName: string;
  hud: HudSnapshot;
  paused: boolean;
  muted: boolean;
  autodrive: boolean;
  devFps: boolean;
  onPause: () => void;
  onMute: () => void;
  notice: string | null;
}

export function Hud({
  levelName,
  hud,
  paused,
  muted,
  autodrive,
  devFps,
  onPause,
  onMute,
  notice,
}: HudProps) {
  const insets = useSafeAreaInsets();
  const finaleRatio = hud.finaleMaxHp <= 0 ? 0 : hud.finaleHp / hud.finaleMaxHp;
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={[styles.top, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <View style={styles.topRow}>
          <Pressable onPress={onPause} style={styles.chip} accessibilityRole="button">
            <Text style={styles.chipText}>{paused ? 'RESUME' : 'PAUSE'}</Text>
          </Pressable>
          <Text style={styles.level} numberOfLines={1}>
            {levelName}
          </Text>
          <Pressable onPress={onMute} style={styles.chip} accessibilityRole="button">
            <Text style={styles.chipText}>{muted ? 'SOUND' : 'MUTE'}</Text>
          </Pressable>
        </View>
        <View style={styles.countRow}>
          <View>
            <Text style={styles.count}>{hud.count}</Text>
            <Text style={styles.countLabel}>SQUAD</Text>
          </View>
          <View style={styles.scoreBlock}>
            <Text style={styles.score}>{hud.score.toLocaleString()}</Text>
            <Text style={styles.countLabel}>SCORE</Text>
          </View>
        </View>
      </View>

      <View style={styles.middle} pointerEvents="none">
        {notice ? (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>{notice}</Text>
          </View>
        ) : null}
        {hud.banner ? (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>{hud.banner}</Text>
          </View>
        ) : null}
        {hud.hack ? (
          <View style={styles.hack}>
            <Text style={styles.hackLabel}>HACK {hud.hack.label}</Text>
            <Text style={styles.hackCount}>
              {hud.hack.hits}/{hud.hack.needed}
            </Text>
          </View>
        ) : null}
        {autodrive ? <Text style={styles.auto}>AUTODRIVE</Text> : null}
      </View>

      <View
        style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 16) }]}
        pointerEvents="none"
      >
        {hud.finaleActive ? (
          <View style={styles.finale}>
            <Text style={styles.finaleName}>
              {hud.finaleKind === 'boss' ? 'BOSS' : 'WALL'} · {hud.finaleName}
            </Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${Math.round(finaleRatio * 100)}%` }]} />
            </View>
          </View>
        ) : null}
        <View style={styles.stats}>
          <Text style={styles.stat}>FIRE {hud.fireRate.toFixed(1)}</Text>
          <Text style={styles.stat}>DMG {hud.damage}</Text>
          <Text style={styles.stat}>GOLD {hud.gold}</Text>
          {devFps && hud.fps > 0 ? <Text style={styles.stat}>{hud.fps} FPS</Text> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  top: {
    paddingHorizontal: 16,
    backgroundColor: 'rgba(7,11,18,0.55)',
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  level: {
    flex: 1,
    textAlign: 'center',
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 16,
    letterSpacing: 1.4,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(18,24,38,0.9)',
  },
  chipText: { color: colors.cyan, fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1 },
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 4,
    paddingBottom: 8,
  },
  count: {
    color: colors.ink,
    fontFamily: fonts.display,
    fontSize: 68,
    lineHeight: 68,
  },
  countLabel: {
    color: colors.muted,
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 2,
    marginTop: -4,
  },
  scoreBlock: { alignItems: 'flex-end' },
  score: { color: colors.gold, fontFamily: fonts.display, fontSize: 36, lineHeight: 38 },
  middle: { alignItems: 'center', gap: 10, paddingHorizontal: 24 },
  banner: {
    backgroundColor: 'rgba(7,11,18,0.78)',
    borderColor: colors.cyan,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  bannerText: {
    color: colors.cyan,
    fontFamily: fonts.bold,
    fontSize: 16,
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  notice: {
    backgroundColor: colors.mint,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  noticeText: { color: '#062016', fontFamily: fonts.bold, fontSize: 18, letterSpacing: 1 },
  hack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(18,8,28,0.82)',
    borderColor: colors.violet,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  hackLabel: { color: colors.violet, fontFamily: fonts.bold, fontSize: 14, letterSpacing: 1 },
  hackCount: { color: colors.ink, fontFamily: fonts.display, fontSize: 22, lineHeight: 24 },
  auto: { color: colors.muted, fontFamily: fonts.bold, letterSpacing: 2, fontSize: 12 },
  bottom: {
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: 'rgba(7,11,18,0.5)',
    gap: 8,
  },
  finale: { gap: 6 },
  finaleName: { color: colors.ink, fontFamily: fonts.bold, letterSpacing: 1, fontSize: 13 },
  track: { height: 8, borderRadius: 99, backgroundColor: '#2a1420', overflow: 'hidden' },
  fill: { height: 8, backgroundColor: colors.danger },
  stats: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { color: colors.muted, fontFamily: fonts.semibold, fontSize: 13, letterSpacing: 0.8 },
});
