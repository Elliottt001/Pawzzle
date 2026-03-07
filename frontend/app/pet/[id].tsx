import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Theme } from '@/constants/theme';
import { API_BASE_URL } from '@/lib/apiBase';

const resolvePetImageUri = (imageUrl?: string | null) => {
  if (!imageUrl) {
    return null;
  }
  if (/^(https?:|file:|blob:|data:)/.test(imageUrl)) {
    return imageUrl;
  }
  const normalized = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  return `${API_BASE_URL}${normalized}`;
};

type Pet = {
  id: number;
  name: string;
  species: 'CAT' | 'DOG';
  status: 'OPEN' | 'MATCHED' | 'ADOPTED';
  breed: string | null;
  age: string | null;
  gender: string | null;
  neutered: string | null;
  healthStatus: string | null;
  energy: string | null;
  trait: string | null;
  description: string;
  tags: object;
  imageUrl?: string | null;
  icon?: string | null;
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
        const response = await fetch(`${API_BASE_URL}/api/pets/${apiId}`);
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

  const fallbackImage = (pet.icon === 'cat' || pet.species === 'CAT') ? `https://placecats.com/500/500` : `https://placedog.net/500/500?id=${pet.id}`;
  const heroImage = resolvePetImageUri(pet.imageUrl) ?? fallbackImage;

  const isFemale = pet.gender === '女' || pet.gender === '母' || pet.gender === 'Female';
  const genderBgColor = isFemale ? Theme.colors.genderFemaleBg : Theme.colors.genderMaleBg;
  const genderIconName = isFemale ? 'venus' : 'mars';

  return (
    <View style={styles.safeArea}>
      {/* Background gradient overlay */}
      <LinearGradient
        colors={[Theme.colors.authWeChatBg, 'rgba(255, 254, 249, 0)']}
        style={styles.bgGradient}
      />

      {/* Decorative glow blobs */}
      <View style={styles.glowBlob1} />
      <View style={styles.glowBlob2} />
      <View style={styles.glowBlob3} />

      <SafeAreaView style={styles.safeInner}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={Theme.spacing.s12}
            style={styles.backButton}
          >
            <FontAwesome5 name="chevron-left" size={Theme.typography.size.s12} color={Theme.colors.placeholder} />
            <Text style={styles.backText}>返回</Text>
          </Pressable>
          <Text style={styles.headerTitle}>详情</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Hero image */}
          <Image source={{ uri: heroImage }} style={styles.heroImage} />

          {/* Pet name + gender */}
          <View style={styles.nameRow}>
            <Text style={styles.petName}>{pet.name}</Text>
            {pet.gender ? (
              <View style={[styles.genderBadge, { backgroundColor: genderBgColor }]}>
                <FontAwesome5
                  name={genderIconName}
                  size={Theme.typography.size.s12}
                  color={Theme.colors.textInverse}
                />
              </View>
            ) : null}
          </View>

          {/* Institution / owner location */}
          {pet.ownerName ? (
            <Pressable
              onPress={pet.ownerId ? () => router.push(`/user/${pet.ownerId}`) : undefined}
              style={styles.locationRow}
            >
              <FontAwesome5 name="map-marker-alt" size={Theme.typography.size.s12} color={Theme.colors.distanceAccent} />
              <Text style={styles.locationText}>
                {pet.ownerName}
                {pet.ownerType === 'INSTITUTION' ? '' : ''}
              </Text>
            </Pressable>
          ) : null}

          {/* Three info cards */}
          <View style={styles.infoCardsRow}>
            <View style={styles.infoCardSmall}>
              <Text style={styles.infoCardLabel}>年龄</Text>
              <Text style={styles.infoCardValue}>{pet.age ?? '--'}</Text>
            </View>
            <View style={styles.infoCardWide}>
              <Text style={styles.infoCardLabel}>健康状况</Text>
              <Text style={styles.infoCardValueSmall} numberOfLines={2}>
                {pet.healthStatus ?? '暂无信息'}
              </Text>
            </View>
            <View style={styles.infoCardSmall}>
              <Text style={styles.infoCardLabel}>是否绝育</Text>
              <Text style={styles.infoCardValue}>{pet.neutered ?? '--'}</Text>
            </View>
          </View>

          {/* Trait / description section */}
          {(pet.trait || pet.description) ? (
            <View style={styles.traitSection}>
              <Text style={styles.sectionTitle}>性格特点</Text>
              <Text style={styles.traitText}>{pet.trait || pet.description}</Text>
            </View>
          ) : null}

          {/* Owner info section */}
          <View style={styles.ownerSection}>
            {pet.ownerId ? (
              <Pressable
                onPress={() => router.push(`/user/${pet.ownerId}`)}
                style={({ pressed }) => [
                  styles.ownerRow,
                  pressed && styles.ownerRowPressed,
                ]}
              >
                <View style={styles.ownerAvatar}>
                  <FontAwesome5 name="user" size={Theme.spacing.s24} color={Theme.colors.authDarkBrown} />
                </View>
                <View style={styles.ownerInfo}>
                  <Text style={styles.ownerName}>{pet.ownerName ?? '未命名'}</Text>
                  <View style={styles.ownerMetaRow}>
                    {pet.breed ? (
                      <View style={styles.metaItem}>
                        <FontAwesome5 name="paw" size={Theme.typography.size.s12} color={Theme.colors.authDarkBrown} />
                        <Text style={styles.metaText}>{pet.breed}</Text>
                      </View>
                    ) : null}
                    <View style={styles.metaItem}>
                      <FontAwesome5 name="tag" size={Theme.typography.size.s12} color={Theme.colors.authDarkBrown} />
                      <Text style={styles.metaText}>
                        {getSpeciesLabel(pet.species)} · {getStatusLabel(pet.status)}
                      </Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            ) : (
              <Text style={styles.noInfo}>暂无送养人信息</Text>
            )}
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    </View>
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



const WARM_CARD_BG = 'rgba(244, 193, 127, 0.21)';
const WARM_BROWN_MUTED = 'rgba(135, 91, 71, 0.58)';

const styles = StyleSheet.create({
  safeArea: {
    flex: Theme.layout.full,
    backgroundColor: Theme.colors.backgroundAuth,
  },
  safeInner: {
    flex: Theme.layout.full,
  },
  bgGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 315,
  },
  glowBlob1: {
    position: 'absolute',
    width: 224,
    height: 224,
    right: -50,
    top: 478,
    backgroundColor: Theme.colors.authGlowYellow,
    borderRadius: Theme.radius.pill,
  },
  glowBlob2: {
    position: 'absolute',
    width: 224,
    height: 224,
    right: -60,
    top: 424,
    backgroundColor: Theme.colors.authGlowWarm,
    borderRadius: Theme.radius.pill,
  },
  glowBlob3: {
    position: 'absolute',
    width: 224,
    height: 224,
    left: -67,
    top: 146,
    backgroundColor: Theme.colors.authGlowWarm,
    borderRadius: Theme.radius.pill,
  },
  center: {
    flex: Theme.layout.full,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.s24,
    height: Theme.sizes.s44,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.s4,
    width: Theme.sizes.s60,
  },
  backText: {
    fontSize: Theme.typography.size.s14,
    color: Theme.colors.placeholder,
    fontFamily: Theme.fonts.regular,
  },
  headerTitle: {
    fontSize: Theme.typography.size.s20,
    color: Theme.colors.authDarkBrown,
    fontFamily: Theme.fonts.regular,
  },
  headerRight: {
    width: Theme.sizes.s60,
  },

  /* Scroll */
  scrollContainer: {
    flex: Theme.layout.full,
  },
  scrollContent: {
    paddingHorizontal: Theme.spacing.s24,
  },

  /* Hero image */
  heroImage: {
    width: '100%' as const,
    height: 228,
    borderRadius: Theme.radius.r32,
    marginTop: Theme.spacing.s12,
  },

  /* Name + gender */
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.s6,
    marginTop: Theme.spacing.s20,
  },
  petName: {
    fontSize: Theme.typography.size.s24,
    color: Theme.colors.authDarkBrown,
    fontFamily: Theme.fonts.regular,
    letterSpacing: 1.44,
  },
  genderBadge: {
    width: Theme.sizes.s22,
    height: Theme.sizes.s22,
    borderRadius: Theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Location */
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.s8,
    marginTop: Theme.spacing.s4,
  },
  locationText: {
    fontSize: Theme.typography.size.s12,
    color: Theme.colors.distanceAccent,
    fontFamily: Theme.fonts.regular,
  },

  /* Info cards row */
  infoCardsRow: {
    flexDirection: 'row',
    gap: Theme.spacing.s10,
    marginTop: Theme.spacing.s18,
  },
  infoCardSmall: {
    width: 74,
    height: 64,
    backgroundColor: WARM_CARD_BG,
    borderRadius: Theme.radius.r16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Theme.spacing.s6,
  },
  infoCardWide: {
    flex: Theme.layout.full,
    height: 64,
    backgroundColor: WARM_CARD_BG,
    borderRadius: Theme.radius.r16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Theme.spacing.s8,
    paddingVertical: Theme.spacing.s6,
  },
  infoCardLabel: {
    fontSize: Theme.typography.size.s11,
    color: WARM_BROWN_MUTED,
    fontFamily: Theme.fonts.regular,
    marginBottom: Theme.spacing.s2,
  },
  infoCardValue: {
    fontSize: Theme.typography.size.s14,
    color: Theme.colors.authDarkBrown,
    fontFamily: Theme.fonts.regular,
  },
  infoCardValueSmall: {
    fontSize: Theme.typography.size.s11,
    color: Theme.colors.authDarkBrown,
    fontFamily: Theme.fonts.regular,
    textAlign: 'center',
    lineHeight: Theme.typography.lineHeight.s16,
  },

  /* Trait section */
  traitSection: {
    marginTop: Theme.spacing.s22,
    gap: Theme.spacing.s8,
  },
  sectionTitle: {
    fontSize: Theme.typography.size.s16,
    color: Theme.colors.authDarkBrown,
    fontFamily: Theme.fonts.semiBold,
  },
  traitText: {
    fontSize: Theme.typography.size.s13,
    color: Theme.colors.authDarkBrown,
    fontFamily: Theme.fonts.regular,
    lineHeight: Theme.typography.lineHeight.s20,
    opacity: Theme.opacity.o7,
  },

  /* Owner section */
  ownerSection: {
    marginTop: Theme.spacing.s22,
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.s14,
  },
  ownerRowPressed: {
    transform: [{ scale: Theme.scale.pressedSoft }],
  },
  ownerAvatar: {
    width: Theme.sizes.s66,
    height: Theme.sizes.s66,
    borderRadius: Theme.radius.pill,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.ctaBackground,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.backgroundAuth,
  },
  ownerInfo: {
    flex: Theme.layout.full,
    gap: Theme.spacing.s4,
  },
  ownerName: {
    fontSize: Theme.typography.size.s24,
    color: Theme.colors.authDarkBrown,
    fontFamily: Theme.fonts.regular,
    letterSpacing: 1.44,
  },
  ownerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.s16,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.s6,
  },
  metaText: {
    fontSize: Theme.typography.size.s12,
    color: Theme.colors.authDarkBrown,
    fontFamily: Theme.fonts.regular,
  },
  noInfo: {
    fontSize: Theme.typography.size.s14,
    color: Theme.colors.textSecondary,
    fontStyle: 'italic',
  },

  bottomSpacer: {
    height: Theme.spacing.s40,
  },
});
