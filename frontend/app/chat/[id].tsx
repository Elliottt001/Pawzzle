import * as React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';

import { Theme } from '@/constants/theme';
import {
  fetchThread,
  sendMessage,
  type ChatMessage,
  type ChatThread,
} from '@/lib/chatApi';
import { getSession, subscribeSession, type AuthSession } from '@/lib/session';

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080');

type PetSummary = {
  id: number;
  name: string;
  species: 'CAT' | 'DOG';
  status: 'OPEN' | 'MATCHED' | 'ADOPTED';
  description?: string | null;
};

export default function ChatDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const threadId = Array.isArray(id) ? id[0] : id;
  const [thread, setThread] = React.useState<ChatThread | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [sending, setSending] = React.useState(false);
  const [sendError, setSendError] = React.useState<string | null>(null);
  const [session, setSessionState] = React.useState<AuthSession | null>(() => getSession());
  const [petSummary, setPetSummary] = React.useState<PetSummary | null>(null);
  const [petLoading, setPetLoading] = React.useState(false);
  const [input, setInput] = React.useState('');
  const scrollRef = React.useRef<ScrollView | null>(null);

  React.useEffect(() => {
    const unsubscribe = subscribeSession((nextSession) => {
      setSessionState(nextSession);
    });
    return unsubscribe;
  }, []);

  React.useEffect(() => {
    if (!threadId || !session?.token) {
      setThread(null);
      setLoading(false);
      setLoadError(null);
      setPetSummary(null);
      setPetLoading(false);
      return;
    }
    let isActive = true;
    setLoading(true);
    setLoadError(null);
    fetchThread(threadId, session.token)
      .then((data) => {
        if (isActive) {
          setThread(data);
        }
      })
      .catch((error) => {
        if (isActive) {
          const message = error instanceof Error ? error.message : '加载对话失败';
          setLoadError(message);
        }
      })
      .finally(() => {
        if (isActive) {
          setLoading(false);
        }
      });
    return () => {
      isActive = false;
    };
  }, [threadId, session?.token]);

  React.useEffect(() => {
    const petId = thread?.petId;
    if (!petId) {
      setPetSummary(null);
      setPetLoading(false);
      return;
    }
    let isActive = true;
    setPetLoading(true);
    fetch(`${API_URL}/api/pets/${petId}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('获取宠物信息失败');
        }
        return response.json() as Promise<PetSummary>;
      })
      .then((data) => {
        if (isActive) {
          setPetSummary(data);
        }
      })
      .catch(() => {
        if (isActive) {
          setPetSummary(null);
        }
      })
      .finally(() => {
        if (isActive) {
          setPetLoading(false);
        }
      });
    return () => {
      isActive = false;
    };
  }, [thread?.petId]);

  React.useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [thread?.messages?.length]);

  const handleSend = () => {
    if (!threadId || !session?.token || sending) {
      return;
    }
    const trimmed = input.trim();
    if (!trimmed) {
      return;
    }
    setSending(true);
    setSendError(null);
    sendMessage(threadId, trimmed, session.token)
      .then((message) => {
        setThread((prev) => {
          if (!prev) {
            return prev;
          }
          return {
            ...prev,
            messages: [...prev.messages, message],
          };
        });
        setInput('');
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : '发送失败';
        setSendError(message);
      })
      .finally(() => {
        setSending(false);
      });
  };

  if (!session?.token) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>登录后才能私聊</Text>
          <Text style={styles.emptyText}>请先登录后再进入对话。</Text>
          <Pressable
            onPress={() => router.push('/')}
            style={({ pressed }) => [
              styles.loginButton,
              pressed && styles.loginButtonPressed,
            ]}>
            <Text style={styles.loginButtonText}>去登录</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!threadId || loadError || (!loading && !thread)) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>找不到对话</Text>
          <Text style={styles.emptyText}>
            {loadError || '请从宠物卡片发起私聊。'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading || !thread) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingState}>
          <ActivityIndicator size="small" color={Theme.colors.textSecondary} />
          <Text style={styles.loadingText}>正在加载对话...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable
            onPress={() => {
              if (thread.ownerId) {
                router.push(`/user/${thread.ownerId}`);
              }
            }}
            style={({ pressed }) => [
              styles.avatar,
              pressed && styles.avatarPressed,
            ]}>
            <FontAwesome5 name="user" size={Theme.sizes.s18} color={Theme.colors.text} />
          </Pressable>
          <View>
            <Text style={styles.title}>{thread.ownerName}</Text>
            {thread.petName ? (
              <Text style={styles.subtitle}>关于 {thread.petName}</Text>
            ) : null}
          </View>
        </View>

        {thread.petId ? (
          <Pressable
            onPress={() => router.push(`/pet/${thread.petId}`)}
            style={({ pressed }) => [
              styles.pinnedCard,
              pressed && styles.pinnedCardPressed,
            ]}>
            <View style={styles.pinnedHeader}>
              <Text style={styles.pinnedTitle}>当前宠物卡片</Text>
              <Text style={styles.pinnedAction}>查看详情</Text>
            </View>
            {petLoading ? (
              <View style={styles.pinnedLoadingRow}>
                <ActivityIndicator size="small" color={Theme.colors.textSecondary} />
                <Text style={styles.pinnedLoadingText}>加载宠物信息...</Text>
              </View>
            ) : (
              <View style={styles.pinnedBody}>
                <Text style={styles.pinnedName}>
                  {petSummary?.name ?? thread.petName ?? '当前宠物'}
                </Text>
                {petSummary ? (
                  <Text style={styles.pinnedMeta}>
                    {getSpeciesLabel(petSummary.species)} · {getStatusLabel(petSummary.status)}
                  </Text>
                ) : null}
                {petSummary?.description ? (
                  <Text style={styles.pinnedDesc} numberOfLines={2}>
                    {petSummary.description}
                  </Text>
                ) : null}
              </View>
            )}
          </Pressable>
        ) : null}

        <ScrollView ref={scrollRef} contentContainerStyle={styles.chatList}>
          {thread.messages.length === 0 ? (
            <View style={styles.welcomeCard}>
              <Text style={styles.welcomeTitle}>开始对话</Text>
              <Text style={styles.welcomeText}>打个招呼，了解更多宠物信息。</Text>
            </View>
          ) : (
            thread.messages.map((message) => (
              <ChatBubble key={message.id} message={message} />
            ))
          )}
        </ScrollView>

        {sendError ? <Text style={styles.errorText}>{sendError}</Text> : null}

        <View style={styles.inputDock}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="输入消息..."
            placeholderTextColor={Theme.colors.placeholder}
            style={styles.input}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <Pressable
            onPress={handleSend}
            disabled={sending}
            style={({ pressed }) => [
              styles.sendButton,
              pressed && styles.sendButtonPressed,
              sending && styles.sendButtonDisabled,
            ]}>
            <Text style={styles.sendButtonText}>发送</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function getSpeciesLabel(species: PetSummary['species']) {
  const labels: Record<PetSummary['species'], string> = {
    CAT: '猫',
    DOG: '狗',
  };
  return labels[species] ?? species;
}

function getStatusLabel(status: PetSummary['status']) {
  const labels: Record<PetSummary['status'], string> = {
    OPEN: '待领养',
    MATCHED: '已匹配',
    ADOPTED: '已领养',
  };
  return labels[status] ?? status;
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.sender === 'user';
  return (
    <View style={[styles.bubbleRow, isUser ? styles.bubbleRowUser : styles.bubbleRowOwner]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleOwner]}>
        <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>{message.text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: Theme.layout.full,
    backgroundColor: Theme.colors.backgroundWarmAlt,
  },
  flex: {
    flex: Theme.layout.full,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.s12,
    paddingHorizontal: Theme.spacing.s20,
    paddingTop: Theme.spacing.s12,
    paddingBottom: Theme.spacing.s10,
  },
  pinnedCard: {
    marginHorizontal: Theme.spacing.s20,
    marginBottom: Theme.spacing.s10,
    padding: Theme.spacing.s16,
    borderRadius: Theme.radius.r20,
    backgroundColor: Theme.colors.cardTranslucentSoft,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarm,
    ...Theme.shadows.card,
  },
  pinnedCardPressed: {
    transform: [{ scale: Theme.scale.pressedSoft }],
  },
  pinnedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.s8,
  },
  pinnedTitle: {
    fontSize: Theme.typography.size.s12,
    color: Theme.colors.textSecondary,
  },
  pinnedAction: {
    fontSize: Theme.typography.size.s12,
    color: Theme.colors.textLink,
  },
  pinnedLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.s8,
  },
  pinnedLoadingText: {
    fontSize: Theme.typography.size.s12,
    color: Theme.colors.textSecondary,
  },
  pinnedBody: {
    gap: Theme.spacing.s6,
  },
  pinnedName: {
    fontSize: Theme.typography.size.s16,
    fontWeight: Theme.typography.weight.semiBold,
    color: Theme.colors.text,
  },
  pinnedMeta: {
    fontSize: Theme.typography.size.s12,
    color: Theme.colors.textSecondary,
  },
  pinnedDesc: {
    fontSize: Theme.typography.size.s13,
    color: Theme.colors.textEmphasis,
  },
  avatar: {
    width: Theme.sizes.s44,
    height: Theme.sizes.s44,
    borderRadius: Theme.sizes.s22,
    backgroundColor: Theme.colors.surfaceWarm,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarmSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPressed: {
    transform: [{ scale: Theme.scale.pressedSoft }],
  },
  title: {
    fontSize: Theme.typography.size.s18,
    fontWeight: Theme.typography.weight.semiBold,
    color: Theme.colors.text,
  },
  subtitle: {
    fontSize: Theme.typography.size.s12,
    color: Theme.colors.textSecondary,
  },
  chatList: {
    paddingHorizontal: Theme.spacing.s20,
    paddingBottom: Theme.sizes.s120,
    gap: Theme.spacing.s10,
  },
  welcomeCard: {
    padding: Theme.spacing.s18,
    borderRadius: Theme.radius.r20,
    backgroundColor: Theme.colors.cardTranslucentSoft,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarm,
    ...Theme.shadows.cardSoftLarge,
  },
  welcomeTitle: {
    fontSize: Theme.typography.size.s16,
    fontWeight: Theme.typography.weight.semiBold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.s6,
  },
  welcomeText: {
    fontSize: Theme.typography.size.s13,
    color: Theme.colors.textSecondary,
  },
  bubbleRow: {
    flexDirection: 'row',
  },
  bubbleRowUser: {
    justifyContent: 'flex-end',
  },
  bubbleRowOwner: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: Theme.percent.p78,
    paddingHorizontal: Theme.spacing.s14,
    paddingVertical: Theme.spacing.s10,
    borderRadius: Theme.radius.r18,
  },
  bubbleUser: {
    backgroundColor: Theme.colors.successDeep,
    borderTopRightRadius: Theme.radius.r6,
  },
  bubbleOwner: {
    backgroundColor: Theme.colors.cardTranslucent,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarmAlt,
    borderTopLeftRadius: Theme.radius.r6,
  },
  bubbleText: {
    fontSize: Theme.typography.size.s14,
    color: Theme.colors.text,
  },
  bubbleTextUser: {
    color: Theme.colors.textInverse,
  },
  inputDock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.s10,
    paddingHorizontal: Theme.spacing.s16,
    paddingVertical: Theme.spacing.s10,
    borderTopWidth: Theme.borderWidth.hairline,
    borderTopColor: Theme.colors.borderWarmStrong,
    backgroundColor: Theme.colors.overlaySoft,
  },
  input: {
    flex: Theme.layout.full,
    minHeight: Theme.sizes.s44,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarmAlt,
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.r22,
    paddingHorizontal: Theme.spacing.s16,
    fontSize: Theme.typography.size.s14,
    color: Theme.colors.text,
  },
  sendButton: {
    paddingHorizontal: Theme.spacing.s14,
    paddingVertical: Theme.spacing.s10,
    borderRadius: Theme.radius.r20,
    backgroundColor: Theme.colors.successDeep,
  },
  sendButtonPressed: {
    transform: [{ scale: Theme.scale.pressedSoft }],
  },
  sendButtonDisabled: {
    opacity: Theme.opacity.o6,
  },
  sendButtonText: {
    fontSize: Theme.typography.size.s14,
    color: Theme.colors.textInverse,
    fontWeight: Theme.typography.weight.semiBold,
  },
  errorText: {
    paddingHorizontal: Theme.spacing.s20,
    paddingBottom: Theme.spacing.s6,
    fontSize: Theme.typography.size.s12,
    color: Theme.colors.textError,
  },
  emptyState: {
    flex: Theme.layout.full,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Theme.spacing.s8,
  },
  emptyTitle: {
    fontSize: Theme.typography.size.s16,
    fontWeight: Theme.typography.weight.semiBold,
    color: Theme.colors.text,
  },
  emptyText: {
    fontSize: Theme.typography.size.s13,
    color: Theme.colors.textSecondary,
  },
  loginButton: {
    marginTop: Theme.spacing.s8,
    paddingHorizontal: Theme.spacing.s16,
    paddingVertical: Theme.spacing.s10,
    borderRadius: Theme.radius.r18,
    backgroundColor: Theme.colors.primary,
  },
  loginButtonPressed: {
    transform: [{ scale: Theme.scale.pressedSoft }],
  },
  loginButtonText: {
    fontSize: Theme.typography.size.s13,
    color: Theme.colors.textInverse,
    fontWeight: Theme.typography.weight.semiBold,
  },
  loadingState: {
    flex: Theme.layout.full,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Theme.spacing.s8,
  },
  loadingText: {
    fontSize: Theme.typography.size.s13,
    color: Theme.colors.textSecondary,
  },
});
