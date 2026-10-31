import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type HapticKind = 'light' | 'heavy' | 'warning' | 'flip' | 'success' | 'error';

let last = -1;

export function pulse(kind: HapticKind, time: number): void {
  if (Platform.OS === 'web') return;
  const urgent = kind === 'flip' || kind === 'success' || kind === 'error';
  if (!urgent && time - last < 0.08) return;
  last = time;
  const pending =
    kind === 'heavy'
      ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
      : kind === 'warning'
        ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
        : kind === 'error'
          ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
          : kind === 'flip' || kind === 'success'
            ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
            : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  void pending.catch(() => undefined);
}
