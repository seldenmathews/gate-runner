import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { isAutodriveParam } from '../../game/autodrive';
import { getLevel } from '../../levels';
import { loadProgress } from '../../services/progress';
import { isLevelUnlocked } from '../../services/progress-model';
import { colors } from '../../theme';
import { GameScreen } from '../../ui/GameScreen';

export default function PlayRoute() {
  const params = useLocalSearchParams<{ levelId: string; autodrive?: string }>();
  const levelId = typeof params.levelId === 'string' ? params.levelId : '';
  const level = getLevel(levelId);
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (!level) return;
    const number = Number(level.id);
    void loadProgress()
      .then((progress) => setAllowed(isLevelUnlocked(progress, number)))
      .catch(() => setAllowed(number === 1));
  }, [level]);

  const autodrive = isAutodriveParam(params.autodrive);
  if (!level) return <Redirect href="/" />;
  if (autodrive) return <GameScreen level={level} autodrive />;
  if (allowed === null) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={colors.cyan} />
      </View>
    );
  }
  if (!allowed) return <Redirect href="/" />;
  return <GameScreen level={level} autodrive={false} />;
}
