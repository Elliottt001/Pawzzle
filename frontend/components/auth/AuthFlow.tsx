import * as React from 'react';
import {
  ActivityIndicator,
  Pressable,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image'; // Check if used
import { Text } from '@/components/base-text';
import { FontAwesome5 } from '@expo/vector-icons';
import { Theme } from '@/constants/theme';
import { setSession, setGuestMode, type AuthSession } from '@/lib/session';
import { request, ApiError } from '@/lib/api-client';
import { ensureChinese } from '@/utils/text';
import { useRouter } from 'expo-router';
import { AuthStep } from '@/types/profile';
import { styles } from '@/app/(tabs)/_index.styles'; 

const CODE_LENGTH = 4;
const CODE_RESEND_SECONDS = 30;
const createEmptyCode = () => Array.from({ length: CODE_LENGTH }, () => '');

export function AuthFlow() {
  const router = useRouter();
  const [authStep, setAuthStep] = React.useState<AuthStep>('landing');
  const [status, setStatus] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  
  // Phone & Code State
  const [phone, setPhone] = React.useState('');
  const [codeDigits, setCodeDigits] = React.useState<string[]>(() => createEmptyCode());
  const [focusedCodeIndex, setFocusedCodeIndex] = React.useState<number | null>(null);
  const [resendCountdown, setResendCountdown] = React.useState(CODE_RESEND_SECONDS);
  const lastCodeAttempt = React.useRef<string | null>(null);
  const codeInputRefs = React.useRef<Array<TextInput | null>>([]);
  
  // Other Auth State
  const [nickname, setNickname] = React.useState('');
  const [institutionCode, setInstitutionCode] = React.useState('');
  const wechatLoginAttempt = React.useRef(0);

  // Derived
  const phoneDigits = phone.replace(/\D/g, '');
  const codeValue = codeDigits.join('');
  const isPhoneReady = phoneDigits.length === 11;
  const canSubmitNickname = nickname.trim().length > 0;
  const canSubmitInstitutionCode = institutionCode.trim().length > 0;
  const formattedPhone = phoneDigits ? `+86 ${phoneDigits}` : '+86';

  // Effects
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

  // Handlers
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

  // Render Helpers
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
    <>
      {authStep !== 'landing' ? (
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backText}>返回</Text>
        </Pressable>
      ) : null}
      {renderAuthHeader()}
      {renderAuthContent()}
    </>
  );
}
