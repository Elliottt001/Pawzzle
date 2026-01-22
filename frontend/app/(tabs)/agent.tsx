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
      const normalized = payload && payload.trim().length > 0 ? payload : '[empty]';
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
      'Profile complete:',
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
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load pet cards');
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
        appendDebug('DEBUG: evaluation prompt', data?.prompt ?? '');
        appendDebug('DEBUG: evaluation response', data?.rawResponse ?? '');

        if (data?.endverification) {
          const summary = buildEvaluationSummary(data);
          setEvaluation(summary);
          setPendingQuestions([]);
          appendMessage('ai', formatEvaluationSummary(summary));
          setStatus('recommending');
          return loadPetCards().then((pets) => requestRecommendation(summary, [], pets)).then((decision) => {
            appendDebug('DEBUG: recommend prompt', decision?.prompt ?? '');
            appendDebug('DEBUG: recommend response', decision?.rawResponse ?? '');
            setRecommendedItems(decision?.items ?? []);
          });
        }

        const questions = normalizeQuestions(data);
        if (questions.length) {
          const [first, ...rest] = questions;
          setPendingQuestions(rest);
          appendMessage('ai', first);
        } else {
          appendDebug('DEBUG: evaluation missing questions', data?.rawResponse ?? '');
        }
        return undefined;
      })
      .catch((error) => {
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Failed to start the chat');
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
      appendDebug('DEBUG: evaluation prompt', data?.prompt ?? '');
      appendDebug('DEBUG: evaluation response', data?.rawResponse ?? '');

      if (data?.endverification) {
        const summary = buildEvaluationSummary(data);
        setEvaluation(summary);
        setPendingQuestions([]);
        appendMessage('ai', formatEvaluationSummary(summary));

        setStatus('recommending');
        const pets = await loadPetCards();
        const decision = await requestRecommendation(summary, buildAgentMessages(nextMessages), pets);
        appendDebug('DEBUG: recommend prompt', decision?.prompt ?? '');
        appendDebug('DEBUG: recommend response', decision?.rawResponse ?? '');
        setRecommendedItems(decision?.items ?? []);
      } else {
        const questions = normalizeQuestions(data);
        if (questions.length) {
          const [first, ...rest] = questions;
          setPendingQuestions(rest);
          appendMessage('ai', first);
        } else {
          appendDebug('DEBUG: evaluation missing questions', data?.rawResponse ?? '');
        }
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong.');
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
        <Text style={styles.overline}>Agent</Text>
        <Text style={styles.title}>Adoption Assistant</Text>
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.chatList}>
        {messages.map((message) => (
          <ChatBubble key={message.id} role={message.role} text={message.content} />
        ))}

        {status === 'evaluating' ? (
          <ChatBubble role="ai" text="Reviewing your details..." />
        ) : null}
        {status === 'recommending' ? (
          <ChatBubble role="ai" text="Picking the best matches..." />
        ) : null}

        {errorMessage ? <ChatBubble role="debug" text={`Error: ${errorMessage}`} /> : null}

        {evaluation && petCardsStatus === 'error' ? (
          <ChatBubble role="debug" text="Pet cards are unavailable right now." />
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
              placeholder="Answer the question in your own words..."
              placeholderTextColor="#9CA3AF"
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
              <Feather name="send" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
          <Text style={styles.helperText}>
            The agent will ask 15 questions in batches of five.
          </Text>
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
          <FontAwesome5 name="paw" size={16} color="#15803D" />
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
    throw new Error(response.statusText || 'Request failed');
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
        ? String((data as { message?: string }).message)
        : response.statusText;
    throw new Error(message || 'Request failed');
  }

  return data;
}

function buildEvaluationSummary(data: EvaluationResponse): EvaluationSummary {
  return {
    profile: data.profile?.trim() || 'No profile summary provided.',
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
    flex: 1,
    backgroundColor: '#FDF7F0',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  blob: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.6,
  },
  blobLeft: {
    top: -70,
    left: -40,
    backgroundColor: '#FCE6CE',
  },
  blobRight: {
    top: 20,
    right: -50,
    backgroundColor: '#DFF3E5',
  },
  blobBottom: {
    bottom: -70,
    left: '35%',
    backgroundColor: '#DCEFFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 6,
  },
  overline: {
    fontSize: 11,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: '#6B7280',
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#111827',
  },
  chatList: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 140,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
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
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF8EF',
    borderWidth: 1,
    borderColor: '#D1EBDD',
    marginRight: 8,
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: '#157B57',
    borderTopRightRadius: 6,
  },
  aiBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: '#EEE6DC',
    borderTopLeftRadius: 6,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 2,
  },
  debugBubble: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderTopLeftRadius: 6,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: '#F9FAFB',
  },
  aiText: {
    color: '#111827',
  },
  debugText: {
    color: '#4B5563',
    fontSize: 12,
    lineHeight: 16,
  },
  matchList: {
    marginTop: 6,
    gap: 14,
  },
  inputDock: {
    borderTopWidth: 1,
    borderTopColor: '#EFEAE3',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#EEE6DC',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#111827',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#157B57',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    shadowColor: '#0F172A',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 3,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonPressed: {
    transform: [{ scale: 0.97 }],
  },
  helperText: {
    marginTop: 8,
    fontSize: 12,
    color: '#6B7280',
  },
});
