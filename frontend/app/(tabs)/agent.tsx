import * as React from 'react';
import {
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';

import { PetCard } from '@/components/pet-card';
import type { PetCardData } from '@/types/pet';
import { Theme } from '@/constants/theme';

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
};

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080');

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const ensureChinese = (message: string, fallback: string) =>
  /[\u4e00-\u9fff]/.test(message) ? message : fallback;

export default function AgentScreen() {
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
  const scrollRef = React.useRef<ScrollView | null>(null);
  const hasStartedRef = React.useRef(false);

  const isBusy = status === 'evaluating' || status === 'recommending';
  const canSend = input.trim().length > 0 && !isBusy && !evaluation;

  const appendMessage = React.useCallback((role: ChatRole, content: string) => {
    setMessages((prev) => [...prev, { id: createId(), role, content }]);
  }, []);

  const appendDebug = React.useCallback(
    (title: string, payload?: string | null) => {
      const normalized = payload && payload.trim().length > 0 ? payload : '【空】';
      appendMessage('debug', `${title}\n${normalized}`);
    },
    [appendMessage]
  );

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
    loadPetCards();
  }, [loadPetCards]);

  React.useEffect(() => {
    if (hasStartedRef.current) {
      return;
    }
    hasStartedRef.current = true;
    setStatus('evaluating');
    setErrorMessage(null);

    requestEvaluation([])
      .then((data) => {
        appendDebug('调试：评估提示', data?.prompt ?? '');
        appendDebug('调试：评估响应', data?.rawResponse ?? '');

        if (data?.endverification) {
          const summary = buildEvaluationSummary(data);
          setEvaluation(summary);
          setPendingQuestions([]);
          appendMessage('ai', formatEvaluationSummary(summary));
          setStatus('recommending');
          return loadPetCards().then((pets) => requestRecommendation(summary, [], pets)).then((decision) => {
            appendDebug('调试：推荐提示', decision?.prompt ?? '');
            appendDebug('调试：推荐响应', decision?.rawResponse ?? '');
            setRecommendedItems(decision?.items ?? []);
          });
        }

        const questions = normalizeQuestions(data);
        if (questions.length) {
          const [first, ...rest] = questions;
          setPendingQuestions(rest);
          appendMessage('ai', first);
        } else {
          appendDebug('调试：评估缺少下一问', data?.rawResponse ?? '');
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
  }, [appendDebug, appendMessage, buildEvaluationSummary, formatEvaluationSummary]);

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
      appendMessage('ai', nextQuestion);
      return;
    }

    setStatus('evaluating');
    const nextMessages = [...messages, userMessage];

    try {
      const data = await requestEvaluation(buildAgentMessages(nextMessages));
      appendDebug('调试：评估提示', data?.prompt ?? '');
      appendDebug('调试：评估响应', data?.rawResponse ?? '');

      if (data?.endverification) {
        const summary = buildEvaluationSummary(data);
        setEvaluation(summary);
        setPendingQuestions([]);
        appendMessage('ai', formatEvaluationSummary(summary));

        setStatus('recommending');
        const pets = await loadPetCards();
        const decision = await requestRecommendation(summary, buildAgentMessages(nextMessages), pets);
        appendDebug('调试：推荐提示', decision?.prompt ?? '');
        appendDebug('调试：推荐响应', decision?.rawResponse ?? '');
        setRecommendedItems(decision?.items ?? []);
      } else {
        const questions = normalizeQuestions(data);
        if (questions.length) {
          const [first, ...rest] = questions;
          setPendingQuestions(rest);
          appendMessage('ai', first);
        } else {
          appendDebug('调试：评估缺少下一问', data?.rawResponse ?? '');
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.background}>
        <View style={[styles.blob, styles.blobLeft]} />
        <View style={[styles.blob, styles.blobRight]} />
        <View style={[styles.blob, styles.blobBottom]} />
      </View>

      <View style={styles.header}>
        <Text style={styles.overline}>顾问</Text>
        <Text style={styles.title}>领养顾问</Text>
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.chatList}>
        {messages.map((message) => (
          <ChatBubble key={message.id} role={message.role} text={message.content} />
        ))}

        {status === 'evaluating' ? (
          <ChatBubble role="ai" text="正在核对你的信息..." />
        ) : null}
        {status === 'recommending' ? (
          <ChatBubble role="ai" text="正在挑选最佳匹配..." />
        ) : null}

        {errorMessage ? <ChatBubble role="debug" text={`错误：${errorMessage}`} /> : null}

        {evaluation && petCardsStatus === 'error' ? (
          <ChatBubble role="debug" text="暂时无法获取宠物卡片。" />
        ) : null}

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
              <Feather name="send" size={Theme.sizes.s18} color={Theme.colors.textInverse} />
            </Pressable>
          </View>
          <Text style={styles.helperText}>顾问会分批提问（共15题）直到资料完善。</Text>
        </View>
      ) : null}
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
          <FontAwesome5 name="paw" size={Theme.sizes.s16} color={Theme.colors.successStrong} />
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

async function requestEvaluation(messages: AgentMessage[]) {
  return postJson<EvaluationResponse>('/api/agent/evaluate', { messages });
}

async function requestRecommendation(
  summary: EvaluationSummary,
  messages: AgentMessage[],
  pets: PetCardData[]
) {
  return postJson<AgentDecisionResponse>('/api/agent/recommend', {
    messages,
    evaluation: summary,
    pets,
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
    fontWeight: Theme.typography.weight.semiBold,
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
    width: Theme.sizes.s34,
    height: Theme.sizes.s34,
    borderRadius: Theme.sizes.s34 / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.successSurfaceSoft,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.successBorderAlt,
    marginRight: Theme.spacing.s8,
  },
  bubble: {
    maxWidth: Theme.percent.p80,
    paddingHorizontal: Theme.spacing.s14,
    paddingVertical: Theme.spacing.s10,
    borderRadius: Theme.radius.r18,
  },
  userBubble: {
    backgroundColor: Theme.colors.successDeep,
    borderTopRightRadius: Theme.radius.r6,
  },
  aiBubble: {
    backgroundColor: Theme.colors.cardTranslucent,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarmAlt,
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
    color: Theme.colors.textOnAccent,
  },
  aiText: {
    color: Theme.colors.text,
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
    backgroundColor: Theme.colors.successDeep,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Theme.spacing.s10,
    ...Theme.shadows.button,
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
