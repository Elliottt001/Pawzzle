import * as React from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { Theme } from '@/constants/theme';
import { fetchThreads, type ChatThread } from '@/lib/chatApi';
import {
  getGuestMode,
  getSession,
  subscribeGuestMode,
  subscribeSession,
  type AuthSession,
} from '@/lib/session';

export default function ChatsScreen() {
  const router = useRouter();
  const [threads, setThreads] = React.useState<ChatThread[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [session, setSessionState] = React.useState<AuthSession | null>(() => getSession());
  const [guestMode, setGuestModeState] = React.useState(() => getGuestMode());
  const isLoggedIn = Boolean(session?.token);
  const canBrowse = isLoggedIn || guestMode;

  React.useEffect(() => {
    const unsubscribe = subscribeSession((nextSession) => {
      setSessionState(nextSession);
    });
    return unsubscribe;
  }, []);

  React.useEffect(() => {
    const unsubscribe = subscribeGuestMode((nextGuest) => {
      setGuestModeState(nextGuest);
    });
    return unsubscribe;
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (!session?.token) {
        setThreads([]);
        setLoading(false);
        setLoadError(null);
        return undefined;
      }
      let isActive = true;
      setLoading(true);
      setLoadError(null);
      fetchThreads(session.token)
        .then((data) => {
          if (isActive) {
            setThreads(data ?? []);
          }
        })
        .catch((error) => {
          if (isActive) {
            const message = error instanceof Error ? error.message : '加载私聊失败';
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
    }, [session?.token])
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>私聊</Text>
        <Text style={styles.subtitle}>与送养人保持联系，随时沟通。</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {!canBrowse ? (
          <View style={styles.emptyCard}>
            <FontAwesome5
              name="comment-dots"
              size={Theme.sizes.s34}
              color={Theme.colors.textSecondary}
            />
            <Text style={styles.emptyTitle}>登录后查看私聊</Text>
            <Text style={styles.emptyText}>请先登录后再使用私聊功能。</Text>
            <Pressable
              onPress={() => router.push('/')}
              style={({ pressed }) => [
                styles.loginButton,
                pressed && styles.loginButtonPressed,
              ]}>
              <Text style={styles.loginButtonText}>去登录</Text>
            </Pressable>
          </View>
        ) : loadError ? (
          <View style={styles.emptyCard}>
            <FontAwesome5
              name="comment-dots"
              size={Theme.sizes.s34}
              color={Theme.colors.textSecondary}
            />
            <Text style={styles.emptyTitle}>加载失败</Text>
            <Text style={styles.emptyText}>{loadError}</Text>
          </View>
        ) : loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="small" color={Theme.colors.textSecondary} />
            <Text style={styles.loadingText}>正在加载私聊...</Text>
          </View>
        ) : threads.length === 0 ? (
          <View style={styles.emptyCard}>
            <FontAwesome5
              name="comment-dots"
              size={Theme.sizes.s34}
              color={Theme.colors.textSecondary}
            />
            <Text style={styles.emptyTitle}>暂无私聊</Text>
            <Text style={styles.emptyText}>去宠物卡片里联系送养人吧。</Text>
          </View>
        ) : (
          <View style={styles.threadList}>
            {threads.map((thread) => {
              const lastMessage = thread.messages[thread.messages.length - 1];
              return (
                <Pressable
                  key={thread.id}
                  onPress={() => router.push(`/chat/${thread.id}`)}
                  style={({ pressed }) => [
                    styles.threadCard,
                    pressed && styles.threadCardPressed,
                  ]}>
                  <View style={styles.avatar}>
                    <FontAwesome5 name="user" size={Theme.sizes.s18} color={Theme.colors.text} />
                  </View>
                  <View style={styles.threadBody}>
                    <View style={styles.threadHeader}>
                      <Text style={styles.threadName}>{thread.ownerName}</Text>
                      {thread.petName ? (
                        <View style={styles.petPill}>
                          <Text style={styles.petPillText}>{thread.petName}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.threadPreview}>
                      {lastMessage ? lastMessage.text : '点击开始对话'}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: Theme.layout.full,
    backgroundColor: Theme.colors.backgroundWarmAlt,
  },
  header: {
    paddingHorizontal: Theme.spacing.s20,
    paddingTop: Theme.spacing.s12,
    paddingBottom: Theme.spacing.s8,
    gap: Theme.spacing.s6,
  },
  title: {
    fontSize: Theme.typography.size.s22,
    fontWeight: Theme.typography.weight.semiBold,
    color: Theme.colors.text,
  },
  subtitle: {
    fontSize: Theme.typography.size.s13,
    color: Theme.colors.textSecondary,
  },
  content: {
    paddingHorizontal: Theme.spacing.s20,
    paddingBottom: Theme.sizes.s120,
    gap: Theme.spacing.s12,
  },
  emptyCard: {
    padding: Theme.spacing.s24,
    backgroundColor: Theme.colors.cardTranslucentSoft,
    borderRadius: Theme.radius.r24,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarm,
    alignItems: 'center',
    gap: Theme.spacing.s10,
    ...Theme.shadows.cardSoftLarge,
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
  loadingCard: {
    padding: Theme.spacing.s20,
    borderRadius: Theme.radius.r20,
    backgroundColor: Theme.colors.cardTranslucentSoft,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarm,
    alignItems: 'center',
    gap: Theme.spacing.s10,
  },
  loadingText: {
    fontSize: Theme.typography.size.s13,
    color: Theme.colors.textSecondary,
  },
  threadList: {
    gap: Theme.spacing.s12,
  },
  threadCard: {
    flexDirection: 'row',
    gap: Theme.spacing.s12,
    padding: Theme.spacing.s14,
    borderRadius: Theme.radius.r20,
    backgroundColor: Theme.colors.cardTranslucentSoft,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarm,
    ...Theme.shadows.card,
  },
  threadCardPressed: {
    transform: [{ scale: Theme.scale.pressedSoft }],
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
  threadBody: {
    flex: Theme.layout.full,
    gap: Theme.spacing.s6,
  },
  threadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.s8,
  },
  threadName: {
    fontSize: Theme.typography.size.s16,
    fontWeight: Theme.typography.weight.semiBold,
    color: Theme.colors.text,
  },
  petPill: {
    paddingHorizontal: Theme.spacing.s8,
    paddingVertical: Theme.spacing.s2,
    borderRadius: Theme.radius.pill,
    backgroundColor: Theme.colors.warningSurface,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.warningBorder,
  },
  petPillText: {
    fontSize: Theme.typography.size.s11,
    color: Theme.colors.warningText,
    fontWeight: Theme.typography.weight.semiBold,
  },
  threadPreview: {
    fontSize: Theme.typography.size.s13,
    color: Theme.colors.textSecondary,
  },
});
