import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { Text, TextInput } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Theme } from '@/constants/theme';

export const unstable_settings = {
  anchor: '(tabs)',
};

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    'PingFang-Medium': require('@/assets/fonts/PingFang Medium_0.ttf'),
    'PingFang-Bold': require('@/assets/fonts/PingFang Bold_0.ttf'),
    'PangMen-ZhengDao': require('@/assets/fonts/庞门正道标题体3.0.ttf'),
    'RuiZi-ChaoPai': require('@/assets/fonts/锐字潮牌真言简2.0免费 大粗(REEJI-ZhenyanGB2.0-Bold).ttf'),
    'RuiZi-Gong': require('@/assets/fonts/RuiZiGongFangJinGangDaHeiJian1-0-1.ttf'),
  });

  useEffect(() => {
    if (!fontsLoaded) {
      return;
    }
    const baseStyle = { fontFamily: Theme.fonts.regular };
    Text.defaultProps = Text.defaultProps || {};
    Text.defaultProps.style = [Text.defaultProps.style, baseStyle];
    TextInput.defaultProps = TextInput.defaultProps || {};
    TextInput.defaultProps.style = [TextInput.defaultProps.style, baseStyle];
  }, [fontsLoaded]);

  useEffect(() => {
    if (!fontsLoaded) {
      return;
    }
    SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: true, title: '弹窗' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
