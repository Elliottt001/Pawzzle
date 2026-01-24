import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/base-text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Theme } from '../../constants/theme';

export default function AdoptionAgreementScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>电子领养协议</Text>
      </View>

      <Pressable
        onPress={() => router.push('/(tabs)/index')}
        style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}>
        <Text style={styles.actionButtonText}>签署并完成</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: Theme.layout.full,
    backgroundColor: Theme.colors.background,
    justifyContent: 'space-between',
    padding: Theme.spacing.l,
  },
  content: {
    gap: Theme.spacing.m,
  },
  title: {
    color: Theme.colors.text,
    fontSize: Theme.typography.size.s22,
    fontFamily: Theme.fonts.semiBold,
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
    fontFamily: Theme.fonts.semiBold,
  },
});
