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
import { useRouter } from 'expo-router';
import { Theme } from '@/constants/theme';
import { getSession, setSession, subscribeSession, type AuthSession } from '@/lib/session';

type UserType = 'INDIVIDUAL' | 'INSTITUTION';

type GeneratePetsResponse = {
  requested: number;
  parsed: number;
  created: number;
  skipped: number;
  skippedReasons?: string[];
  rawResponse?: string;
};

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080');
const ensureChinese = (message: string, fallback: string) =>
  /[\u4e00-\u9fff]/.test(message) ? message : fallback;

export default function ProfileScreen() {
  const router = useRouter();
  const [session, setSessionState] = React.useState<AuthSession | null>(() => getSession());
  const [status, setStatus] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [registerName, setRegisterName] = React.useState('');
  const [registerEmail, setRegisterEmail] = React.useState('');
  const [registerPassword, setRegisterPassword] = React.useState('');
  const [registerUserType, setRegisterUserType] = React.useState<UserType>('INDIVIDUAL');
  const [loginEmail, setLoginEmail] = React.useState('');
  const [loginPassword, setLoginPassword] = React.useState('');
  const [aiStatus, setAiStatus] = React.useState<'idle' | 'generating' | 'success' | 'error'>(
    'idle'
  );
  const [aiMessage, setAiMessage] = React.useState<string | null>(null);
  const isGenerating = aiStatus === 'generating';

  React.useEffect(() => {
    const unsubscribe = subscribeSession((nextSession) => {
      setSessionState(nextSession);
    });
    return unsubscribe;
  }, []);

  const runAuthAction = async (action: () => Promise<void>) => {
    setStatus(null);
    setLoading(true);
    try {
      await action();
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      setStatus(ensureChinese(message, '出错了，请稍后重试。'));
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
        userType: registerUserType,
      });
      setSession(data);
      setStatus('注册并已登录。');
    });

  const handleLogin = () =>
    runAuthAction(async () => {
      const data = await request<AuthSession>('/api/auth/login', {
        email: loginEmail,
        password: loginPassword,
      });
      setSession(data);
      setStatus('已登录。');
    });

  const handleLogout = () =>
    runAuthAction(async () => {
      if (!session) {
        return;
      }
      await request('/api/auth/logout', { token: session.token });
      setSession(null);
      setStatus('已退出登录。');
    });

  const handleGenerateCards = async () => {
    if (isGenerating) {
      return;
    }
    setAiStatus('generating');
    setAiMessage(null);

    try {
      const data = await request<GeneratePetsResponse>('/api/pets/generate', {});
      const parsed = data?.parsed ?? 0;
      const created = data?.created ?? 0;
      const skipped = data?.skipped ?? 0;
      const reasons =
        data?.skippedReasons && data.skippedReasons.length
          ? ` 跳过原因：${data.skippedReasons.join(' | ')}`
          : '';
      setAiStatus('success');
      setAiMessage(`AI生成完成：解析${parsed}条，新增${created}条，跳过${skipped}条。${reasons}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      setAiStatus('error');
      setAiMessage(ensureChinese(message, 'AI生成失败，请稍后再试。'));
    }
  };

  const displayName = session?.user.name ?? '游客';
  const userTypeLabel = session
    ? session.user.userType === 'INSTITUTION'
      ? '机构用户 (VIP)'
      : '普通用户'
    : '未登录';

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
          <Text style={styles.overline}>用户</Text>
          <Text style={styles.title}>账户</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.profileCard}>
            <Pressable
              disabled={!session}
              onPress={() => {
                if (session?.user.id) {
                  router.push(`/user/${session.user.id}`);
                }
              }}
              style={({ pressed }) => [
                styles.avatarWrap,
                pressed && session && styles.avatarPressed,
              ]}>
              <Image source={require('@/assets/images/icon.png')} style={styles.avatar} />
            </Pressable>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.nicknameLabel}>状态</Text>
            <View style={styles.nicknamePill}>
              <Text style={styles.nicknameText}>{session ? '已登录' : '游客模式'}</Text>
            </View>
            <Text style={styles.nicknameLabel}>用户类型</Text>
            <View style={styles.userTypePill}>
              <Text style={styles.userTypeText}>{userTypeLabel}</Text>
            </View>
            {session ? (
              <Text style={styles.emailText}>{session.user.email}</Text>
            ) : null}
          </View>

          {status ? <Text style={styles.statusText}>{status}</Text> : null}

          {session ? (
            <FormSection title="AI 生成宠物卡片">
              <Text style={styles.formSubtitle}>一键生成 20 张宠物卡片并写入数据库。</Text>
              <Pressable
                onPress={handleGenerateCards}
                disabled={isGenerating}
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed && styles.actionButtonPressed,
                ]}>
                <Text style={styles.actionButtonText}>
                  {isGenerating ? '生成中...' : '生成20张卡片'}
                </Text>
              </Pressable>
              {aiMessage ? (
                <Text
                  style={[
                    styles.statusText,
                    aiStatus === 'error' ? styles.aiMessageError : styles.aiMessageSuccess,
                  ]}>
                  {aiMessage}
                </Text>
              ) : null}
            </FormSection>
          ) : null}

          {session ? (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>已登录</Text>
              <Text style={styles.formSubtitle}>
                如需退出登录，可在此设备操作。
              </Text>
              <Pressable
                onPress={handleLogout}
                disabled={loading}
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed && styles.actionButtonPressed,
                ]}>
                <Text style={styles.actionButtonText}>
                  {loading ? '正在退出...' : '退出登录'}
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
              <FormSection title="注册账户">
                <TextInput
                  value={registerName}
                  onChangeText={setRegisterName}
                  placeholder="姓名"
                  placeholderTextColor={Theme.colors.placeholder}
                  style={styles.input}
                />
                <TextInput
                  value={registerEmail}
                  onChangeText={setRegisterEmail}
                  placeholder="邮箱"
                  placeholderTextColor={Theme.colors.placeholder}
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                />
                <TextInput
                  value={registerPassword}
                  onChangeText={setRegisterPassword}
                  placeholder="密码"
                  placeholderTextColor={Theme.colors.placeholder}
                  style={styles.input}
                  secureTextEntry
                  autoCapitalize="none"
                />
                <Text style={styles.fieldLabel}>用户类型</Text>
                <View style={styles.choiceRow}>
                  <Pressable
                    onPress={() => setRegisterUserType('INDIVIDUAL')}
                    style={({ pressed }) => [
                      styles.choicePill,
                      registerUserType === 'INDIVIDUAL' && styles.choicePillActive,
                      pressed && styles.choicePillPressed,
                    ]}>
                    <Text
                      style={[
                        styles.choiceText,
                        registerUserType === 'INDIVIDUAL' && styles.choiceTextActive,
                      ]}>
                      普通用户
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setRegisterUserType('INSTITUTION')}
                    style={({ pressed }) => [
                      styles.choicePill,
                      registerUserType === 'INSTITUTION' && styles.choicePillActive,
                      pressed && styles.choicePillPressed,
                    ]}>
                    <Text
                      style={[
                        styles.choiceText,
                        registerUserType === 'INSTITUTION' && styles.choiceTextActive,
                      ]}>
                      机构用户
                    </Text>
                  </Pressable>
                </View>
                <Pressable
                  onPress={handleRegister}
                  disabled={loading}
                  style={({ pressed }) => [
                    styles.actionButton,
                    pressed && styles.actionButtonPressed,
                ]}>
                <Text style={styles.actionButtonText}>
                  {loading ? '注册中...' : '注册'}
                </Text>
              </Pressable>
            </FormSection>

              <FormSection title="登录">
                <TextInput
                  value={loginEmail}
                  onChangeText={setLoginEmail}
                  placeholder="邮箱"
                  placeholderTextColor={Theme.colors.placeholder}
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                />
                <TextInput
                  value={loginPassword}
                  onChangeText={setLoginPassword}
                  placeholder="密码"
                  placeholderTextColor={Theme.colors.placeholder}
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
                  {loading ? '登录中...' : '登录'}
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
        ? String((data as { message?: string }).message ?? '')
        : response.statusText ?? '';
    throw new Error(ensureChinese(message, '请求失败'));
  }

  return data;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: Theme.layout.full,
    backgroundColor: Theme.colors.backgroundWarmAlt,
  },
  container: {
    flex: Theme.layout.full,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  blob: {
    position: 'absolute',
    width: Theme.sizes.s220,
    height: Theme.sizes.s220,
    borderRadius: Theme.radius.r110,
    opacity: Theme.opacity.o65,
  },
  blobTop: {
    top: -Theme.sizes.s80,
    left: -Theme.sizes.s40,
    backgroundColor: Theme.colors.decorativePeachSoft,
  },
  blobSide: {
    top: Theme.sizes.s80,
    right: -Theme.sizes.s60,
    backgroundColor: Theme.colors.decorativeMint,
  },
  blobBottom: {
    bottom: -Theme.sizes.s70,
    left: Theme.percent.p30,
    backgroundColor: Theme.colors.decorativeSkySoft,
  },
  header: {
    paddingHorizontal: Theme.spacing.s20,
    paddingTop: Theme.spacing.s12,
    paddingBottom: Theme.spacing.s8,
  },
  overline: {
    fontSize: Theme.typography.size.s11,
    letterSpacing: Theme.typography.letterSpacing.s3,
    textTransform: 'uppercase',
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.s6,
  },
  title: {
    fontSize: Theme.typography.size.s22,
    fontWeight: Theme.typography.weight.semiBold,
    color: Theme.colors.text,
  },
  content: {
    paddingHorizontal: Theme.spacing.s20,
    paddingBottom: Theme.sizes.s140,
    gap: Theme.spacing.s16,
  },
  profileCard: {
    marginTop: Theme.spacing.s8,
    padding: Theme.spacing.s20,
    backgroundColor: Theme.colors.cardTranslucentSoft,
    borderRadius: Theme.radius.r24,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarm,
    alignItems: 'center',
    ...Theme.shadows.cardLarge,
  },
  avatarWrap: {
    width: Theme.sizes.s96,
    height: Theme.sizes.s96,
    borderRadius: Theme.radius.r48,
    backgroundColor: Theme.colors.surfaceWarm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.s12,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarmSoft,
  },
  avatarPressed: {
    transform: [{ scale: Theme.scale.pressedSoft }],
  },
  avatar: {
    width: Theme.sizes.s68,
    height: Theme.sizes.s68,
  },
  name: {
    fontSize: Theme.typography.size.s20,
    fontWeight: Theme.typography.weight.semiBold,
    color: Theme.colors.text,
  },
  nicknameLabel: {
    marginTop: Theme.spacing.s12,
    fontSize: Theme.typography.size.s12,
    color: Theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: Theme.typography.letterSpacing.s1_6,
  },
  nicknamePill: {
    marginTop: Theme.spacing.s6,
    paddingHorizontal: Theme.spacing.s14,
    paddingVertical: Theme.spacing.s6,
    borderRadius: Theme.radius.pill,
    backgroundColor: Theme.colors.successSurface,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.successBorder,
  },
  nicknameText: {
    fontSize: Theme.typography.size.s14,
    color: Theme.colors.successStrong,
    fontWeight: Theme.typography.weight.semiBold,
  },
  userTypePill: {
    marginTop: Theme.spacing.s6,
    paddingHorizontal: Theme.spacing.s14,
    paddingVertical: Theme.spacing.s6,
    borderRadius: Theme.radius.pill,
    backgroundColor: Theme.colors.warningSurface,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.warningBorder,
  },
  userTypeText: {
    fontSize: Theme.typography.size.s13,
    color: Theme.colors.warningText,
    fontWeight: Theme.typography.weight.semiBold,
  },
  emailText: {
    marginTop: Theme.spacing.s10,
    fontSize: Theme.typography.size.s13,
    color: Theme.colors.textSecondary,
  },
  statusText: {
    fontSize: Theme.typography.size.s13,
    color: Theme.colors.textEmphasis,
  },
  formCard: {
    padding: Theme.spacing.s18,
    backgroundColor: Theme.colors.cardTranslucentSoft,
    borderRadius: Theme.radius.r20,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarm,
    ...Theme.shadows.elevatedSoft,
  },
  formTitle: {
    fontSize: Theme.typography.size.s16,
    fontWeight: Theme.typography.weight.semiBold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.s12,
  },
  formSubtitle: {
    fontSize: Theme.typography.size.s13,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.s12,
  },
  formFields: {
    gap: Theme.spacing.s12,
  },
  fieldLabel: {
    fontSize: Theme.typography.size.s12,
    fontWeight: Theme.typography.weight.semiBold,
    color: Theme.colors.textSubtle,
  },
  choiceRow: {
    flexDirection: 'row',
    gap: Theme.spacing.s10,
  },
  choicePill: {
    flex: Theme.layout.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Theme.spacing.s8,
    borderRadius: Theme.radius.r10,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarmAlt,
    backgroundColor: Theme.colors.backgroundNeutral,
  },
  choicePillActive: {
    backgroundColor: Theme.colors.successDeep,
    borderColor: Theme.colors.successDeep,
  },
  choicePillPressed: {
    transform: [{ scale: Theme.scale.pressedSoft }],
  },
  choiceText: {
    fontSize: Theme.typography.size.s12,
    color: Theme.colors.textEmphasis,
    fontWeight: Theme.typography.weight.semiBold,
  },
  choiceTextActive: {
    color: Theme.colors.textInverse,
  },
  input: {
    minHeight: Theme.sizes.s44,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarmAlt,
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.r14,
    paddingHorizontal: Theme.spacing.s12,
    fontSize: Theme.typography.size.s14,
    color: Theme.colors.text,
  },
  actionButton: {
    backgroundColor: Theme.colors.successDeep,
    paddingVertical: Theme.spacing.s12,
    borderRadius: Theme.radius.r14,
    alignItems: 'center',
  },
  actionButtonPressed: {
    transform: [{ scale: Theme.scale.pressedSoft }],
  },
  actionButtonText: {
    color: Theme.colors.textInverse,
    fontSize: Theme.typography.size.s14,
    fontWeight: Theme.typography.weight.semiBold,
  },
  aiMessageError: {
    color: Theme.colors.textError,
  },
  aiMessageSuccess: {
    color: Theme.colors.textSuccess,
  },
});
