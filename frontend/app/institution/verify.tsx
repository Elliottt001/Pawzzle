import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from '@/components/base-text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Theme } from '../../constants/theme';

export default function InstitutionVerifyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>机构基础认证</Text>
        <Text style={styles.subtitle}>请填写机构信息</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>机构名称</Text>
          <TextInput 
            style={styles.input} 
            placeholder="请输入机构名称" 
            placeholderTextColor={Theme.colors.textSecondary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>许可证编号</Text>
          <TextInput 
            style={styles.input} 
            placeholder="请输入许可证编号"
            placeholderTextColor={Theme.colors.textSecondary}
          />
        </View>

        <TouchableOpacity 
          style={styles.button} 
          onPress={() => router.push('/institution/dashboard')}
        >
          <Text style={styles.buttonText}>生成宠物卡片</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: Theme.layout.full,
    backgroundColor: Theme.colors.background,
  },
  content: {
    padding: Theme.spacing.m,
  },
  title: {
    fontSize: Theme.typography.size.s24,
    fontFamily: Theme.fonts.heavy,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.s,
  },
  subtitle: {
    fontSize: Theme.typography.size.s16,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.l,
  },
  inputGroup: {
    marginBottom: Theme.spacing.m,
  },
  label: {
    fontSize: Theme.typography.size.s14,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.s,
    fontFamily: Theme.fonts.semiBold,
  },
  input: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.layout.radius,
    padding: Theme.spacing.m,
    fontSize: Theme.typography.size.s16,
    color: Theme.colors.text,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.border,
  },
  button: {
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.layout.radius,
    padding: Theme.spacing.m,
    alignItems: 'center',
    marginTop: Theme.spacing.l,
  },
  buttonText: {
    color: Theme.colors.textInverse,
    fontSize: Theme.typography.size.s16,
    fontFamily: Theme.fonts.heavy,
  },
});
