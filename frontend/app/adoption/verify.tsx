import * as React from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Theme } from '../../constants/theme';

export default function AdoptionVerifyScreen() {
  const router = useRouter();
  const [income, setIncome] = React.useState('月收入 12,000 元');
  const [housing, setHousing] = React.useState('自有公寓（带阳台）');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>领养审核</Text>
          <Text style={styles.subtitle}>签署前请确认信息。</Text>
        </View>

        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            AI 已根据聊天记录自动填写。
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.label}>收入</Text>
            <TextInput
              value={income}
              onChangeText={setIncome}
              style={styles.input}
              placeholder="请输入收入"
              placeholderTextColor={Theme.colors.placeholder}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>居住情况</Text>
            <TextInput
              value={housing}
              onChangeText={setHousing}
              style={styles.input}
              placeholder="请输入居住情况"
              placeholderTextColor={Theme.colors.placeholder}
            />
          </View>
        </View>

        <Pressable
          onPress={() => router.push('/adoption/agreement')}
          style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}>
          <Text style={styles.actionButtonText}>确认并签署</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: Theme.layout.full,
    backgroundColor: Theme.colors.background,
  },
  content: {
    padding: Theme.spacing.l,
    gap: Theme.spacing.l,
  },
  header: {
    gap: Theme.spacing.s,
  },
  title: {
    color: Theme.colors.text,
    fontSize: Theme.typography.size.s22,
    fontWeight: Theme.typography.weight.semiBold,
  },
  subtitle: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.size.s14,
  },
  notice: {
    backgroundColor: Theme.colors.surfaceNeutral,
    borderRadius: Theme.layout.radius,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderNeutral,
    padding: Theme.spacing.m,
  },
  noticeText: {
    color: Theme.colors.textSubtle,
    fontSize: Theme.typography.size.s13,
  },
  card: {
    backgroundColor: Theme.colors.cardTranslucentSoft,
    borderRadius: Theme.layout.radius,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarm,
    padding: Theme.spacing.m,
    gap: Theme.spacing.m,
  },
  field: {
    gap: Theme.spacing.s,
  },
  label: {
    color: Theme.colors.textSubtle,
    fontSize: Theme.typography.size.s13,
    fontWeight: Theme.typography.weight.semiBold,
  },
  input: {
    minHeight: Theme.sizes.s44,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarmAlt,
    borderRadius: Theme.layout.radius,
    backgroundColor: Theme.colors.card,
    paddingHorizontal: Theme.spacing.m,
    paddingVertical: Theme.spacing.s,
    fontSize: Theme.typography.size.s14,
    color: Theme.colors.text,
  },
  actionButton: {
    backgroundColor: Theme.colors.successDeep,
    borderRadius: Theme.layout.radius,
    paddingVertical: Theme.spacing.m,
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
});
