import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Theme } from '@/constants/theme';

export default function ModalScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <ThemedText type="title">这是一个弹窗</ThemedText>
        <Link href="/" dismissTo style={styles.link}>
          <ThemedText type="link">返回首页</ThemedText>
        </Link>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: Theme.layout.full,
    backgroundColor: Theme.colors.background,
  },
  container: {
    flex: Theme.layout.full,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Theme.spacing.s20,
  },
  link: {
    marginTop: Theme.spacing.s15,
    paddingVertical: Theme.spacing.s15,
  },
});
