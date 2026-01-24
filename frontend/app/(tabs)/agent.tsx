import * as React from 'react';
import {
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Text } from '@/components/base-text';
import { FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PetCard } from '@/components/pet-card';
import type { PetCardData } from '@/types/pet';
import { Theme } from '@/constants/theme';
import AgentAvatarSvg from '@/assets/images/Agent.svg';
import SendIcon from '@/assets/images/send.svg';

type ChatRole = 'user' | 'ai' | 'debug';

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

type AgentMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type EvaluationResponse = {
  endverification: boolean;
  profile?: string | null;
  nextQuestions?: string[] | null;
  nextQuestion?: string | null;
  prompt?: string | null;
  rawResponse?: string | null;
};

type EvaluationSummary = {
  profile: string;
};

type AgentDecisionItem = { id: string; confidence?: number };

type AgentDecisionResponse = {
  items: AgentDecisionItem[];
  rawResponse?: string;
  prompt?: string;
  debug?: string;
};

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080');

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const ensureChinese = (message: string, fallback: string) =>
  /[\u4e00-\u9fff]/.test(message) ? message : fallback;
const WAITING_TEXT_INTERVAL_MS = 2600;
const EVALUATING_WAITING_TEXTS = [
  '正在整理你的回答...',
  '正在生成下一组问题...',
  '正在核对关键信息...',
  '正在补全匹配画像...',
];
const RECOMMENDING_WAITING_TEXTS = [
  '正在筛选合适的毛孩子...',
  '正在匹配性格与生活节奏...',
  '正在生成推荐结果...',
];

const ACKNOWLEDGEMENTS = [
  '好的，了解您的情况了！',
  '收到，这很有趣～',
  '明白啦，我们会帮您留意的。',
  '原来是这样呀，很有意思！',
  '好的，这对我很有帮助。',
  '收到您的反馈啦。',
  '好的，这一点很重要。',
  '确实是这样呢。',
  '了解了，我们会仔细考虑的。',
  '收到，谢谢您的分享！',
];

const getRandomAcknowledgement = () => {
  return ACKNOWLEDGEMENTS[Math.floor(Math.random() * ACKNOWLEDGEMENTS.length)];
};

export default function AgentScreen() {
  const [hasStarted, setHasStarted] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState('');
  const [status, setStatus] = React.useState<'idle' | 'evaluating' | 'recommending' | 'error'>(
    'idle'
  );
  const [petCards, setPetCards] = React.useState<PetCardData[]>([]);
  const [petCardsStatus, setPetCardsStatus] = React.useState<'loading' | 'ready' | 'error'>(
    'loading'
  );
  const [evaluation, setEvaluation] = React.useState<EvaluationSummary | null>(null);
  const [pendingQuestions, setPendingQuestions] = React.useState<string[]>([]);
  const [recommendedItems, setRecommendedItems] = React.useState<AgentDecisionItem[]>([]);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [waitingIndex, setWaitingIndex] = React.useState(0);
  const scrollRef = React.useRef<ScrollView | null>(null);
  const hasStartedRef = React.useRef(false);

  const isBusy = status === 'evaluating' || status === 'recommending';
  const canSend = input.trim().length > 0 && !isBusy && !evaluation;
  const waitingMessages =
    status === 'recommending' ? RECOMMENDING_WAITING_TEXTS : EVALUATING_WAITING_TEXTS;
  const waitingText = waitingMessages[waitingIndex % waitingMessages.length];

  React.useEffect(() => {
    if (!isBusy) {
      setWaitingIndex(0);
      return;
    }

    setWaitingIndex(0);
    const activeMessages =
      status === 'recommending' ? RECOMMENDING_WAITING_TEXTS : EVALUATING_WAITING_TEXTS;
    const interval = setInterval(() => {
      setWaitingIndex((prev) => (prev + 1) % activeMessages.length);
    }, WAITING_TEXT_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isBusy, status]);

  const appendMessage = React.useCallback((role: ChatRole, content: string) => {
    setMessages((prev) => [...prev, { id: createId(), role, content }]);
  }, []);

  const appendDebug = React.useCallback((_title: string, _payload?: string | null) => {
    // Debug output disabled on the agent page.
  }, []);

  const buildAgentMessages = React.useCallback((items: ChatMessage[]) => {
    return items
      .filter((item) => item.role !== 'debug')
      .map<AgentMessage>((item) => ({
        role: item.role === 'user' ? 'user' : 'assistant',
        content: item.content,
      }));
  }, []);

  const formatEvaluationSummary = React.useCallback((summary: EvaluationSummary) => {
    return [
      '评估完成：',
      summary.profile,
    ].join('\n');
  }, []);

  const loadPetCards = React.useCallback(async () => {
    if (petCardsStatus === 'ready' && petCards.length) {
      return petCards;
    }
    setPetCardsStatus('loading');
    try {
      const data = await getJson<PetCardData[]>('/api/pets');
      setPetCards(data ?? []);
      setPetCardsStatus('ready');
      return data ?? [];
    } catch (error) {
      setPetCardsStatus('error');
      const message = error instanceof Error ? error.message : '';
      setErrorMessage(ensureChinese(message, '宠物卡片加载失败'));
      return [] as PetCardData[];
    }
  }, [petCards, petCardsStatus]);

  React.useEffect(() => {
    if (hasStarted) {
      loadPetCards();
    }
  }, [hasStarted, loadPetCards]);

  React.useEffect(() => {
    if (!hasStarted || hasStartedRef.current) {
      return;
    }
    hasStartedRef.current = true;
    setStatus('evaluating');
    setErrorMessage(null);

    requestEvaluation([])
      .then((data) => {
        // appendDebug('调试：评估提示', data?.prompt ?? '');
        // appendDebug('调试：评估响应', data?.rawResponse ?? '');

        if (data?.endverification) {
          const summary = buildEvaluationSummary(data);
          setEvaluation(summary);
          setPendingQuestions([]);
          appendMessage('ai', formatEvaluationSummary(summary));
          setStatus('recommending');
          return loadPetCards().then(() => requestRecommendation(summary, [])).then((decision) => {
            // appendDebug('调试：推荐提示', decision?.prompt ?? '');
            // appendDebug('调试：候选筛选', decision?.debug ?? '');
            // appendDebug('调试：推荐响应', decision?.rawResponse ?? '');
            setRecommendedItems(decision?.items ?? []);
          });
        }

        const questions = normalizeQuestions(data);
        if (questions.length) {
          const [first, ...rest] = questions;
          setPendingQuestions(rest);
          appendMessage('ai', first);
        } else {
          // appendDebug('调试：评估缺少下一问', data?.rawResponse ?? '');
        }
        return undefined;
      })
      .catch((error) => {
        setStatus('error');
        const message = error instanceof Error ? error.message : '';
        setErrorMessage(ensureChinese(message, '聊天初始化失败'));
      })
      .finally(() => {
        setStatus('idle');
      });
  }, [
    appendDebug,
    appendMessage,
    buildEvaluationSummary,
    formatEvaluationSummary,
    hasStarted,
    loadPetCards,
  ]);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 0);
    return () => clearTimeout(timeout);
  }, [messages, recommendedItems]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isBusy || evaluation) {
      return;
    }

    const userMessage: ChatMessage = {
      id: createId(),
      role: 'user',
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setErrorMessage(null);

    if (pendingQuestions.length) {
      const [nextQuestion, ...rest] = pendingQuestions;
      setPendingQuestions(rest);
      appendMessage('ai', `${getRandomAcknowledgement()}\n\n${nextQuestion}`);
      return;
    }

    setStatus('evaluating');
    const nextMessages = [...messages, userMessage];

    try {
      const data = await requestEvaluation(buildAgentMessages(nextMessages));
      // appendDebug('调试：评估提示', data?.prompt ?? '');
      // appendDebug('调试：评估响应', data?.rawResponse ?? '');

      if (data?.endverification) {
        const summary = buildEvaluationSummary(data);
        setEvaluation(summary);
        setPendingQuestions([]);
        appendMessage('ai', `${getRandomAcknowledgement()}\n\n${formatEvaluationSummary(summary)}`);

        setStatus('recommending');
        await loadPetCards();
        const decision = await requestRecommendation(summary, buildAgentMessages(nextMessages));
        // appendDebug('调试：推荐提示', decision?.prompt ?? '');
        // appendDebug('调试：候选筛选', decision?.debug ?? '');
        // appendDebug('调试：推荐响应', decision?.rawResponse ?? '');
        setRecommendedItems(decision?.items ?? []);
      } else {
        const questions = normalizeQuestions(data);
        if (questions.length) {
          const [first, ...rest] = questions;
          setPendingQuestions(rest);
          appendMessage('ai', `${getRandomAcknowledgement()}\n\n${first}`);
        } else {
          // appendDebug('调试：评估缺少下一问', data?.rawResponse ?? '');
        }
      }
    } catch (error) {
      setStatus('error');
      const message = error instanceof Error ? error.message : '';
      setErrorMessage(ensureChinese(message, '出现问题，请稍后重试'));
    } finally {
      setStatus('idle');
    }
  };

  const visiblePets = React.useMemo(() => {
    if (!recommendedItems.length || !petCards.length) {
      return [] as { pet: PetCardData; confidence?: number }[];
    }
    const petById = new Map(petCards.map((pet) => [pet.id, pet]));
    return recommendedItems
      .map((item) => {
        const pet = petById.get(item.id);
        return pet ? { pet, confidence: item.confidence } : null;
      })
      .filter((item): item is { pet: PetCardData; confidence?: number } => Boolean(item));
  }, [petCards, recommendedItems]);

  if (!hasStarted) {
    return <AgentStartScreen onStart={() => setHasStarted(true)} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.background}>
        <View style={[styles.blob, styles.blobLeft]} />
        <View style={[styles.blob, styles.blobRight]} />
        <View style={[styles.blob, styles.blobBottom]} />
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <Text style={styles.overline}></Text>
          <Text style={styles.title}></Text>
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.chatList}
          keyboardShouldPersistTaps="handled">
          {messages.map((message) => (
            <ChatBubble key={message.id} role={message.role} text={message.content} />
          ))}

          {isBusy ? <ChatBubble role="ai" text={waitingText} /> : null}

          {/* {errorMessage ? <ChatBubble role="debug" text={`错误：${errorMessage}`} /> : null} */}

          {/* {evaluation && petCardsStatus === 'error' ? (
            <ChatBubble role="debug" text="暂时无法获取宠物卡片。" />
          ) : null} */}

          {visiblePets.length ? (
            <View style={styles.matchList}>
              {visiblePets.map(({ pet, confidence }) => (
                <PetCard key={pet.id} pet={pet} confidence={confidence} />
              ))}
            </View>
          ) : null}
        </ScrollView>

        {!evaluation ? (
          <View style={styles.inputDock}>
            <View style={styles.inputRow}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="请用自己的话回答问题..."
                placeholderTextColor={Theme.colors.placeholder}
                style={styles.input}
                returnKeyType="send"
                onSubmitEditing={handleSend}
                editable={!isBusy}
              />
              <Pressable
                onPress={handleSend}
                disabled={!canSend}
                style={({ pressed }) => [
                  styles.sendButton,
                  !canSend && styles.sendButtonDisabled,
                  pressed && canSend && styles.sendButtonPressed,
                ]}>
                <SendIcon width={Theme.sizes.s18} height={Theme.sizes.s18} />
              </Pressable>
            </View>
            <Text style={styles.helperText}></Text>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ChatBubble({ role, text }: { role: ChatRole; text: string }) {
  const isUser = role === 'user';
  const isDebug = role === 'debug';

  return (
    <View
      style={[
        styles.messageRow,
        isUser ? styles.messageRowUser : styles.messageRowAi,
        isDebug && styles.messageRowDebug,
      ]}>
      {!isUser && !isDebug ? (
        <View style={styles.avatar}>
          <Image
            source={require('@/assets/images/Agent.png')}
            style={styles.avatarImage}
            accessibilityLabel="Pawzy"
          />
        </View>
      ) : null}
      <View
        style={[
          styles.bubble,
          isUser && styles.userBubble,
          isDebug && styles.debugBubble,
          !isUser && !isDebug && styles.aiBubble,
        ]}>
        <Text
          style={[
            styles.messageText,
            isUser && styles.userText,
            isDebug && styles.debugText,
            !isUser && !isDebug && styles.aiText,
          ]}>
          {text}
        </Text>
      </View>
    </View>
  );
}

function AgentStartScreen({ onStart }: { onStart: () => void }) {
  const floatAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -6,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [floatAnim]);

  return (
    <SafeAreaView style={startStyles.safeArea}>
      <View style={startStyles.background}>
        <View style={[startStyles.glow, startStyles.glowTop]} />
        <View style={[startStyles.glow, startStyles.glowRight]} />
        <View style={[startStyles.glow, startStyles.glowBottom]} />
      </View>

      <ScrollView contentContainerStyle={startStyles.content} bounces={false}>
        <View style={startStyles.brandRow}>
          <Text style={startStyles.brandText}>Pawzzle</Text>
        </View>

        <View style={startStyles.hero}>
          <View style={startStyles.mascotWrap}>
            <View style={startStyles.mascotGlow} />
            <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
              <AgentAvatarSvg style={startStyles.agentHero} accessibilityLabel="Pawzy" />
            </Animated.View>
          </View>

          <Text style={startStyles.headline}>你好！我是Pawzy</Text>
          <Text style={startStyles.subhead}>准备好寻找你的伙伴了吗</Text>

          <View style={startStyles.ctaRow}>
            <FontAwesome5 name="paw" size={Theme.sizes.s18} color={Theme.colors.decorativePeach} />
            <Pressable
              onPress={onStart}
              style={({ pressed }) => [
                startStyles.ctaButton,
                pressed && startStyles.ctaButtonPressed,
              ]}>
              <Text style={startStyles.ctaText}>开始测试</Text>
            </Pressable>
            <FontAwesome5 name="paw" size={Theme.sizes.s18} color={Theme.colors.decorativePeach} />
          </View>

          <Text style={startStyles.tipText}>随时开始，只需几分钟哦</Text>
        </View>

        <Text style={startStyles.privacyText}>对话仅用于匹配，我们保护你的隐私~</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

async function requestEvaluation(messages: AgentMessage[]) {
  return postJson<EvaluationResponse>('/api/agent/evaluate', { messages });
}

async function requestRecommendation(summary: EvaluationSummary, messages: AgentMessage[]) {
  return postJson<AgentDecisionResponse>('/api/agent/recommend', {
    messages,
    evaluation: summary,
  });
}

async function getJson<T = unknown>(path: string) {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(ensureChinese(response.statusText || '', '请求失败'));
  }
  return (await response.json()) as T;
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

function buildEvaluationSummary(data: EvaluationResponse): EvaluationSummary {
  return {
    profile: data.profile?.trim() || '暂无评估总结。',
  };
}

function normalizeQuestions(data?: EvaluationResponse | null) {
  if (!data) {
    return [];
  }
  const fromList = Array.isArray(data.nextQuestions) ? data.nextQuestions : [];
  const raw = fromList.length ? fromList : data.nextQuestion ? [data.nextQuestion] : [];
  const result: string[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    const trimmed = typeof item === 'string' ? item.trim() : '';
    if (!trimmed || seen.has(trimmed)) {
      continue;
    }
    seen.add(trimmed);
    result.push(trimmed);
  }
  return result;
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
  blob: {
    position: 'absolute',
    width: Theme.sizes.s220,
    height: Theme.sizes.s220,
    borderRadius: Theme.radius.r110,
    opacity: Theme.opacity.o6,
  },
  blobLeft: {
    top: -Theme.sizes.s70,
    left: -Theme.sizes.s40,
    backgroundColor: Theme.colors.decorativePeachAlt,
  },
  blobRight: {
    top: Theme.spacing.s20,
    right: -Theme.sizes.s50,
    backgroundColor: Theme.colors.decorativeMint,
  },
  blobBottom: {
    bottom: -Theme.sizes.s70,
    left: Theme.percent.p35,
    backgroundColor: Theme.colors.decorativeSkyAlt,
  },
  header: {
    paddingHorizontal: Theme.spacing.s20,
    paddingTop: Theme.spacing.s12,
    paddingBottom: Theme.spacing.s6,
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
  chatList: {
    paddingHorizontal: Theme.spacing.s20,
    paddingTop: Theme.spacing.s8,
    paddingBottom: Theme.sizes.s140,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: Theme.spacing.s12,
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowAi: {
    justifyContent: 'flex-start',
  },
  messageRowDebug: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: Theme.sizes.s40 ,
    height: Theme.sizes.s40 ,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.s8,
  },
  avatarImage: {
    width: Theme.sizes.s40,
    height: Theme.sizes.s40,
  },
  bubble: {
    maxWidth: Theme.percent.p80,
    paddingHorizontal: Theme.spacing.s14,
    paddingVertical: Theme.spacing.s10,
    borderRadius: Theme.radius.r18,
  },
  userBubble: {
    backgroundColor: Theme.colors.ctaBackground,
    borderTopRightRadius: Theme.radius.r6,
  },
  aiBubble: {
    backgroundColor: Theme.colors.surfaceWarm,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarmSoft,
    borderTopLeftRadius: Theme.radius.r6,
    ...Theme.shadows.elevatedLarge,
  },
  debugBubble: {
    backgroundColor: Theme.colors.surfaceNeutral,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderNeutral,
    borderTopLeftRadius: Theme.radius.r6,
  },
  messageText: {
    fontSize: Theme.typography.size.s15,
    lineHeight: Theme.typography.lineHeight.s20,
  },
  userText: {
    color: Theme.colors.textInverse,
  },
  aiText: {
    color: Theme.colors.textWarm,
  },
  debugText: {
    color: Theme.colors.textMuted,
    fontSize: Theme.typography.size.s12,
    lineHeight: Theme.typography.lineHeight.s16,
  },
  matchList: {
    marginTop: Theme.spacing.s6,
    gap: Theme.spacing.s14,
  },
  inputDock: {
    borderTopWidth: Theme.borderWidth.hairline,
    borderTopColor: Theme.colors.borderWarmStrong,
    backgroundColor: Theme.colors.overlaySoft,
    paddingHorizontal: Theme.spacing.s16,
    paddingTop: Theme.spacing.s10,
    paddingBottom: Theme.spacing.s12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: Theme.layout.full,
    minHeight: Theme.sizes.s44,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarmAlt,
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.r22,
    paddingHorizontal: Theme.spacing.s16,
    fontSize: Theme.typography.size.s15,
    color: Theme.colors.text,
  },
  sendButton: {
    width: Theme.sizes.s44,
    height: Theme.sizes.s44,
    borderRadius: Theme.radius.r22,
    backgroundColor: Theme.colors.card,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarmAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Theme.spacing.s10,
  },
  sendButtonDisabled: {
    opacity: Theme.opacity.o5,
  },
  sendButtonPressed: {
    transform: [{ scale: Theme.scale.pressed }],
  },
  helperText: {
    marginTop: Theme.spacing.s8,
    fontSize: Theme.typography.size.s12,
    color: Theme.colors.textSecondary,
  },
});

const startStyles = StyleSheet.create({
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
    fontFamily: Theme.fonts.semiBold,
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
  agentHero: {
    width: Theme.sizes.s220,
    height: Theme.sizes.s220,
  },
  headline: {
    fontSize: Theme.typography.size.s20,
    fontFamily: Theme.fonts.semiBold,
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
    fontFamily: Theme.fonts.semiBold,
    color: Theme.colors.textInverse,
  },
  tipText: {
    fontSize: Theme.typography.size.s12,
    color: Theme.colors.textSecondary,
  },
  privacyText: {
    fontSize: Theme.typography.size.s11,
    color: Theme.colors.textSecondary,
    opacity: Theme.opacity.o7,
  },
});
