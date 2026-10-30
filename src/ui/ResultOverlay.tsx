import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme';

interface ResultOverlayProps {
  won: boolean;
  score: number;
  squad: number;
  best: number | undefined;
  nextUnlocked: boolean;
  hasNext: boolean;
  onRetry: () => void;
  onNext: () => void;
  onLevels: () => void;
}

export function ResultOverlay({
  won,
  score,
  squad,
  best,
  nextUnlocked,
  hasNext,
  onRetry,
  onNext,
  onLevels,
}: ResultOverlayProps) {
  return (
    <View style={styles.scrim}>
      <View style={styles.card}>
        <Text style={styles.kicker}>{won ? 'ROAD CLEARED' : 'SQUAD WIPED'}</Text>
        <Text style={[styles.title, { color: won ? colors.mint : colors.danger }]}>
          {won ? 'CLEARED' : 'WIPED'}
        </Text>
        <Text style={styles.score}>{score.toLocaleString()}</Text>
        <Text style={styles.meta}>
          {squad} survivors{best !== undefined ? `  ·  best ${best.toLocaleString()}` : ''}
        </Text>
        <Pressable onPress={onRetry} style={styles.primary} accessibilityRole="button">
          <Text style={styles.primaryText}>RETRY</Text>
        </Pressable>
        {won && hasNext ? (
          <Pressable
            onPress={onNext}
            disabled={!nextUnlocked}
            style={[styles.secondary, !nextUnlocked && styles.disabled]}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryText}>{nextUnlocked ? 'NEXT LEVEL' : 'SAVING…'}</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={onLevels} style={styles.ghost} accessibilityRole="button">
          <Text style={styles.ghostText}>LEVEL SELECT</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(5,8,14,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.bgRaised,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 24,
    alignItems: 'center',
  },
  kicker: { color: colors.muted, fontFamily: fonts.bold, letterSpacing: 2, fontSize: 13 },
  title: { fontFamily: fonts.display, fontSize: 84, lineHeight: 84, marginTop: 4 },
  score: { color: colors.ink, fontFamily: fonts.display, fontSize: 56, lineHeight: 58 },
  meta: { color: colors.muted, fontFamily: fonts.medium, fontSize: 16, marginBottom: 18 },
  primary: {
    alignSelf: 'stretch',
    backgroundColor: colors.cyan,
    borderRadius: 14,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: '#041018', fontFamily: fonts.bold, fontSize: 18, letterSpacing: 1.4 },
  secondary: {
    alignSelf: 'stretch',
    marginTop: 10,
    borderRadius: 14,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.mint,
  },
  secondaryText: { color: colors.mint, fontFamily: fonts.bold, fontSize: 18, letterSpacing: 1.4 },
  ghost: { marginTop: 14, padding: 10 },
  ghostText: { color: colors.muted, fontFamily: fonts.bold, letterSpacing: 1.2 },
  disabled: { opacity: 0.45 },
});
