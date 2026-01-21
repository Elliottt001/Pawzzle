import * as React from 'react';
import { Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

import { PetCard } from '@/components/pet-card';
import type { PetCardData } from '@/types/pet';

type Intent = 'adopt' | 'rehome';
type QuestionAnswer = { question: string; answer: string };
type AgentDecisionItem = { id: string; confidence?: number };
type AgentDecisionResponse = { items: AgentDecisionItem[]; rawResponse?: string };

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080');

const colorOptions = ['Golden', 'Black', 'White', 'Mixed'];
const personalityOptions = ['Calm', 'Playful', 'Independent', 'Smart'];
const expectationOptions = ['Good with cats', 'Low shed', 'Easy to train', 'No preference'];

export default function AgentScreen() {
  const [intent, setIntent] = React.useState<Intent | null>(null);
  const [color, setColor] = React.useState<string | null>(null);
  const [personality, setPersonality] = React.useState<string | null>(null);
  const [expectation, setExpectation] = React.useState<string | null>(null);
  const [petCards, setPetCards] = React.useState<PetCardData[]>([]);
  const [petCardsStatus, setPetCardsStatus] = React.useState<'loading' | 'ready' | 'error'>(
    'loading'
  );
  const [petCardsError, setPetCardsError] = React.useState<string | null>(null);
  const [recommendationStatus, setRecommendationStatus] = React.useState<
    'idle' | 'loading' | 'done' | 'error'
  >('idle');
  const [recommendedItems, setRecommendedItems] = React.useState<AgentDecisionItem[]>([]);
  const [modelRawResponse, setModelRawResponse] = React.useState<string | null>(null);
  const scrollRef = React.useRef<ScrollView | null>(null);

  React.useEffect(() => {
    let isActive = true;
    setPetCardsStatus('loading');
    setPetCardsError(null);

    fetch(`${API_BASE_URL}/api/pets`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Failed to load pet cards');
        }
        return (await response.json()) as PetCardData[];
      })
      .then((data) => {
        if (!isActive) {
          return;
        }
        setPetCards(data ?? []);
        setPetCardsStatus('ready');
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }
        const message = error instanceof Error ? error.message : 'Failed to load pet cards';
        setPetCardsStatus('error');
        setPetCardsError(message);
      });

    return () => {
      isActive = false;
    };
  }, []);

  React.useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [intent, color, personality, expectation, recommendationStatus]);

  React.useEffect(() => {
    if (intent !== 'adopt' || !color || !personality || !expectation) {
      return;
    }

    if (petCardsStatus === 'loading') {
      setRecommendationStatus('loading');
      return;
    }

    if (petCardsStatus === 'error' || !petCards.length) {
      setRecommendationStatus('error');
      setModelRawResponse(petCardsError ?? 'No pet cards available yet.');
      setRecommendedItems([]);
      return;
    }

    const questionAnswers: QuestionAnswer[] = [
      { question: 'Do you want to adopt or rehome?', answer: intent === 'adopt' ? 'Adopt a pet' : 'Rehome a pet' },
      { question: 'What coat color do you like?', answer: color },
      { question: 'What personality do you like?', answer: personality },
      { question: 'Any other expectations?', answer: expectation },
    ];

    let isActive = true;
    const fallbackItems = petCards.slice(0, 3).map((pet) => ({ id: pet.id, confidence: 0.5 }));

    setRecommendationStatus('loading');
    setRecommendedItems([]);
    setModelRawResponse(null);

    request<AgentDecisionResponse>('/api/agent/recommend', {
      questionAnswers,
      pets: petCards,
    })
      .then((data) => {
        if (!isActive) {
          return;
        }
        const items = data?.items?.length ? data.items : fallbackItems;
        setRecommendedItems(items);
        setModelRawResponse(data?.rawResponse ?? '');
        setRecommendationStatus('done');
      })
      .catch(() => {
        if (!isActive) {
          return;
        }
        setRecommendedItems(fallbackItems);
        setModelRawResponse(null);
        setRecommendationStatus('error');
      });

    return () => {
      isActive = false;
    };
  }, [intent, color, personality, expectation, petCards, petCardsStatus, petCardsError]);

  const visiblePets = React.useMemo(() => {
    if (recommendationStatus === 'loading' || recommendationStatus === 'idle') {
      return [] as { pet: PetCardData; confidence?: number }[];
    }
    if (!petCards.length) {
      return [] as { pet: PetCardData; confidence?: number }[];
    }
    const petById = new Map(petCards.map((pet) => [pet.id, pet]));
    const selected = recommendedItems
      .map((item) => {
        const pet = petById.get(item.id);
        return pet ? { pet, confidence: item.confidence } : null;
      })
      .filter((item): item is { pet: PetCardData; confidence?: number } => Boolean(item));
    if (selected.length) {
      return selected;
    }
    return petCards.slice(0, 3).map((pet) => ({ pet, confidence: 0.5 }));
  }, [recommendationStatus, recommendedItems, petCards]);

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
        <ChatBubble role="ai" text="Do you want to adopt or rehome?" />
        {!intent ? (
          <View style={styles.optionRow}>
            <OptionButton label="Adopt a pet" variant="primary" onPress={() => setIntent('adopt')} />
            <OptionButton label="Rehome a pet" variant="outline" onPress={() => setIntent('rehome')} />
          </View>
        ) : null}

        {intent ? (
          <ChatBubble role="user" text={intent === 'adopt' ? 'Adopt a pet' : 'Rehome a pet'} />
        ) : null}

        {intent === 'rehome' ? (
          <ChatBubble
            role="ai"
            text="Rehome flow is coming soon. For now, I can help with adoption."
          />
        ) : null}

        {intent === 'adopt' ? (
          <>
            <ChatBubble role="ai" text="What coat color do you like?" />
            {!color ? (
              <View style={styles.optionRow}>
                {colorOptions.map((option) => (
                  <OptionButton
                    key={option}
                    label={option}
                    variant="chip"
                    onPress={() => setColor(option)}
                  />
                ))}
              </View>
            ) : (
              <ChatBubble role="user" text={color} />
            )}

            {color ? (
              <>
                <ChatBubble role="ai" text="What personality do you like?" />
                {!personality ? (
                  <View style={styles.optionRow}>
                    {personalityOptions.map((option) => (
                      <OptionButton
                        key={option}
                        label={option}
                        variant="chip"
                        onPress={() => setPersonality(option)}
                      />
                    ))}
                  </View>
                ) : (
                  <ChatBubble role="user" text={personality} />
                )}
              </>
            ) : null}

            {personality ? (
              <>
                <ChatBubble role="ai" text="Any other expectations?" />
                {!expectation ? (
                  <View style={styles.optionRow}>
                    {expectationOptions.map((option) => (
                      <OptionButton
                        key={option}
                        label={option}
                        variant="chip"
                        onPress={() => setExpectation(option)}
                      />
                    ))}
                  </View>
                ) : (
                  <ChatBubble role="user" text={expectation} />
                )}
              </>
            ) : null}

            {expectation ? (
              <>
                <ChatBubble
                  role="ai"
                  text={
                    recommendationStatus === 'loading'
                      ? 'Picking the best matches for you...'
                      : recommendationStatus === 'error'
                        ? 'I could not load matches yet. Please try again soon.'
                        : 'Here are your top matches.'
                  }
                />
                {recommendationStatus === 'loading' ? null : (
                  <>
                    <View style={styles.matchList}>
                      {visiblePets.map(({ pet, confidence }) => (
                        <PetCard key={pet.id} pet={pet} confidence={confidence} />
                      ))}
                    </View>
                    {modelRawResponse !== null ? (
                      <ChatBubble role="ai" text={modelRawResponse} />
                    ) : null}
                  </>
                )}
              </>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function ChatBubble({ role, text }: { role: 'user' | 'ai'; text: string }) {
  const isUser = role === 'user';
  return (
    <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowAi]}>
      {!isUser ? (
        <View style={styles.avatar}>
          <FontAwesome5 name="paw" size={16} color="#15803D" />
        </View>
      ) : null}
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
        <Text style={[styles.messageText, isUser ? styles.userText : styles.aiText]}>{text}</Text>
      </View>
    </View>
  );
}

function OptionButton({
  label,
  variant,
  onPress,
}: {
  label: string;
  variant: 'primary' | 'outline' | 'chip';
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.optionButton,
        variant === 'primary' && styles.optionPrimary,
        variant === 'outline' && styles.optionOutline,
        variant === 'chip' && styles.optionChip,
        pressed && styles.optionPressed,
      ]}>
      <Text
        style={[
          styles.optionText,
          variant === 'primary' && styles.optionTextPrimary,
          variant === 'outline' && styles.optionTextOutline,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

async function request<T = unknown>(path: string, payload?: Record<string, unknown>) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: payload ? JSON.stringify(payload) : undefined,
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
    maxWidth: '78%',
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
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingLeft: 42,
    marginBottom: 12,
  },
  optionButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  optionPrimary: {
    backgroundColor: '#157B57',
    borderColor: '#157B57',
  },
  optionOutline: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderColor: '#EFE3D6',
  },
  optionChip: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  optionPressed: {
    transform: [{ scale: 0.98 }],
  },
  optionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  optionTextPrimary: {
    color: '#FFFFFF',
  },
  optionTextOutline: {
    color: '#1F2937',
  },
  matchList: {
    marginTop: 6,
    gap: 14,
  },
});
