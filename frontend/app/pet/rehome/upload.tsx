import * as React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/base-text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Theme } from '../../../constants/theme';

const ANALYZE_DELAY_MS = 900;

export default function PetRehomeUploadScreen() {
  const router = useRouter();
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);

  React.useEffect(() => {
    if (!isAnalyzing) {
      return;
    }
    const timeout = setTimeout(() => {
      setIsAnalyzing(false);
      router.push('/pet/rehome/verify');
    }, ANALYZE_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [isAnalyzing, router]);

  const handlePress = () => {
    if (isAnalyzing) {
      return;
    }
    setIsAnalyzing(true);
  };

  const titleText = isAnalyzing ? '分析中...' : '上传/拍照';
  const hintText = isAnalyzing
    ? '正在从照片中识别宠物信息。'
    : '点击开始识别。';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>视觉识别</Text>
        <Text style={styles.subtitle}>添加照片，自动填充宠物档案。</Text>
      </View>

      <Pressable
        onPress={handlePress}
        disabled={isAnalyzing}
        style={({ pressed }) => [
          styles.uploadBox,
          pressed && !isAnalyzing && styles.uploadBoxPressed,
          isAnalyzing && styles.uploadBoxBusy,
        ]}>
        <Text style={styles.uploadTitle}>{titleText}</Text>
        <Text style={styles.uploadHint}>{hintText}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: Theme.layout.full,
    backgroundColor: Theme.colors.background,
    padding: Theme.spacing.l,
  },
  header: {
    marginBottom: Theme.spacing.l,
  },
  title: {
    color: Theme.colors.text,
    fontSize: Theme.typography.size.s22,
    fontFamily: Theme.fonts.semiBold,
    marginBottom: Theme.spacing.s,
  },
  subtitle: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.size.s14,
  },
  uploadBox: {
    minHeight: Theme.sizes.s300,
    borderRadius: Theme.layout.radius,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarm,
    backgroundColor: Theme.colors.cardTranslucentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Theme.spacing.l,
    borderStyle: 'dashed',
  },
  uploadBoxPressed: {
    transform: [{ scale: Theme.scale.pressedSoft }],
  },
  uploadBoxBusy: {
    backgroundColor: Theme.colors.overlaySoft,
  },
  uploadTitle: {
    color: Theme.colors.text,
    fontSize: Theme.typography.size.s18,
    fontFamily: Theme.fonts.semiBold,
    marginBottom: Theme.spacing.s,
  },
  uploadHint: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.size.s12,
    textAlign: 'center',
  },
});
