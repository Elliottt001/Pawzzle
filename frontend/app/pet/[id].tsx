import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Theme } from '@/constants/theme';
import { createThread, requestAdoption } from '@/lib/chatApi';
import { getSession, subscribeSession, type AuthSession } from '@/lib/session';

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080');

type Pet = {
  id: number;
  name: string;
  species: 'CAT' | 'DOG';
  status: 'OPEN' | 'MATCHED' | 'ADOPTED';
  description: string;
  tags: object;
  ownerId: number | null;
  ownerName: string | null;
  ownerType: 'INDIVIDUAL' | 'INSTITUTION' | null;
};

export default function PetDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSessionState] = useState<AuthSession | null>(() => getSession());
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [adoptionLoading, setAdoptionLoading] = useState(false);
  const [adoptionError, setAdoptionError] = useState<string | null>(null);

  useEffect(() => {
    const rawId = Array.isArray(id) ? id[0] : id;
    const apiId = normalizePetId(rawId);

    if (!apiId) {
      setError('缺少宠物ID');
      setLoading(false);
      return;
    }

    async function fetchPet() {
      try {
        const response = await fetch(`${API_URL}/api/pets/${apiId}`);
        if (!response.ok) {
          throw new Error('获取宠物详情失败');
        }
        const data = await response.json();
        setPet(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : '';
        setError(/[\u4e00-\u9fff]/.test(message) ? message : '获取宠物信息失败');
      } finally {
        setLoading(false);
      }
    }

    fetchPet();
  }, [id]);

  useEffect(() => {
    const unsubscribe = subscribeSession((nextSession) => {
      setSessionState(nextSession);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (session?.token) {
      setChatError(null);
      setAdoptionError(null);
    }
  }, [session?.token]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.center}>
          <ActivityIndicator size="large" />
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (error || !pet) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.center}>
          <ThemedText>错误：{error || '未找到宠物'}</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  const isOwner = session?.user?.id === pet.ownerId;
  const canRequestAdoption = pet.status === 'OPEN' && !isOwner;

  const handleStartChat = async () => {
    if (!pet.ownerId) {
      return;
    }
    if (!session?.token) {
      setChatError('请先登录后再私聊。');
      router.push('/');
      return;
    }
    if (chatLoading) {
      return;
    }
    setChatLoading(true);
    setChatError(null);
    try {
      const thread = await createThread(
        { ownerId: pet.ownerId, petId: pet.id },
        session.token
      );
      router.push(`/chat/${thread.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      setChatError(/[\u4e00-\u9fff]/.test(message) ? message : '创建私聊失败');
    } finally {
      setChatLoading(false);
    }
  };

  const handleRequestAdoption = async () => {
    if (!pet.ownerId) {
      return;
    }
    if (!session?.token) {
      setAdoptionError('请先登录后再申请领养。');
      router.push('/');
      return;
    }
    if (session.user.id === pet.ownerId) {
      setAdoptionError('不能申请自己发布的宠物。');
      return;
    }
    if (pet.status !== 'OPEN') {
      setAdoptionError('该宠物已被领养或暂不可领养。');
      return;
    }
    if (adoptionLoading) {
      return;
    }
    setAdoptionLoading(true);
    setAdoptionError(null);
    try {
      const thread = await createThread(
        { ownerId: pet.ownerId, petId: pet.id },
        session.token
      );
      await requestAdoption(thread.id, session.token);
      router.push(`/chat/${thread.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      setAdoptionError(/[\u4e00-\u9fff]/.test(message) ? message : '申请领养失败');
    } finally {
      setAdoptionLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollContainer}>
        <ThemedView style={styles.container}>
          <Image
            source={{ uri: `https://placedog.net/500/500?id=${pet.id}` }}
            style={styles.image}
          />

          <ThemedView style={styles.detailsContainer}>
            <ThemedText type="title">{pet.name}</ThemedText>
            <ThemedText type="subtitle" style={styles.status}>
              {getSpeciesLabel(pet.species)} • {getStatusLabel(pet.status)}
            </ThemedText>

            <ThemedText type="defaultSemiBold" style={styles.sectionHeader}>简介</ThemedText>
            <ThemedText>{pet.description}</ThemedText>

            <ThemedView style={styles.ownerCard}>
              <ThemedText type="title" style={styles.ownerTitle}>发布者</ThemedText>
              {pet.ownerId ? (
                <>
                  <Pressable
                    onPress={() => router.push(`/user/${pet.ownerId}`)}
                    style={({ pressed }) => [
                      styles.ownerRow,
                      pressed && styles.ownerRowPressed,
                    ]}>
                    <View style={styles.ownerAvatar}>
                      <FontAwesome5 name="user" size={Theme.sizes.s24} color={Theme.colors.text} />
                    </View>
                    <View>
                      <ThemedText type="defaultSemiBold">
                        {pet.ownerName ?? '未命名'}
                      </ThemedText>
                      <ThemedText style={styles.ownerMeta}>
                        {getUserTypeLabel(pet.ownerType)}
                      </ThemedText>
                    </View>
                  </Pressable>
                  <Pressable
                    onPress={handleStartChat}
                    disabled={chatLoading}
                    style={({ pressed }) => [
                      styles.chatButton,
                      pressed && styles.chatButtonPressed,
                      chatLoading && styles.chatButtonDisabled,
                    ]}>
                    <ThemedText style={styles.chatButtonText}>
                      {chatLoading ? '正在创建...' : '私聊发布者'}
                    </ThemedText>
                  </Pressable>
                  {!isOwner ? (
                    <Pressable
                      onPress={handleRequestAdoption}
                      disabled={adoptionLoading || !canRequestAdoption}
                      style={({ pressed }) => [
                        styles.adoptionButton,
                        pressed && canRequestAdoption && styles.adoptionButtonPressed,
                        (adoptionLoading || !canRequestAdoption) && styles.adoptionButtonDisabled,
                      ]}>
                      <ThemedText style={styles.adoptionButtonText}>
                        {adoptionLoading
                          ? '提交中...'
                          : pet.status === 'OPEN'
                            ? '申请领养'
                            : '暂不可领养'}
                      </ThemedText>
                    </Pressable>
                  ) : null}
                  {chatError ? (
                    <ThemedText style={styles.chatErrorText}>{chatError}</ThemedText>
                  ) : null}
                  {adoptionError ? (
                    <ThemedText style={styles.adoptionErrorText}>{adoptionError}</ThemedText>
                  ) : null}
                </>
              ) : (
                  <ThemedText style={styles.noInfo}>暂无送养人信息。</ThemedText>
              )}
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

function normalizePetId(value?: string | null) {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.startsWith('p') && trimmed.length > 1) {
    return trimmed.slice(1);
  }
  return trimmed;
}

function getSpeciesLabel(species: Pet['species']) {
  const labels: Record<Pet['species'], string> = {
    CAT: '猫',
    DOG: '狗',
  };
  return labels[species] ?? species;
}

function getStatusLabel(status: Pet['status']) {
  const labels: Record<Pet['status'], string> = {
    OPEN: '待领养',
    MATCHED: '已匹配',
    ADOPTED: '已领养',
  };
  return labels[status] ?? status;
}

function getUserTypeLabel(userType: Pet['ownerType']) {
  if (userType === 'INSTITUTION') {
    return '机构用户 (VIP)';
  }
  if (userType === 'INDIVIDUAL') {
    return '普通用户';
  }
  return '未知类型';
}

const styles = StyleSheet.create({
  safeArea: {
    flex: Theme.layout.full,
    backgroundColor: Theme.colors.background,
  },
  scrollContainer: {
    flex: Theme.layout.full,
  },
  container: {
    flex: Theme.layout.full,
    minHeight: Theme.percent.p100,
  },
  center: {
    flex: Theme.layout.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: Theme.percent.p100,
    height: Theme.sizes.s300,
    resizeMode: 'cover',
  },
  detailsContainer: {
    padding: Theme.spacing.s16,
    gap: Theme.spacing.s12,
  },
  status: {
    opacity: Theme.opacity.o7,
    marginBottom: Theme.spacing.s8,
  },
  sectionHeader: {
    marginTop: Theme.spacing.s12,
  },
  ownerCard: {
    marginTop: Theme.spacing.s24,
    padding: Theme.spacing.s16,
    borderRadius: Theme.radius.r12,
    backgroundColor: Theme.colors.neutralAlpha,
    gap: Theme.spacing.s12,
  },
  ownerTitle: {
    fontSize: Theme.typography.size.s18,
    marginBottom: Theme.spacing.s8,
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.s12,
  },
  ownerRowPressed: {
    transform: [{ scale: Theme.scale.pressedSoft }],
  },
  ownerAvatar: {
    width: Theme.sizes.s48,
    height: Theme.sizes.s48,
    borderRadius: Theme.radius.r24,
    backgroundColor: Theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarm,
  },
  ownerMeta: {
    marginTop: Theme.spacing.s2,
    fontSize: Theme.typography.size.s12,
    color: Theme.colors.textSecondary,
  },
  chatButton: {
    alignSelf: 'flex-start',
    marginTop: Theme.spacing.s8,
    paddingVertical: Theme.spacing.s8,
    paddingHorizontal: Theme.spacing.s16,
    borderRadius: Theme.radius.r20,
    backgroundColor: Theme.colors.successDeep,
  },
  chatButtonPressed: {
    transform: [{ scale: Theme.scale.pressedSoft }],
  },
  chatButtonDisabled: {
    opacity: Theme.opacity.o6,
  },
  chatButtonText: {
    color: Theme.colors.textInverse,
    fontSize: Theme.typography.size.s13,
    fontFamily: Theme.fonts.semiBold,
  },
  adoptionButton: {
    alignSelf: 'flex-start',
    marginTop: Theme.spacing.s8,
    paddingVertical: Theme.spacing.s8,
    paddingHorizontal: Theme.spacing.s16,
    borderRadius: Theme.radius.r20,
    backgroundColor: Theme.colors.primary,
  },
  adoptionButtonPressed: {
    transform: [{ scale: Theme.scale.pressedSoft }],
  },
  adoptionButtonDisabled: {
    opacity: Theme.opacity.o6,
  },
  adoptionButtonText: {
    color: Theme.colors.textInverse,
    fontSize: Theme.typography.size.s13,
    fontFamily: Theme.fonts.semiBold,
  },
  chatErrorText: {
    fontSize: Theme.typography.size.s12,
    color: Theme.colors.textError,
  },
  adoptionErrorText: {
    fontSize: Theme.typography.size.s12,
    color: Theme.colors.textError,
  },
  noInfo: {
    fontStyle: 'italic',
    opacity: Theme.opacity.o7,
  },
});
