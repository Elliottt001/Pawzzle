import * as React from 'react';
import { Image } from 'expo-image';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type AuthUser = {
  id: number;
  name: string;
  email: string;
};

type AuthSession = {
  token: string;
  user: AuthUser;
};

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080');

export default function ProfileScreen() {
  const [session, setSession] = React.useState<AuthSession | null>(null);
  const [status, setStatus] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [registerName, setRegisterName] = React.useState('');
  const [registerEmail, setRegisterEmail] = React.useState('');
  const [registerPassword, setRegisterPassword] = React.useState('');
  const [loginEmail, setLoginEmail] = React.useState('');
  const [loginPassword, setLoginPassword] = React.useState('');

  const runAuthAction = async (action: () => Promise<void>) => {
    setStatus(null);
    setLoading(true);
    try {
      await action();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong.';
      setStatus(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () =>
    runAuthAction(async () => {
      const data = await request<AuthSession>('/api/auth/register', {
        name: registerName,
        email: registerEmail,
        password: registerPassword,
      });
      setSession(data);
      setStatus('Registered and signed in.');
    });

  const handleLogin = () =>
    runAuthAction(async () => {
      const data = await request<AuthSession>('/api/auth/login', {
        email: loginEmail,
        password: loginPassword,
      });
      setSession(data);
      setStatus('Signed in.');
    });

  const handleLogout = () =>
    runAuthAction(async () => {
      if (!session) {
        return;
      }
      await request('/api/auth/logout', { token: session.token });
      setSession(null);
      setStatus('Signed out.');
    });

  const displayName = session?.user.name ?? 'Guest';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.background}>
        <View style={[styles.blob, styles.blobTop]} />
        <View style={[styles.blob, styles.blobSide]} />
        <View style={[styles.blob, styles.blobBottom]} />
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Text style={styles.overline}>User</Text>
          <Text style={styles.title}>Account</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.profileCard}>
            <View style={styles.avatarWrap}>
              <Image source={require('@/assets/images/icon.png')} style={styles.avatar} />
            </View>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.nicknameLabel}>Status</Text>
            <View style={styles.nicknamePill}>
              <Text style={styles.nicknameText}>{session ? 'Signed in' : 'Guest mode'}</Text>
            </View>
            {session ? (
              <Text style={styles.emailText}>{session.user.email}</Text>
            ) : null}
          </View>

          {status ? <Text style={styles.statusText}>{status}</Text> : null}

          {session ? (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Signed in</Text>
              <Text style={styles.formSubtitle}>
                You can sign out on this device when you are ready.
              </Text>
              <Pressable
                onPress={handleLogout}
                disabled={loading}
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed && styles.actionButtonPressed,
                ]}>
                <Text style={styles.actionButtonText}>
                  {loading ? 'Signing out...' : 'Sign out'}
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
              <FormSection title="Create account">
                <TextInput
                  value={registerName}
                  onChangeText={setRegisterName}
                  placeholder="Name"
                  placeholderTextColor="#9CA3AF"
                  style={styles.input}
                />
                <TextInput
                  value={registerEmail}
                  onChangeText={setRegisterEmail}
                  placeholder="Email"
                  placeholderTextColor="#9CA3AF"
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                />
                <TextInput
                  value={registerPassword}
                  onChangeText={setRegisterPassword}
                  placeholder="Password"
                  placeholderTextColor="#9CA3AF"
                  style={styles.input}
                  secureTextEntry
                  autoCapitalize="none"
                />
                <Pressable
                  onPress={handleRegister}
                  disabled={loading}
                  style={({ pressed }) => [
                    styles.actionButton,
                    pressed && styles.actionButtonPressed,
                  ]}>
                  <Text style={styles.actionButtonText}>
                    {loading ? 'Registering...' : 'Register'}
                  </Text>
                </Pressable>
              </FormSection>

              <FormSection title="Sign in">
                <TextInput
                  value={loginEmail}
                  onChangeText={setLoginEmail}
                  placeholder="Email"
                  placeholderTextColor="#9CA3AF"
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                />
                <TextInput
                  value={loginPassword}
                  onChangeText={setLoginPassword}
                  placeholder="Password"
                  placeholderTextColor="#9CA3AF"
                  style={styles.input}
                  secureTextEntry
                  autoCapitalize="none"
                />
                <Pressable
                  onPress={handleLogin}
                  disabled={loading}
                  style={({ pressed }) => [
                    styles.actionButton,
                    pressed && styles.actionButtonPressed,
                  ]}>
                  <Text style={styles.actionButtonText}>
                    {loading ? 'Signing in...' : 'Sign in'}
                  </Text>
                </Pressable>
              </FormSection>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.formCard}>
      <Text style={styles.formTitle}>{title}</Text>
      <View style={styles.formFields}>{children}</View>
    </View>
  );
}

async function request<T = unknown>(path: string, payload?: Record<string, unknown>) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: payload ? JSON.stringify(payload) : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  let data: T | undefined;
  if (text) {
    try {
      data = JSON.parse(text) as T;
    } catch {
      data = undefined;
    }
  }

  if (!response.ok) {
    const message =
      typeof data === 'object' && data && 'message' in data
        ? String((data as { message?: string }).message)
        : response.statusText;
    throw new Error(message || 'Request failed');
  }

  return data;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FDF7F0',
  },
  container: {
    flex: 1,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  blob: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.65,
  },
  blobTop: {
    top: -80,
    left: -40,
    backgroundColor: '#FCE7CF',
  },
  blobSide: {
    top: 80,
    right: -60,
    backgroundColor: '#DFF3E5',
  },
  blobBottom: {
    bottom: -70,
    left: '30%',
    backgroundColor: '#D9EEF7',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  overline: {
    fontSize: 11,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: '#6B7280',
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#111827',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 140,
    gap: 16,
  },
  profileCard: {
    marginTop: 8,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EFE3D6',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 3,
  },
  avatarWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F7EFE4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EADBC8',
  },
  avatar: {
    width: 68,
    height: 68,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  nicknameLabel: {
    marginTop: 12,
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1.6,
  },
  nicknamePill: {
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#E8F5EE',
    borderWidth: 1,
    borderColor: '#CDE8D9',
  },
  nicknameText: {
    fontSize: 14,
    color: '#15803D',
    fontWeight: '600',
  },
  emailText: {
    marginTop: 10,
    fontSize: 13,
    color: '#6B7280',
  },
  statusText: {
    fontSize: 13,
    color: '#1F2937',
  },
  formCard: {
    padding: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFE3D6',
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 2,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  formSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
  },
  formFields: {
    gap: 12,
  },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#EEE6DC',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#111827',
  },
  actionButton: {
    backgroundColor: '#157B57',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  actionButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
