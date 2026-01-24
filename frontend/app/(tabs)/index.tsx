import * as React from 'react';
import { Image } from 'expo-image';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Text } from '@/components/base-text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { Theme } from '@/constants/theme';
import {
  getSession,
  setGuestMode,
  setSession,
  subscribeSession,
  type AuthSession,
} from '@/lib/session';
import { PetCard } from '@/components/pet-card';
import type { PetCardData } from '@/types/pet';

type UserType = 'INDIVIDUAL' | 'INSTITUTION';

type GeneratePetsResponse = {
  requested: number;
  parsed: number;
  created: number;
  skipped: number;
  skippedReasons?: string[];
  rawResponse?: string;
};

type UserProfile = {
  id: number;
  name: string;
  userType: UserType | null;
  pets: PetCardData[];
};

type AdoptionSummary = {
  id: string;
  pet: PetCardData;
  status: 'APPLY' | 'SCREENING' | 'TRIAL' | 'ADOPTED';
  adoptedAt?: number | null;
};

type AuthStep = 'landing' | 'phone' | 'code' | 'nickname' | 'institution' | 'wechat';

const CODE_LENGTH = 4;
const CODE_RESEND_SECONDS = 30;
const createEmptyCode = () => Array.from({ length: CODE_LENGTH }, () => '');

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
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = React.useState(false);
  const [profileError, setProfileError] = React.useState<string | null>(null);
  const [adoptions, setAdoptions] = React.useState<AdoptionSummary[]>([]);
  const [adoptionLoading, setAdoptionLoading] = React.useState(false);
  const [adoptionError, setAdoptionError] = React.useState<string | null>(null);
  const [authStep, setAuthStep] = React.useState<AuthStep>('landing');
  const [phone, setPhone] = React.useState('');
  const [codeDigits, setCodeDigits] = React.useState<string[]>(() => createEmptyCode());
  const [nickname, setNickname] = React.useState('');
  const [institutionCode, setInstitutionCode] = React.useState('');
  const [focusedCodeIndex, setFocusedCodeIndex] = React.useState<number | null>(null);
  const [resendCountdown, setResendCountdown] = React.useState(CODE_RESEND_SECONDS);
  const lastCodeAttempt = React.useRef<string | null>(null);
  const codeInputRefs = React.useRef<Array<TextInput | null>>([]);
  const wechatLoginAttempt = React.useRef(0);
  const [aiStatus, setAiStatus] = React.useState<'idle' | 'generating' | 'success' | 'error'>(
    'idle'
  );
  const [aiMessage, setAiMessage] = React.useState<string | null>(null);
  const isGenerating = aiStatus === 'generating';
  const phoneDigits = phone.replace(/\D/g, '');
  const codeValue = codeDigits.join('');
  const isPhoneReady = phoneDigits.length === 11;
  const canSubmitNickname = nickname.trim().length > 0;
  const canSubmitInstitutionCode = institutionCode.trim().length > 0;
  const formattedPhone = phoneDigits ? `+86 ${phoneDigits}` : '+86';

  React.useEffect(() => {
    const unsubscribe = subscribeSession((nextSession) => {
      setSessionState(nextSession);
    });
    return unsubscribe;
  }, []);

  React.useEffect(() => {
    if (!session?.user?.id) {
      setUserProfile(null);
      setProfileError(null);
      setProfileLoading(false);
      return;
    }
    let active = true;
    setProfileLoading(true);
    setProfileError(null);
    fetch(`${API_BASE_URL}/api/users/${session.user.id}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('获取用户信息失败');
        }
        return response.json() as Promise<UserProfile>;
      })
      .then((data) => {
        if (active) {
          setUserProfile(data);
        }
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : '';
        if (active) {
          setProfileError(ensureChinese(message, '获取用户信息失败'));
        }
      })
      .finally(() => {
        if (active) {
          setProfileLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [session?.user?.id]);

  React.useEffect(() => {
    if (!session?.token) {
      setAdoptions([]);
      setAdoptionError(null);
      setAdoptionLoading(false);
      return;
    }
    let active = true;
    setAdoptionLoading(true);
    setAdoptionError(null);
    fetch(`${API_BASE_URL}/api/adoptions`, {
      headers: {
        Authorization: `Bearer ${session.token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('获取领养信息失败');
        }
        return response.json() as Promise<AdoptionSummary[]>;
      })
      .then((data) => {
        if (active) {
          setAdoptions(Array.isArray(data) ? data : []);
        }
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : '';
        if (active) {
          setAdoptionError(ensureChinese(message, '获取领养信息失败'));
        }
      })
      .finally(() => {
        if (active) {
          setAdoptionLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [session?.token]);

  React.useEffect(() => {
    if (session) {
      return;
    }
    setAuthStep('landing');
    setPhone('');
    setCodeDigits(createEmptyCode());
    setNickname('');
    setInstitutionCode('');
    setFocusedCodeIndex(null);
    setResendCountdown(CODE_RESEND_SECONDS);
    lastCodeAttempt.current = null;
  }, [session]);

  React.useEffect(() => {
    if (authStep !== 'code') {
      return;
    }
    setResendCountdown(CODE_RESEND_SECONDS);
    lastCodeAttempt.current = null;
    setFocusedCodeIndex(0);
    const timer = setTimeout(() => {
      codeInputRefs.current[0]?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, [authStep]);

  React.useEffect(() => {
    if (authStep !== 'code') {
      return;
    }
    if (resendCountdown <= 0) {
      return;
    }
    const timer = setTimeout(() => {
      setResendCountdown((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearTimeout(timer);
  }, [authStep, resendCountdown]);

  React.useEffect(() => {
    if (authStep !== 'code') {
      return;
    }
    if (codeValue.length !== CODE_LENGTH) {
      return;
    }
    if (loading) {
      return;
    }
    if (lastCodeAttempt.current === codeValue) {
      return;
    }
    lastCodeAttempt.current = codeValue;
    void attemptLogin(phoneDigits, codeValue);
  }, [authStep, codeValue, loading, phoneDigits]);

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

  const attemptLogin = async (phoneValue: string, code: string) => {
    if (!phoneValue || code.length !== CODE_LENGTH) {
      return;
    }
    setStatus(null);
    setLoading(true);
    try {
      const data = await request<AuthSession>('/api/auth/login', {
        email: phoneValue,
        password: code,
      });
      setSession(data);
      setStatus('已登录。');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setAuthStep('nickname');
        setStatus(null);
        return;
      }
      const message = error instanceof Error ? error.message : '';
      setStatus(ensureChinese(message, '验证码登录失败，请稍后重试。'));
    } finally {
      setLoading(false);
    }
  };

  const handleStartAuth = () => {
    setStatus(null);
    setGuestMode(false);
    setAuthStep('phone');
  };

  const handleWeChatLogin = () => {
    setStatus(null);
    setGuestMode(false);
    setAuthStep('wechat');
    setLoading(true);
    const attemptId = Date.now();
    wechatLoginAttempt.current = attemptId;
    setTimeout(async () => {
      if (wechatLoginAttempt.current !== attemptId) {
        return;
      }
      try {
        const data = await request<AuthSession>('/api/auth/wechat/mock', {});
        setSession(data);
        setStatus('已登录。');
      } catch (error) {
        const message = error instanceof Error ? error.message : '';
        setStatus(ensureChinese(message, '微信登录失败，请稍后再试。'));
        setAuthStep('landing');
      } finally {
        if (wechatLoginAttempt.current === attemptId) {
          setLoading(false);
        }
      }
    }, 900);
  };

  const handleInstitutionStart = () => {
    setStatus(null);
    setGuestMode(false);
    setAuthStep('institution');
  };

  const handleInstitutionLogin = () =>
    runAuthAction(async () => {
      const code = institutionCode.trim();
      if (!code) {
        throw new Error('请输入机构验证码');
      }
      setGuestMode(false);
      try {
        const data = await request<AuthSession>('/api/auth/institution', { code });
        setSession(data);
        setStatus('已登录。');
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          throw new Error('机构登录接口未部署，请重启后端。');
        }
        throw error;
      }
    });

  const handleRequestCode = () => {
    if (!isPhoneReady || loading) {
      return;
    }
    setStatus(null);
    setCodeDigits(createEmptyCode());
    setFocusedCodeIndex(0);
    setResendCountdown(CODE_RESEND_SECONDS);
    lastCodeAttempt.current = null;
    setAuthStep('code');
  };

  const handleGuestMode = () => {
    setStatus(null);
    setGuestMode(true);
    router.replace('/(tabs)/pets');
  };

  const handleBack = () => {
    setStatus(null);
    if (authStep === 'phone') {
      setAuthStep('landing');
      return;
    }
    if (authStep === 'wechat') {
      wechatLoginAttempt.current = 0;
      setLoading(false);
      setAuthStep('landing');
      return;
    }
    if (authStep === 'institution') {
      setAuthStep('landing');
      return;
    }
    if (authStep === 'code') {
      setAuthStep('phone');
      setCodeDigits(createEmptyCode());
      setFocusedCodeIndex(null);
      return;
    }
    if (authStep === 'nickname') {
      setAuthStep('code');
      setFocusedCodeIndex(null);
    }
  };

  const handlePhoneChange = (value: string) => {
    const sanitized = value.replace(/\D/g, '').slice(0, 11);
    setStatus(null);
    setPhone(sanitized);
  };

  const handleCodeChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    setStatus(null);
    setCodeDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < CODE_LENGTH - 1) {
      codeInputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyPress = (
    index: number,
    event: { nativeEvent: { key: string } }
  ) => {
    if (event.nativeEvent.key === 'Backspace' && !codeDigits[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendCode = () => {
    if (resendCountdown > 0) {
      return;
    }
    setStatus('验证码已重新发送。');
    setResendCountdown(CODE_RESEND_SECONDS);
    setCodeDigits(createEmptyCode());
    lastCodeAttempt.current = null;
    setFocusedCodeIndex(0);
    codeInputRefs.current[0]?.focus();
  };

  const handleNicknameChange = (value: string) => {
    setStatus(null);
    setNickname(value);
  };

  const handleNicknameRegister = () =>
    runAuthAction(async () => {
      const trimmedName = nickname.trim();
      const data = await request<AuthSession>('/api/auth/register', {
        name: trimmedName,
        email: phoneDigits,
        password: codeValue,
        userType: 'INDIVIDUAL',
      });
      setSession(data);
      setStatus('注册并已登录。');
    });

  const handleLogout = () =>
    runAuthAction(async () => {
      if (!session) {
        return;
      }
      await request('/api/auth/logout', { token: session.token });
      setSession(null);
      setGuestMode(false);
      setUserProfile(null);
      setStatus('已退出登录。');
    });

  const handleGenerateCards = async () => {
    if (isGenerating) {
      return;
    }
    if (!session?.token) {
      setAiStatus('error');
      setAiMessage('请先登录后再生成。');
      return;
    }
    setAiStatus('generating');
    setAiMessage(null);

    try {
      const data = await request<GeneratePetsResponse>('/api/pets/generate', {}, {
        token: session.token,
      });
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

  const displayName = userProfile?.name ?? session?.user.name ?? '游客';
  const resolvedUserType = userProfile?.userType ?? session?.user.userType ?? null;
  const userTypeLabel = session
    ? resolvedUserType === 'INSTITUTION'
      ? '机构用户 (VIP)'
      : '普通用户'
    : '未登录';

  const renderAuthHeader = () => {
    if (authStep === 'nickname') {
      return (
        <View style={styles.nicknameHeader}>
          <Text style={styles.nicknameTitle}>起一个昵称吧!</Text>
          <FontAwesome5
            name="paw"
            size={Theme.sizes.s18}
            color={Theme.colors.textWarmStrong}
          />
        </View>
      );
    }

    return (
      <View style={styles.brandBlock}>
        <Image
          source={require('@/assets/images/logo.png')}
          style={styles.brandLogo}
          contentFit="contain"
        />
        <Text style={styles.brandText}>Pawzzle 寻爪</Text>
      </View>
    );
  };

  const renderAuthContent = () => {
    if (authStep === 'landing') {
      return (
        <View style={styles.authStack}>
          <Pressable
            onPress={handleStartAuth}
            style={({ pressed }) => [
              styles.authButton,
              styles.authButtonPrimary,
              pressed && styles.authButtonPressed,
            ]}>
            <Text style={styles.authButtonText}>验证码登录</Text>
          </Pressable>
          <Pressable
            onPress={handleWeChatLogin}
            style={({ pressed }) => [
              styles.authButton,
              styles.authButtonWeChat,
              pressed && styles.authButtonPressed,
            ]}>
            <Text style={styles.authButtonText}>微信授权登录</Text>
          </Pressable>
          <Pressable
            onPress={handleInstitutionStart}
            style={({ pressed }) => [
              styles.authButton,
              styles.authButtonInstitution,
              pressed && styles.authButtonPressed,
            ]}>
            <Text style={[styles.authButtonText, styles.authButtonTextInverse]}>
              机构授权登录
            </Text>
          </Pressable>
          <Pressable onPress={handleGuestMode} style={styles.guestLink}>
            <Text style={styles.guestText}>游客模式</Text>
          </Pressable>
          <Text style={styles.registerHint}>未注册用户登陆后自动注册</Text>
          <View style={styles.agreementRow}>
            <View style={styles.agreementDot} />
            <Text style={styles.agreementText}>
              登录即代表你已阅读并同意
              <Text style={styles.agreementLink}>《隐私政策》</Text>和
              <Text style={styles.agreementLink}>《用户协议》</Text>
            </Text>
          </View>
          {status ? <Text style={styles.authStatus}>{status}</Text> : null}
        </View>
      );
    }

    if (authStep === 'phone') {
      return (
        <View style={styles.authStack}>
          <View style={styles.phoneInput}>
            <Text style={styles.phonePrefix}>+86</Text>
            <TextInput
              value={phoneDigits}
              onChangeText={handlePhoneChange}
              placeholder="请输入手机号"
              placeholderTextColor={Theme.colors.textPlaceholder}
              keyboardType="number-pad"
              maxLength={11}
              style={styles.phoneInputField}
            />
          </View>
          <Pressable
            onPress={handleRequestCode}
            disabled={!isPhoneReady || loading}
            style={({ pressed }) => [
              styles.ctaButton,
              (!isPhoneReady || loading) && styles.ctaButtonDisabled,
              pressed && isPhoneReady && !loading && styles.ctaButtonPressed,
            ]}>
            <Text
              style={[
                styles.ctaButtonText,
                (!isPhoneReady || loading) && styles.ctaButtonTextDisabled,
              ]}>
              获取手机验证码
            </Text>
          </Pressable>
          {status ? <Text style={styles.authStatus}>{status}</Text> : null}
        </View>
      );
    }

    if (authStep === 'code') {
      return (
        <View style={styles.authStack}>
          <Text style={styles.codeHint}>验证码已发送至 {formattedPhone}</Text>
          <View style={styles.codeRow}>
            {codeDigits.map((digit, index) => (
              <TextInput
                key={`code-${index}`}
                ref={(ref) => {
                  codeInputRefs.current[index] = ref;
                }}
                value={digit}
                onChangeText={(value) => handleCodeChange(index, value)}
                onKeyPress={(event) => handleCodeKeyPress(index, event)}
                onFocus={() => setFocusedCodeIndex(index)}
                onBlur={() =>
                  setFocusedCodeIndex((prev) => (prev === index ? null : prev))
                }
                keyboardType="number-pad"
                maxLength={1}
                style={[
                  styles.codeBox,
                  digit && styles.codeBoxFilled,
                  focusedCodeIndex === index && styles.codeBoxFocused,
                ]}
              />
            ))}
          </View>
          <View style={styles.codeFooter}>
            <Text style={styles.codeFooterLink}>没有收到验证码？</Text>
            <Pressable onPress={handleResendCode} disabled={resendCountdown > 0}>
              <Text
                style={[
                  styles.codeFooterHint,
                  resendCountdown > 0 && styles.codeFooterHintDisabled,
                ]}>
                {resendCountdown > 0
                  ? `${resendCountdown}秒后可重新获取`
                  : '重新获取验证码'}
              </Text>
            </Pressable>
          </View>
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={Theme.colors.textWarmStrong} />
              <Text style={styles.loadingText}>正在验证...</Text>
            </View>
          ) : null}
          {status ? <Text style={styles.authStatus}>{status}</Text> : null}
        </View>
      );
    }

    if (authStep === 'wechat') {
      return (
        <View style={styles.authStack}>
          <View style={styles.wechatCard}>
            <FontAwesome5 name="shield-alt" size={Theme.sizes.s28} color={Theme.colors.text} />
            <Text style={styles.wechatTitle}>微信安全验证</Text>
            <Text style={styles.wechatHint}>正在验证登录，请稍候...</Text>
            <ActivityIndicator size="small" color={Theme.colors.textSecondary} />
          </View>
          {status ? <Text style={styles.authStatus}>{status}</Text> : null}
        </View>
      );
    }

    if (authStep === 'institution') {
      return (
        <View style={styles.authStack}>
          <Text style={styles.institutionHint}>请输入机构验证码完成登录。</Text>
          <TextInput
            value={institutionCode}
            onChangeText={(value) => {
              setStatus(null);
              setInstitutionCode(value);
            }}
            placeholder="例如：A92731"
            placeholderTextColor={Theme.colors.textPlaceholder}
            style={styles.institutionInput}
          />
          <Pressable
            onPress={handleInstitutionLogin}
            disabled={!canSubmitInstitutionCode || loading}
            style={({ pressed }) => [
              styles.ctaButton,
              (!canSubmitInstitutionCode || loading) && styles.ctaButtonDisabled,
              pressed && canSubmitInstitutionCode && !loading && styles.ctaButtonPressed,
            ]}>
            <Text
              style={[
                styles.ctaButtonText,
                (!canSubmitInstitutionCode || loading) && styles.ctaButtonTextDisabled,
              ]}>
              机构验证码登录
            </Text>
          </Pressable>
          <Text style={styles.institutionTip}></Text>
          {status ? <Text style={styles.authStatus}>{status}</Text> : null}
        </View>
      );
    }

    return (
      <View style={styles.authStack}>
        <TextInput
          value={nickname}
          onChangeText={handleNicknameChange}
          placeholder="请输入昵称，如：白鲤鱼"
          placeholderTextColor={Theme.colors.textPlaceholder}
          style={styles.nicknameInput}
        />
        <Pressable
          onPress={handleNicknameRegister}
          disabled={!canSubmitNickname || loading}
          style={({ pressed }) => [
            styles.ctaButton,
            (!canSubmitNickname || loading) && styles.ctaButtonDisabled,
            pressed && canSubmitNickname && !loading && styles.ctaButtonPressed,
          ]}>
          <Text
            style={[
              styles.ctaButtonText,
              (!canSubmitNickname || loading) && styles.ctaButtonTextDisabled,
            ]}>
            继续
          </Text>
        </Pressable>
        {status ? <Text style={styles.authStatus}>{status}</Text> : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.background}>
        {session ? (
          <>
            <View style={[styles.blob, styles.blobTop]} />
            <View style={[styles.blob, styles.blobSide]} />
            <View style={[styles.blob, styles.blobBottom]} />
          </>
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
          <>
            <View style={styles.header}>
              <Text style={styles.overline}>首页</Text>
              <Text style={styles.title}>我的空间</Text>
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
                  <Image source={require('@/assets/images/logo.png')} style={styles.avatar} />
                </Pressable>
                <Text style={styles.name}>{displayName}</Text>
                <Text style={styles.nicknameLabel}>状态</Text>
                <View style={styles.nicknamePill}>
                  <Text style={styles.nicknameText}>已登录</Text>
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

              <View style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>我的领养</Text>
                  <Text style={styles.sectionSubtitle}>{adoptions.length} 只</Text>
                </View>
                {adoptionLoading ? <ActivityIndicator size="small" /> : null}
                {adoptionError ? <Text style={styles.errorText}>{adoptionError}</Text> : null}
                {!adoptionLoading && !adoptionError && adoptions.length ? (
                  <View style={styles.adoptionList}>
                    {adoptions.map((adoption) => (
                      <View key={adoption.id} style={styles.adoptionItem}>
                        <PetCard pet={adoption.pet} />
                        <View style={styles.adoptionMetaRow}>
                          <Text style={styles.adoptionMetaLabel}>当前阶段</Text>
                          <View style={styles.adoptionMetaPill}>
                            <Text style={styles.adoptionMetaText}>
                              {getAdoptionStageLabel(adoption)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : null}
                {!adoptionLoading && !adoptionError && !adoptions.length ? (
                  <Text style={styles.emptyText}>暂无领养记录。</Text>
                ) : null}
              </View>

              <View style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>我的宠物卡片</Text>
                  <Text style={styles.sectionSubtitle}>
                    {userProfile?.pets?.length ?? 0} 张
                  </Text>
                </View>
                {profileLoading ? <ActivityIndicator size="small" /> : null}
                {profileError ? <Text style={styles.errorText}>{profileError}</Text> : null}
                {!profileLoading && !profileError && userProfile?.pets?.length ? (
                  <View style={styles.petsList}>
                    {userProfile.pets.map((pet) => (
                      <PetCard key={pet.id} pet={pet} />
                    ))}
                  </View>
                ) : null}
                {!profileLoading && !profileError && !userProfile?.pets?.length ? (
                  <Text style={styles.emptyText}>暂无发布的宠物卡片。</Text>
                ) : null}
              </View>

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

              <View style={styles.formCard}>
                <Text style={styles.formTitle}>账户管理</Text>
                <Text style={styles.formSubtitle}>如需退出登录，可在此设备操作。</Text>
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
            </ScrollView>
            {resolvedUserType === 'INSTITUTION' ? (
              <Pressable
                onPress={() => router.push('/pet/rehome/upload')}
                style={({ pressed }) => [
                  styles.institutionFab,
                  pressed && styles.institutionFabPressed,
                ]}>
                <FontAwesome5 name="plus" size={Theme.sizes.s24} color={Theme.colors.textInverse} />
              </Pressable>
            ) : null}
          </>
        ) : (
          <ScrollView
            contentContainerStyle={styles.authContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {authStep !== 'landing' ? (
              <Pressable onPress={handleBack} style={styles.backButton}>
                <Text style={styles.backText}>返回</Text>
              </Pressable>
            ) : null}
            {renderAuthHeader()}
            {renderAuthContent()}
          </ScrollView>
        )}
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

const ADOPTION_DAY_MS = 24 * 60 * 60 * 1000;

function getAdoptionStageLabel(adoption: AdoptionSummary) {
  switch (adoption.status) {
    case 'APPLY':
      return '申请中';
    case 'SCREENING':
      return '审核中';
    case 'TRIAL':
      return formatAdoptionDay(adoption.adoptedAt, '试养');
    case 'ADOPTED':
      return formatAdoptionDay(adoption.adoptedAt, '领养');
    default:
      return adoption.status;
  }
}

function formatAdoptionDay(adoptedAt: number | null | undefined, prefix: string) {
  if (!adoptedAt) {
    return `${prefix}中`;
  }
  const days = Math.max(1, Math.floor((Date.now() - adoptedAt) / ADOPTION_DAY_MS) + 1);
  return `${prefix}第${days}天`;
}

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T = unknown>(
  path: string,
  payload?: Record<string, unknown>,
  options?: { token?: string }
) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (options?.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers,
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
    throw new ApiError(ensureChinese(message, '请求失败'), response.status);
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
  authGlow: {
    position: 'absolute',
    width: Theme.sizes.s250,
    height: Theme.sizes.s250,
    borderRadius: Theme.radius.pill,
    opacity: Theme.opacity.o65,
  },
  authGlowTop: {
    top: -Theme.sizes.s100,
    left: -Theme.sizes.s60,
    backgroundColor: Theme.colors.decorativePeachSoft,
  },
  authGlowBottom: {
    bottom: -Theme.sizes.s120,
    right: -Theme.sizes.s70,
    backgroundColor: Theme.colors.decorativePeachAlt,
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
    fontFamily: Theme.fonts.semiBold,
    color: Theme.colors.text,
  },
  content: {
    paddingHorizontal: Theme.spacing.s20,
    paddingBottom: Theme.sizes.s140,
    gap: Theme.spacing.s16,
  },
  authContent: {
    flexGrow: Theme.layout.full,
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.s24,
    paddingTop: Theme.spacing.s40,
    paddingBottom: Theme.spacing.s40,
    gap: Theme.spacing.s24,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: Theme.spacing.s6,
    paddingHorizontal: Theme.spacing.s8,
  },
  backText: {
    fontSize: Theme.typography.size.s13,
    color: Theme.colors.textWarm,
  },
  brandBlock: {
    alignItems: 'center',
    gap: Theme.spacing.s10,
  },
  brandLogo: {
    width: Theme.sizes.s140,
    height: Theme.sizes.s140,
  },
  brandText: {
    fontSize: Theme.typography.size.s24,
    fontFamily: Theme.fonts.brand,
    color: Theme.colors.textWarmStrong,
  },
  authStack: {
    width: Theme.percent.p100,
    alignItems: 'center',
    gap: Theme.spacing.s14,
  },
  authButton: {
    width: Theme.percent.p80,
    minHeight: Theme.sizes.s50,
    borderRadius: Theme.radius.pill,
    borderWidth: Theme.borderWidth.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authButtonPrimary: {
    backgroundColor: Theme.colors.ctaBackground,
    borderColor: Theme.colors.ctaBorder,
  },
  authButtonWeChat: {
    backgroundColor: Theme.colors.successSurface,
    borderColor: Theme.colors.successBorder,
  },
  authButtonInstitution: {
    backgroundColor: Theme.colors.textWarmStrong,
    borderColor: Theme.colors.textWarmStrong,
  },
  authButtonPressed: {
    transform: [{ scale: Theme.scale.pressedSoft }],
  },
  authButtonText: {
    fontSize: Theme.typography.size.s14,
    fontFamily: Theme.fonts.semiBold,
    color: Theme.colors.textWarmStrong,
  },
  authButtonTextInverse: {
    color: Theme.colors.textInverse,
  },
  guestLink: {
    paddingVertical: Theme.spacing.s4,
  },
  guestText: {
    fontSize: Theme.typography.size.s13,
    color: Theme.colors.textMuted,
  },
  registerHint: {
    fontSize: Theme.typography.size.s12,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
  },
  agreementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: Theme.percent.p80,
    gap: Theme.spacing.s6,
  },
  agreementDot: {
    width: Theme.spacing.s12,
    height: Theme.spacing.s12,
    borderRadius: Theme.radius.r6,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderMuted,
    marginTop: Theme.spacing.s2,
  },
  agreementText: {
    flex: Theme.layout.full,
    fontSize: Theme.typography.size.s11,
    color: Theme.colors.textSecondary,
    lineHeight: Theme.typography.lineHeight.s16,
  },
  agreementLink: {
    color: Theme.colors.textLink,
  },
  authStatus: {
    marginTop: Theme.spacing.s6,
    fontSize: Theme.typography.size.s12,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
  },
  phoneInput: {
    flexDirection: 'row',
    alignItems: 'center',
    width: Theme.percent.p80,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarmStrong,
    borderRadius: Theme.radius.pill,
    backgroundColor: Theme.colors.overlayStrong,
    minHeight: Theme.sizes.s50,
  },
  phonePrefix: {
    paddingHorizontal: Theme.spacing.s12,
    fontSize: Theme.typography.size.s13,
    color: Theme.colors.textMuted,
    borderRightWidth: Theme.borderWidth.hairline,
    borderRightColor: Theme.colors.borderWarmStrong,
  },
  phoneInputField: {
    flex: Theme.layout.full,
    paddingHorizontal: Theme.spacing.s12,
    fontSize: Theme.typography.size.s14,
    color: Theme.colors.textWarmStrong,
  },
  ctaButton: {
    width: Theme.percent.p80,
    paddingVertical: Theme.spacing.s12,
    borderRadius: Theme.radius.pill,
    alignItems: 'center',
    backgroundColor: Theme.colors.ctaBackground,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.ctaBorder,
  },
  ctaButtonDisabled: {
    backgroundColor: Theme.colors.borderWarmAlt,
    borderColor: Theme.colors.borderWarmAlt,
  },
  ctaButtonPressed: {
    transform: [{ scale: Theme.scale.pressedSoft }],
  },
  ctaButtonText: {
    fontSize: Theme.typography.size.s14,
    fontFamily: Theme.fonts.semiBold,
    color: Theme.colors.textWarmStrong,
  },
  ctaButtonTextDisabled: {
    color: Theme.colors.textSecondary,
  },
  codeHint: {
    fontSize: Theme.typography.size.s12,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Theme.spacing.s12,
  },
  codeBox: {
    width: Theme.sizes.s56,
    height: Theme.sizes.s56,
    borderRadius: Theme.radius.r18,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarmStrong,
    backgroundColor: Theme.colors.overlayStrong,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: Theme.typography.size.s20,
    color: Theme.colors.textWarmStrong,
  },
  codeBoxFilled: {
    borderColor: Theme.colors.primary,
  },
  codeBoxFocused: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.card,
  },
  codeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: Theme.percent.p80,
    marginTop: Theme.spacing.s6,
  },
  codeFooterLink: {
    fontSize: Theme.typography.size.s12,
    color: Theme.colors.textLink,
  },
  codeFooterHint: {
    fontSize: Theme.typography.size.s12,
    color: Theme.colors.textSecondary,
  },
  codeFooterHintDisabled: {
    color: Theme.colors.textPlaceholder,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.s8,
  },
  loadingText: {
    fontSize: Theme.typography.size.s12,
    color: Theme.colors.textWarmStrong,
  },
  nicknameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Theme.spacing.s8,
  },
  nicknameTitle: {
    fontSize: Theme.typography.size.s24,
    fontFamily: Theme.fonts.semiBold,
    color: Theme.colors.textWarmStrong,
  },
  nicknameInput: {
    width: Theme.percent.p80,
    minHeight: Theme.sizes.s50,
    borderRadius: Theme.radius.pill,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarmStrong,
    backgroundColor: Theme.colors.overlayStrong,
    paddingHorizontal: Theme.spacing.s16,
    fontSize: Theme.typography.size.s14,
    color: Theme.colors.textWarmStrong,
  },
  wechatCard: {
    width: Theme.percent.p80,
    borderRadius: Theme.radius.r18,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarmStrong,
    backgroundColor: Theme.colors.cardTranslucentSoft,
    paddingVertical: Theme.spacing.s20,
    paddingHorizontal: Theme.spacing.s16,
    alignItems: 'center',
    gap: Theme.spacing.s10,
  },
  wechatTitle: {
    fontSize: Theme.typography.size.s16,
    fontFamily: Theme.fonts.semiBold,
    color: Theme.colors.text,
  },
  wechatHint: {
    fontSize: Theme.typography.size.s12,
    color: Theme.colors.textSecondary,
  },
  institutionHint: {
    fontSize: Theme.typography.size.s14,
    color: Theme.colors.textSecondary,
  },
  institutionInput: {
    width: Theme.percent.p80,
    minHeight: Theme.sizes.s50,
    borderRadius: Theme.radius.pill,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarmStrong,
    backgroundColor: Theme.colors.overlayStrong,
    paddingHorizontal: Theme.spacing.s16,
    fontSize: Theme.typography.size.s14,
    color: Theme.colors.textWarmStrong,
  },
  institutionTip: {
    fontSize: Theme.typography.size.s12,
    color: Theme.colors.textSecondary,
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
    fontFamily: Theme.fonts.semiBold,
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
    fontFamily: Theme.fonts.semiBold,
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
    fontFamily: Theme.fonts.semiBold,
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
  sectionCard: {
    padding: Theme.spacing.s18,
    backgroundColor: Theme.colors.cardTranslucentSoft,
    borderRadius: Theme.radius.r20,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarm,
    gap: Theme.spacing.s12,
    ...Theme.shadows.cardSoftLarge,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: Theme.typography.size.s16,
    fontFamily: Theme.fonts.semiBold,
    color: Theme.colors.text,
  },
  sectionSubtitle: {
    fontSize: Theme.typography.size.s12,
    color: Theme.colors.textSecondary,
  },
  adoptionList: {
    gap: Theme.spacing.s16,
  },
  adoptionItem: {
    gap: Theme.spacing.s10,
  },
  adoptionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.s8,
  },
  adoptionMetaLabel: {
    fontSize: Theme.typography.size.s12,
    color: Theme.colors.textSecondary,
  },
  adoptionMetaPill: {
    paddingHorizontal: Theme.spacing.s10,
    paddingVertical: Theme.spacing.s2,
    borderRadius: Theme.radius.pill,
    backgroundColor: Theme.colors.surfaceWarm,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarmSoft,
  },
  adoptionMetaText: {
    fontSize: Theme.typography.size.s12,
    color: Theme.colors.textWarm,
    fontFamily: Theme.fonts.semiBold,
  },
  petsList: {
    gap: Theme.spacing.s12,
  },
  emptyText: {
    fontSize: Theme.typography.size.s13,
    color: Theme.colors.textSecondary,
  },
  errorText: {
    fontSize: Theme.typography.size.s13,
    color: Theme.colors.textError,
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
    fontFamily: Theme.fonts.semiBold,
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
    fontFamily: Theme.fonts.semiBold,
  },
  institutionFab: {
    position: 'absolute',
    right: Theme.spacing.s20,
    bottom: Theme.sizes.s120,
    width: Theme.sizes.s56,
    height: Theme.sizes.s56,
    borderRadius: Theme.sizes.s56 / 2,
    backgroundColor: Theme.colors.successDeep,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.successDeep,
    ...Theme.shadows.card,
  },
  institutionFabPressed: {
    transform: [{ scale: Theme.scale.pressedSoft }],
  },
  aiMessageError: {
    color: Theme.colors.textError,
  },
  aiMessageSuccess: {
    color: Theme.colors.textSuccess,
  },
});
