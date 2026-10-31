import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initAudio, releaseAudio } from '../services/audio';
import { colors } from '../theme';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Teko_700Bold: require('../../assets/fonts/Teko-Bold.ttf'),
    Rajdhani_500Medium: require('../../assets/fonts/Rajdhani-Medium.ttf'),
    Rajdhani_600SemiBold: require('../../assets/fonts/Rajdhani-SemiBold.ttf'),
    Rajdhani_700Bold: require('../../assets/fonts/Rajdhani-Bold.ttf'),
  });

  useEffect(() => {
    void initAudio();
    return () => releaseAudio();
  }, []);

  useEffect(() => {
    if (loaded || error) void SplashScreen.hideAsync();
  }, [error, loaded]);

  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            contentStyle: { backgroundColor: colors.bg },
          }}
        />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
