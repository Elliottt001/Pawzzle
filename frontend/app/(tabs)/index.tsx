import * as React from 'react';
import {
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Theme } from '@/constants/theme';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080');
const ensureChinese = (message: string, fallback: string) =>
  /[\u4e00-\u9fff]/.test(message) ? message : fallback;

type GeneratePetsResponse = {
  requested: number;
  parsed: number;
  created: number;
  skipped: number;
  skippedReasons?: string[];
  rawResponse?: string;
};

export default function HomeScreen() {
  const router = useRouter();
  const [aiStatus, setAiStatus] = React.useState<'idle' | 'generating' | 'success' | 'error'>(
    'idle'
  );
  const [aiMessage, setAiMessage] = React.useState<string | null>(null);
  const isGenerating = aiStatus === 'generating';

  const handleStart = () => {
    router.push('/agent');
  };

  const handleGenerateCards = async () => {
    if (isGenerating) {
      return;
    }
    setAiStatus('generating');
    setAiMessage(null);

    try {
      const data = await postJson<GeneratePetsResponse>('/api/pets/generate', {});
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.background}>
        <View style={[styles.glow, styles.glowTop]} />
        <View style={[styles.glow, styles.glowRight]} />
        <View style={[styles.glow, styles.glowBottom]} />
      </View>

      <ScrollView contentContainerStyle={styles.content} bounces={false}>
        <View style={styles.brandRow}>
          <Text style={styles.brandText}>Puzzle 寻爪</Text>
        </View>

        <View style={styles.hero}>
          <View style={styles.mascotWrap}>
            <View style={styles.mascotGlow} />
            <View style={styles.puzzlePiece}>
              <View style={[styles.connector, styles.connectorTop]} />
              <View style={[styles.connector, styles.connectorLeft]} />
              <View style={[styles.connector, styles.connectorRight]} />
              <View style={[styles.connector, styles.connectorBottom]} />
              <View style={styles.catBadge}>
                <FontAwesome5
                  name="cat"
                  size={Theme.sizes.s50}
                  color={Theme.colors.textWarning}
                />
                <View style={styles.badgePaw}>
                  <FontAwesome5
                    name="paw"
                    size={Theme.sizes.s16}
                    color={Theme.colors.decorativePeachSoft}
                  />
                </View>
              </View>
            </View>
          </View>

          <Text style={styles.headline}>你好！我是Pawzy</Text>
          <Text style={styles.subhead}>准备好寻找你的伙伴了吗</Text>

          <View style={styles.ctaRow}>
            <FontAwesome5 name="paw" size={Theme.sizes.s18} color={Theme.colors.decorativePeach} />
            <Pressable
              onPress={handleStart}
              style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaButtonPressed]}>
              <Text style={styles.ctaText}>开始测试</Text>
            </Pressable>
            <FontAwesome5 name="paw" size={Theme.sizes.s18} color={Theme.colors.decorativePeach} />
          </View>

          <Text style={styles.tipText}>随时开始，只需几分钟哦</Text>

          <View style={styles.aiSection}>
            <Pressable
              onPress={handleGenerateCards}
              disabled={isGenerating}
              style={({ pressed }) => [
                styles.aiButton,
                isGenerating && styles.aiButtonDisabled,
                pressed && !isGenerating && styles.aiButtonPressed,
              ]}>
              <Text style={styles.aiButtonText}>{isGenerating ? '生成中...' : 'AI生成20张宠物卡片'}</Text>
            </Pressable>
            {aiMessage ? (
              <Text
                style={[
                  styles.aiMessage,
                  aiStatus === 'error' ? styles.aiMessageError : styles.aiMessageSuccess,
                ]}>
                {aiMessage}
              </Text>
            ) : null}
          </View>
        </View>

        <Text style={styles.privacyText}>对话仅用于匹配，我们保护你的隐私~</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

async function postJson<T = unknown>(path: string, payload: Record<string, unknown>) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
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

const PUZZLE_SIZE = Theme.sizes.s140;
const CONNECTOR_SIZE = Theme.sizes.s40;
const CONNECTOR_OFFSET = (PUZZLE_SIZE - CONNECTOR_SIZE) / 2;

const styles = StyleSheet.create({
  safeArea: {
    flex: Theme.layout.full,
    backgroundColor: Theme.colors.backgroundWarmAlt,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  glow: {
    position: 'absolute',
    width: Theme.sizes.s220,
    height: Theme.sizes.s220,
    borderRadius: Theme.radius.r110,
    opacity: Theme.opacity.o65,
  },
  glowTop: {
    top: -Theme.sizes.s80,
    left: -Theme.sizes.s40,
    backgroundColor: Theme.colors.decorativePeachAlt,
  },
  glowRight: {
    top: Theme.spacing.s24,
    right: -Theme.sizes.s50,
    backgroundColor: Theme.colors.decorativeMint,
  },
  glowBottom: {
    bottom: -Theme.sizes.s70,
    left: Theme.percent.p35,
    backgroundColor: Theme.colors.decorativeSkyAlt,
  },
  content: {
    flexGrow: Theme.layout.full,
    paddingHorizontal: Theme.spacing.s24,
    paddingTop: Theme.spacing.s16,
    paddingBottom: Theme.sizes.s80,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    alignSelf: 'flex-start',
  },
  brandText: {
    fontSize: Theme.typography.size.s20,
    fontWeight: Theme.typography.weight.semiBold,
    color: Theme.colors.textWarning,
    letterSpacing: Theme.typography.letterSpacing.s1_6,
  },
  hero: {
    alignItems: 'center',
    gap: Theme.spacing.s16,
  },
  mascotWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.s12,
  },
  mascotGlow: {
    position: 'absolute',
    width: Theme.sizes.s220,
    height: Theme.sizes.s220,
    borderRadius: Theme.radius.r110,
    backgroundColor: Theme.colors.decorativePeachSoft,
    opacity: Theme.opacity.o6,
  },
  puzzlePiece: {
    width: PUZZLE_SIZE,
    height: PUZZLE_SIZE,
    borderRadius: Theme.radius.r24,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarmSoft,
    ...Theme.shadows.cardLarge,
  },
  connector: {
    position: 'absolute',
    width: CONNECTOR_SIZE,
    height: CONNECTOR_SIZE,
    borderRadius: CONNECTOR_SIZE / 2,
    backgroundColor: Theme.colors.primary,
  },
  connectorTop: {
    top: -Theme.sizes.s20,
    left: CONNECTOR_OFFSET,
  },
  connectorLeft: {
    left: -Theme.sizes.s20,
    top: CONNECTOR_OFFSET,
  },
  connectorRight: {
    right: -Theme.sizes.s20,
    top: CONNECTOR_OFFSET,
  },
  connectorBottom: {
    bottom: -Theme.sizes.s20,
    left: CONNECTOR_OFFSET,
  },
  catBadge: {
    width: Theme.sizes.s90,
    height: Theme.sizes.s90,
    borderRadius: Theme.sizes.s90 / 2,
    backgroundColor: Theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarm,
    ...Theme.shadows.elevated,
  },
  badgePaw: {
    position: 'absolute',
    bottom: Theme.spacing.s6,
    right: Theme.spacing.s6,
  },
  headline: {
    fontSize: Theme.typography.size.s20,
    fontWeight: Theme.typography.weight.semiBold,
    color: Theme.colors.textWarning,
  },
  subhead: {
    fontSize: Theme.typography.size.s14,
    color: Theme.colors.textSecondary,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.s14,
    marginTop: Theme.spacing.s4,
  },
  ctaButton: {
    minWidth: Theme.sizes.s220,
    paddingVertical: Theme.spacing.s12,
    paddingHorizontal: Theme.spacing.s32,
    borderRadius: Theme.radius.pill,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows.button,
  },
  ctaButtonPressed: {
    transform: [{ scale: Theme.scale.pressed }],
  },
  ctaText: {
    fontSize: Theme.typography.size.s16,
    fontWeight: Theme.typography.weight.semiBold,
    color: Theme.colors.textInverse,
  },
  tipText: {
    fontSize: Theme.typography.size.s12,
    color: Theme.colors.textSecondary,
  },
  aiSection: {
    alignItems: 'center',
    gap: Theme.spacing.s8,
  },
  aiButton: {
    paddingVertical: Theme.spacing.s10,
    paddingHorizontal: Theme.spacing.s20,
    borderRadius: Theme.radius.pill,
    backgroundColor: Theme.colors.card,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarm,
    ...Theme.shadows.card,
  },
  aiButtonDisabled: {
    opacity: Theme.opacity.o6,
  },
  aiButtonPressed: {
    transform: [{ scale: Theme.scale.pressedSoft }],
  },
  aiButtonText: {
    fontSize: Theme.typography.size.s13,
    fontWeight: Theme.typography.weight.semiBold,
    color: Theme.colors.text,
  },
  aiMessage: {
    maxWidth: Theme.sizes.s310,
    textAlign: 'center',
    fontSize: Theme.typography.size.s11,
  },
  aiMessageError: {
    color: Theme.colors.textError,
  },
  aiMessageSuccess: {
    color: Theme.colors.textSuccess,
  },
  privacyText: {
    fontSize: Theme.typography.size.s11,
    color: Theme.colors.textSecondary,
    opacity: Theme.opacity.o7,
  },
});
