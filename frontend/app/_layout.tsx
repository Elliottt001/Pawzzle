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
  const [fontsLoaded, fontError] = useFonts({
    'PingFang-Regular': require('@/assets/font/PingFang/PingFang Regular_0.ttf'),
    'PingFang-Medium': require('@/assets/font/PingFang/PingFang Medium_0.ttf'),
    'PingFang-Bold': require('@/assets/font/PingFang/PingFang Bold_0.ttf'),
    'PingFang-Heavy': require('@/assets/font/PingFang/PingFang Heavy_0.ttf'),
    'PingFang-Light': require('@/assets/font/PingFang/PingFang Light_0.ttf'),
    'PingFang-ExtraLight': require('@/assets/font/PingFang/PingFang ExtraLight_0.ttf'),
  });

  useEffect(() => {
    if (!fontsLoaded && !fontError) {
      return;
    }
    const baseStyle = { fontFamily: Theme.fonts.regular };
    Text.defaultProps = Text.defaultProps || {};
    Text.defaultProps.style = [Text.defaultProps.style, baseStyle];
    TextInput.defaultProps = TextInput.defaultProps || {};
    TextInput.defaultProps.style = [TextInput.defaultProps.style, baseStyle];
    SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: '弹窗' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
