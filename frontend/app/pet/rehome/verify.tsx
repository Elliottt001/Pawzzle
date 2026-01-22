import * as React from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Theme } from '../../../constants/theme';

const BREED_VALUE = '猫（英国短毛猫）';

export default function PetRehomeVerifyScreen() {
  const router = useRouter();
  const [name, setName] = React.useState('');
  const [age, setAge] = React.useState('');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>宠物信息确认</Text>
          <Text style={styles.subtitle}>已根据照片自动填充识别信息。</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>识别信息</Text>
          <View style={styles.field}>
            <Text style={styles.label}>品种</Text>
            <View style={styles.readonlyField}>
              <Text style={styles.readonlyValue}>{BREED_VALUE}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>确认信息</Text>
          <View style={styles.field}>
            <Text style={styles.label}>名字</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="请输入名字"
              placeholderTextColor={Theme.colors.placeholder}
              style={styles.input}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>年龄</Text>
            <TextInput
              value={age}
              onChangeText={setAge}
              placeholder="请输入年龄"
              placeholderTextColor={Theme.colors.placeholder}
              style={styles.input}
              keyboardType="number-pad"
            />
          </View>
        </View>

        <Pressable
          onPress={() => router.push('/agent/chat')}
          style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}>
          <Text style={styles.actionButtonText}>生成卡片并连接顾问</Text>
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
  card: {
    backgroundColor: Theme.colors.cardTranslucentSoft,
    borderRadius: Theme.layout.radius,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarm,
    padding: Theme.spacing.m,
    gap: Theme.spacing.m,
  },
  sectionTitle: {
    color: Theme.colors.text,
    fontSize: Theme.typography.size.s16,
    fontWeight: Theme.typography.weight.semiBold,
  },
  field: {
    gap: Theme.spacing.s,
  },
  label: {
    color: Theme.colors.textSubtle,
    fontSize: Theme.typography.size.s13,
    fontWeight: Theme.typography.weight.semiBold,
  },
  readonlyField: {
    paddingVertical: Theme.spacing.s,
    paddingHorizontal: Theme.spacing.m,
    borderRadius: Theme.layout.radius,
    backgroundColor: Theme.colors.surfaceNeutral,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderNeutral,
  },
  readonlyValue: {
    color: Theme.colors.text,
    fontSize: Theme.typography.size.s14,
  },
  input: {
    minHeight: Theme.sizes.s44,
    paddingVertical: Theme.spacing.s,
    paddingHorizontal: Theme.spacing.m,
    borderRadius: Theme.layout.radius,
    backgroundColor: Theme.colors.card,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarmAlt,
    color: Theme.colors.text,
    fontSize: Theme.typography.size.s14,
  },
  actionButton: {
    backgroundColor: Theme.colors.successDeep,
    paddingVertical: Theme.spacing.m,
    borderRadius: Theme.layout.radius,
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
