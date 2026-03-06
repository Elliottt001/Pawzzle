import * as React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import {
  getSession,
  subscribeSession,
  type AuthSession,
} from '@/lib/session';
import { styles } from '@/styles/index.styles';
import { AuthFlow } from '@/components/auth/AuthFlow';
import { UserProfileView } from '@/components/profile/UserProfileView';

export default function ProfileScreen() {
  const [session, setSessionState] = React.useState<AuthSession | null>(() => getSession());

  React.useEffect(() => {
    const unsubscribe = subscribeSession((nextSession) => {
      setSessionState(nextSession);
    });
    return unsubscribe;
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.background}>
        {session ? (
          <View style={styles.profileBackdrop} pointerEvents="none">
            <Svg width="100%" height="100%" viewBox="0 0 378 315" preserveAspectRatio="none">
              <Defs>
                <LinearGradient id="profileGradient" x1="0" y1="1" x2="0" y2="0">
                  <Stop offset="14.44%" stopColor="#FFFEF9" stopOpacity={0} />
                  <Stop offset="108.37%" stopColor="#F4C17F" />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width="378" height="315" fill="url(#profileGradient)" />
            </Svg>
          </View>
        ) : (
          <>
            <View style={[styles.authGlow, styles.authGlowTop]} />
            <View style={[styles.authGlow, styles.authGlowBottom]} />
          </>
        )}
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {session ? (
          <UserProfileView session={session} />
        ) : (
          <ScrollView
            contentContainerStyle={styles.authContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <AuthFlow />
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
