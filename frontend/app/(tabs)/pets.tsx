import * as React from 'react';
import { Image } from 'expo-image';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Text } from '@/components/base-text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { PetCard } from '@/components/pet-card';
import type { PetCardData } from '@/types/pet';
import { Theme } from '@/constants/theme';
import { API_BASE_URL } from '@/lib/apiBase';
import { getSession, subscribeSession, type AuthSession } from '@/lib/session';

const HERO_IMAGE_URL = `https://placedog.net/${Theme.sizes.s300}/${Theme.sizes.s200}?id=120`;

type UserProfileResponse = {
  id: number;
  name: string;
  userType: 'INDIVIDUAL' | 'INSTITUTION' | null;
  pets: PetCardData[];
};

export default function PetsScreen() {
  const [session, setSessionState] = React.useState<AuthSession | null>(() => getSession());
  const [pets, setPets] = React.useState<PetCardData[]>([]);
  const [search, setSearch] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const unsubscribe = subscribeSession((nextSession) => {
      setSessionState(nextSession);
    });
    return unsubscribe;
  }, []);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    async function loadPets() {
      try {
        const isInstitution = session?.user?.userType === 'INSTITUTION' && session?.user?.id;
        const response = isInstitution
          ? await fetch(`${API_BASE_URL}/api/users/${session.user.id}`)
          : await fetch(`${API_BASE_URL}/api/pets`);
        if (!response.ok) {
          throw new Error('获取宠物卡片失败');
        }
        const data = isInstitution
          ? ((await response.json()) as UserProfileResponse).pets
          : ((await response.json()) as PetCardData[]);
        if (active) {
          setPets(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : '';
        if (active) {
          setError(/[\u4e00-\u9fff]/.test(message) ? message : '获取宠物卡片失败');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    loadPets();
    return () => {
      active = false;
    };
  }, [session?.user?.id, session?.user?.userType]);

  const query = search.trim().toLowerCase();
  const filteredPets = query
    ? pets.filter((pet) => {
        const haystack = `${pet.name} ${pet.breed} ${pet.energy}`.toLowerCase();
        return haystack.includes(query);
      })
    : pets;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.background}>
        <View style={styles.gradientBackdrop} pointerEvents="none">
          <Svg width="100%" height="100%" viewBox="0 0 378 315" preserveAspectRatio="none">
            <Defs>
              <LinearGradient id="petsGradient" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#FEFFD4" stopOpacity={1} />
                <Stop offset="100%" stopColor="#FFFEF9" stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="378" height="315" fill="url(#petsGradient)" />
          </Svg>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Image source={{ uri: HERO_IMAGE_URL }} style={styles.heroImage} contentFit="cover" />
        </View>

        <View style={styles.searchBar}>
          <FontAwesome5 name="search" size={Theme.sizes.s18} color={Theme.colors.textPlaceholder} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="搜索"
            placeholderTextColor={Theme.colors.textPlaceholder}
            selectionColor={Theme.colors.primary}
            style={styles.searchInput}
          />
        </View>

        <View style={styles.list}>
          {loading ? (
            <View style={styles.statusWrap}>
              <ActivityIndicator size="large" color={Theme.colors.primary} />
            </View>
          ) : null}
          {!loading && error ? (
            <View style={styles.statusWrap}>
              <Text style={styles.errorText}>错误：{error}</Text>
            </View>
          ) : null}
          {!loading && !error && filteredPets.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>暂无匹配结果</Text>
              <Text style={styles.emptyText}>换个关键词试试。</Text>
            </View>
          ) : null}
          {filteredPets.map((pet) => (
            <PetCard key={pet.id} pet={pet} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: Theme.layout.full,
    backgroundColor: Theme.colors.backgroundWarmAlt,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 315,
  },
  content: {
    paddingHorizontal: 0, // 移除这里的 padding，因为子元素已经固定宽度并居中了
    paddingTop: Theme.spacing.s10,
    paddingBottom: Theme.sizes.s140,
    gap: Theme.spacing.s16,
    alignItems: 'center', // 确保内容容器内的所有项目居中
  },
  heroCard: {
    borderRadius: Theme.radius.r16,
    overflow: 'hidden',
    backgroundColor: Theme.colors.card,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarm,
    alignSelf: 'center', // 确保这个也居中，防万一
    width: 326, // 统一宽度以便居中效果更明显
    ...Theme.shadows.cardSoftLarge,
  },
  heroImage: {
    width: '100%',
    height: Theme.sizes.s120,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.s10,
    paddingHorizontal: Theme.spacing.s18,
    minHeight: Theme.sizes.s44,
    backgroundColor: Theme.colors.card,
    borderRadius: 30,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.searchBorder,
    alignSelf: 'center', // 确保搜索栏也居中对齐
    width: 326,
  },
  searchInput: {
    flex: Theme.layout.full,
    fontSize: Theme.typography.size.s15,
    color: Theme.colors.textWarmStrong,
    paddingVertical: Theme.spacing.s2,
  },
  list: {
    gap: Theme.spacing.s16,
    alignItems: 'center', // 确保卡片在列表中居中
  },
  statusWrap: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.s10,
  },
  errorText: {
    color: Theme.colors.textError,
    fontSize: Theme.typography.size.s13,
  },
  emptyCard: {
    padding: Theme.spacing.s18,
    backgroundColor: Theme.colors.cardTranslucentSoft,
    borderRadius: Theme.radius.r24,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarm,
    gap: Theme.spacing.s6,
  },
  emptyTitle: {
    fontSize: Theme.typography.size.s16,
    fontFamily: Theme.fonts.semiBold,
    color: Theme.colors.textWarmStrong,
  },
  emptyText: {
    fontSize: Theme.typography.size.s13,
    color: Theme.colors.textMuted,
  },
});
