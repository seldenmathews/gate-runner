import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LEVELS } from '../levels';
import { loadProgress } from '../services/progress';
import { initialProgress, isLevelUnlocked, type Progress } from '../services/progress-model';
import { isMuted, startMusic, subscribeMute, toggleMute } from '../services/audio';
import { colors, fonts } from '../theme';

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [progress, setProgress] = useState<Progress>(initialProgress);
  const [muted, setMuted] = useState(isMuted);
  useEffect(() => {
    void loadProgress().then(setProgress);
    return subscribeMute(setMuted);
  }, []);

  return (
    <View style={styles.root}>
      <View style={styles.skyline} pointerEvents="none">
        {[42, 78, 56, 110, 70, 90, 48, 130, 64, 84, 52].map((height, index) => (
          <View
            key={height + index}
            style={[
              styles.tower,
              {
                height,
                backgroundColor: index % 3 === 0 ? '#142033' : '#10192a',
                borderColor: index === 7 ? colors.cyan : '#1c2a40',
              },
            ]}
          />
        ))}
      </View>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 28 },
        ]}
      >
        <View style={styles.headerRow}>
          <Text style={styles.kicker}>SKYLINE SQUAD</Text>
          <Pressable onPress={() => toggleMute()} style={styles.mute} accessibilityRole="button">
            <Text style={styles.muteText}>{muted ? 'SOUND' : 'MUTE'}</Text>
          </Pressable>
        </View>
        <View style={styles.titleWrap}>
          <Text style={styles.titleGhost}>GATE</Text>
          <Text style={styles.title}>GATE</Text>
          <Text style={styles.title}>RUNNER</Text>
        </View>
        <Text style={styles.tag}>Steer the crowd. Shoot the glitch. Stack the squad.</Text>
        <View style={styles.legend}>
          <Legend color={colors.mint} label="+N" />
          <Legend color={colors.danger} label="-N" />
          <Legend color={colors.gold} label="xN" />
          <Legend color={colors.violet} label="/N" />
        </View>
        {LEVELS.map((level, index) => {
          const number = index + 1;
          const locked = !isLevelUnlocked(progress, number);
          const best = progress.bestScores[level.id];
          const cleared = progress.cleared[level.id] === true;
          return (
            <Pressable
              key={level.id}
              disabled={locked}
              onPress={() => {
                startMusic();
                router.push({ pathname: '/play/[levelId]', params: { levelId: level.id } });
              }}
              style={[styles.card, locked && styles.cardLocked]}
              accessibilityRole="button"
              accessibilityState={{ disabled: locked }}
            >
              <View
                style={[
                  styles.accent,
                  {
                    backgroundColor:
                      index === 0 ? colors.cyan : index === 1 ? colors.gold : colors.danger,
                  },
                ]}
              />
              <View style={styles.cardBody}>
                <Text style={styles.cardIndex}>LEVEL {number}</Text>
                <Text style={styles.cardName}>{level.name}</Text>
                <Text style={styles.cardBrief} numberOfLines={2}>
                  {level.brief}
                </Text>
              </View>
              <View style={styles.cardMeta}>
                <Text style={[styles.cardState, cleared && { color: colors.mint }]}>
                  {locked ? 'LOCKED' : cleared ? 'CLEARED' : 'OPEN'}
                </Text>
                <Text style={styles.cardBest}>
                  {best !== undefined ? best.toLocaleString() : '—'}
                </Text>
              </View>
            </Pressable>
          );
        })}
        <Text style={styles.footer}>One finger. No account. About a minute a run.</Text>
      </ScrollView>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={[styles.legendChip, { borderColor: color }]}>
      <Text style={[styles.legendText, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  skyline: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 150,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    opacity: 0.9,
  },
  tower: { width: 26, borderWidth: 1, borderBottomWidth: 0 },
  content: { paddingHorizontal: 20, gap: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kicker: { color: colors.cyan, fontFamily: fonts.bold, letterSpacing: 3, fontSize: 13 },
  mute: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  muteText: { color: colors.muted, fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1 },
  titleWrap: { marginTop: 8 },
  titleGhost: {
    position: 'absolute',
    left: 4,
    top: 2,
    color: '#ff4ad8',
    opacity: 0.45,
    fontFamily: fonts.display,
    fontSize: 84,
    lineHeight: 76,
  },
  title: { color: colors.ink, fontFamily: fonts.display, fontSize: 84, lineHeight: 76 },
  tag: {
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 4,
  },
  legend: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  legendChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  legendText: { fontFamily: fonts.bold, fontSize: 14 },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.bgRaised,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
    minHeight: 104,
  },
  cardLocked: { opacity: 0.45 },
  accent: { width: 6 },
  cardBody: { flex: 1, paddingVertical: 14, paddingLeft: 14, paddingRight: 8 },
  cardIndex: { color: colors.muted, fontFamily: fonts.bold, fontSize: 11, letterSpacing: 1.4 },
  cardName: { color: colors.ink, fontFamily: fonts.bold, fontSize: 22, marginTop: 2 },
  cardBrief: {
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 18,
    marginTop: 4,
  },
  cardMeta: { alignItems: 'flex-end', justifyContent: 'space-between', padding: 14 },
  cardState: { color: colors.cyan, fontFamily: fonts.bold, fontSize: 11, letterSpacing: 1 },
  cardBest: { color: colors.gold, fontFamily: fonts.display, fontSize: 28, lineHeight: 30 },
  footer: {
    textAlign: 'center',
    color: colors.muted,
    fontFamily: fonts.medium,
    marginTop: 8,
  },
});
