import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Theme } from '@/constants/theme';
import { setSession, type AuthSession } from '@/lib/session';
import { API_BASE_URL } from '@/lib/apiBase';

const ensureChinese = (message: string, fallback: string) =>
  /[\u4e00-\u9fff]/.test(message) ? message : fallback;

type UserType = 'INDIVIDUAL' | 'INSTITUTION';
type UserIntent = 'GIVER' | 'ADOPTER';

export default function RegisterScreen() {
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [userType, setUserType] = useState<UserType>('INDIVIDUAL');
  const [userIntent, setUserIntent] = useState<UserIntent>('ADOPTER');

  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('错误', '请填写所有字段');
      return;
    }

    setLoading(true);

    // Logic: If Institution, intent must be GIVER (handled by frontend logic mostly, but good to be explicit)
    const finalIntent = userType === 'INSTITUTION' ? 'GIVER' : userIntent;

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          userType,
          userIntent: finalIntent,
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as AuthSession;
        setSession(data);
        Alert.alert('成功', '账号已创建并已登录。');
        router.push('/(tabs)/index'); 
      } else {
        const errorData = await response.json().catch(() => ({}));
        const serverMessage = typeof errorData.message === 'string' ? errorData.message : '';
        Alert.alert('注册失败', ensureChinese(serverMessage, '出现问题，请稍后重试'));
      }
    } catch (error) {
      Alert.alert('错误', '网络请求失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scroll}>
        <ThemedView style={styles.container}>
          <ThemedText type="title" style={styles.title}>创建账号</ThemedText>

        <View style={styles.formGroup}>
          <ThemedText style={styles.label}>姓名</ThemedText>
          <TextInput 
            style={styles.input} 
            value={name} 
            onChangeText={setName} 
            placeholder="请输入姓名" 
            placeholderTextColor={Theme.colors.textPlaceholder}
          />
        </View>

        <View style={styles.formGroup}>
          <ThemedText style={styles.label}>邮箱</ThemedText>
          <TextInput 
            style={styles.input} 
            value={email} 
            onChangeText={setEmail} 
            placeholder="请输入邮箱" 
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={Theme.colors.textPlaceholder}
          />
        </View>

        <View style={styles.formGroup}>
          <ThemedText style={styles.label}>密码</ThemedText>
          <TextInput 
            style={styles.input} 
            value={password} 
            onChangeText={setPassword} 
            secureTextEntry 
            placeholder="请输入密码" 
            placeholderTextColor={Theme.colors.textPlaceholder}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.formGroup}>
          <ThemedText style={styles.label}>我是：</ThemedText>
          <View style={styles.radioGroup}>
            <TouchableOpacity 
              style={[styles.radioBtn, userType === 'INDIVIDUAL' && styles.radioBtnSelected]}
              onPress={() => setUserType('INDIVIDUAL')}
            >
              <ThemedText style={userType === 'INDIVIDUAL' ? styles.textSelected : styles.textUnselected}>个人</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.radioBtn, userType === 'INSTITUTION' && styles.radioBtnSelected]}
              onPress={() => setUserType('INSTITUTION')}
            >
              <ThemedText style={userType === 'INSTITUTION' ? styles.textSelected : styles.textUnselected}>机构</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {userType === 'INDIVIDUAL' && (
          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>我的目标是：</ThemedText>
            <View style={styles.radioGroup}>
              <TouchableOpacity 
                style={[styles.radioBtn, userIntent === 'ADOPTER' && styles.radioBtnSelected]}
                onPress={() => setUserIntent('ADOPTER')}
              >
                <ThemedText style={userIntent === 'ADOPTER' ? styles.textSelected : styles.textUnselected}>领养宠物</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.radioBtn, userIntent === 'GIVER' && styles.radioBtnSelected]}
                onPress={() => setUserIntent('GIVER')}
              >
                <ThemedText style={userIntent === 'GIVER' ? styles.textSelected : styles.textUnselected}>发布送养</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {userType === 'INSTITUTION' && (
           <ThemedText style={styles.hint}>
             提示：机构默认以送养方身份注册。
           </ThemedText>
        )}

        <TouchableOpacity 
          style={[styles.submitBtn, loading && styles.disabledBtn]} 
          onPress={handleRegister}
          disabled={loading}
        >
          <ThemedText style={styles.submitBtnText}>{loading ? '创建中...' : '注册'}</ThemedText>
        </TouchableOpacity>

        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: Theme.layout.full,
    backgroundColor: Theme.colors.background,
  },
  scroll: {
    flex: Theme.layout.full,
    backgroundColor: Theme.colors.background,
  },
  container: {
    padding: Theme.spacing.s24,
    flex: Theme.layout.full,
    minHeight: Theme.percent.p100,
  },
  title: {
    marginBottom: Theme.spacing.s32,
    marginTop: Theme.spacing.s40,
    fontSize: Theme.typography.size.s28,
  },
  formGroup: {
    marginBottom: Theme.spacing.s20,
  },
  label: {
    marginBottom: Theme.spacing.s8,
    fontFamily: Theme.fonts.semiBold,
  },
  input: {
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderMuted,
    borderRadius: Theme.radius.r8,
    padding: Theme.spacing.s12,
    fontSize: Theme.typography.size.s16,
    backgroundColor: Theme.colors.surfaceMuted,
  },
  divider: {
    height: Theme.borderWidth.hairline,
    backgroundColor: Theme.colors.borderDivider,
    marginVertical: Theme.spacing.s10,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: Theme.spacing.s12,
  },
  radioBtn: {
    flex: Theme.layout.full,
    paddingVertical: Theme.spacing.s12,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderMuted,
    borderRadius: Theme.radius.r8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioBtnSelected: {
    backgroundColor: Theme.colors.successAccent,
    borderColor: Theme.colors.successAccent,
  },
  textSelected: {
    color: Theme.colors.textInverse,
    fontFamily: Theme.fonts.heavy,
  },
  textUnselected: {
    color: Theme.colors.textStrong,
  },
  hint: {
    fontSize: Theme.typography.size.s13,
    color: Theme.colors.textHint,
    fontStyle: 'italic',
    marginBottom: Theme.spacing.s20,
  },
  submitBtn: {
    backgroundColor: Theme.colors.successDeepAlt,
    padding: Theme.spacing.s16,
    borderRadius: Theme.radius.r12,
    alignItems: 'center',
    marginTop: Theme.spacing.s20,
  },
  disabledBtn: {
    opacity: Theme.opacity.o7,
  },
  submitBtnText: {
    color: Theme.colors.textInverse,
    fontSize: Theme.typography.size.s18,
    fontFamily: Theme.fonts.heavy,
  },
});
