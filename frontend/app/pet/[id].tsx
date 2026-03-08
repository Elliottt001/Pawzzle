import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Text } from '@/components/base-text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Theme } from '@/constants/theme';
import { HARDCODED_PETS } from '@/app/(tabs)/pets';

export default function PetDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const rawId = Array.isArray(id) ? id[0] : id;

  const pet = HARDCODED_PETS.find((p) => p.id === rawId) ?? null;

  if (!pet) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={{ color: '#5C4033', fontSize: 16 }}>未找到宠物</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isFemale = pet.gender === '母';
  const genderBgColor = isFemale ? '#FFB6C1' : '#8DCEFF';
  const genderIconName = isFemale ? 'venus' : 'mars';
  const tags = pet.tags ?? [];

  return (
    <View style={styles.safeArea}>
      {/* Background gradient */}
      <View style={styles.bgGradient} pointerEvents="none">
        <Svg width="100%" height="100%" viewBox="0 0 378 315" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="detailGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#FEFFD4" stopOpacity={1} />
              <Stop offset="100%" stopColor="#FFFEF9" stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="378" height="315" fill="url(#detailGradient)" />
        </Svg>
      </View>

      {/* Decorative glow blobs */}
      <View style={styles.glowBlob1} />
      <View style={styles.glowBlob2} />
      <View style={styles.glowBlob3} />

      <SafeAreaView style={styles.safeInner}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={styles.backButton}
          >
            <FontAwesome5 name="chevron-left" size={11} color="#9CA3AF" />
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
          {pet.imageSource ? (
            <Image source={pet.imageSource} style={styles.heroImage} contentFit="cover" />
          ) : (
            <Image source={{ uri: pet.imageUrl ?? '' }} style={styles.heroImage} contentFit="cover" />
          )}

          {/* Name + gender */}
          <View style={styles.nameRow}>
            <Text style={styles.petName}>{pet.name}</Text>
            <View style={[styles.genderBadge, { backgroundColor: genderBgColor }]}>
              <FontAwesome5 name={genderIconName} size={12} color="#FFFFFF" />
            </View>
          </View>

          {/* Location + distance */}
          <View style={styles.locationRow}>
            <FontAwesome5 name="map-marker-alt" size={12} color="#9CA3AF" />
            <Text style={styles.locationText}>
              {pet.location ?? ''}（{pet.distance}）
            </Text>
          </View>

          {/* Tags */}
          {tags.length > 0 ? (
            <View style={styles.tagsContainer}>
              <View style={styles.tagsRow}>
                {tags.map((tag) => (
                  <View key={tag} style={styles.tagBadge}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Info cards: Age / Health / Neutered */}
          <View style={styles.infoCardsRow}>
            <View style={styles.infoCardSmall}>
              <Text style={styles.infoCardLabel}>年龄</Text>
              <Text style={styles.infoCardValue}>{(pet.age ?? '--').replace('岁', '')}</Text>
            </View>
            <View style={styles.infoCardWide}>
              <Text style={styles.infoCardLabel}>健康状况</Text>
              <Text style={styles.infoCardValueSmall} numberOfLines={3}>
                {pet.energy}
              </Text>
            </View>
            <View style={styles.infoCardSmall}>
              <Text style={styles.infoCardLabel}>是否绝育</Text>
              <Text style={styles.infoCardValue}>
                {pet.neutered ? (pet.neutered === '已绝育' ? '是' : '否') : '--'}
              </Text>
            </View>
          </View>

          {/* Institution info */}
          <View style={styles.ownerSection}>
            <View style={styles.ownerRow}>
              <View style={styles.ownerAvatar}>
                <Image
                  source={require('@/assets/images/pet-detail-protection.jpg')}
                  style={styles.ownerAvatarImage}
                />
              </View>
              <View style={styles.ownerInfo}>
                <Text style={styles.ownerName}>浙大动保</Text>
                <Text style={styles.ownerType}>公益机构</Text>
              </View>
            </View>
          </View>

          {/* Story */}
          {pet.story ? (
            <View style={styles.storyCard}>
              <Text style={styles.storyLabel}>故事</Text>
              <Text style={styles.storyText}>{pet.story}</Text>
            </View>
          ) : null}

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Bottom action bar */}
        <View style={styles.bottomBar}>
          <View style={styles.heartButton}>
            <FontAwesome5 name="heart" size={18} color="#FFFFFF" solid />
          </View>
          <Pressable style={styles.chatButton}>
            <Text style={styles.chatButtonText}>点击私聊出宠方</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const WARM_CARD_BG = 'rgba(244, 193, 127, 0.21)';
const WARM_BROWN_MUTED = 'rgba(135, 91, 71, 0.58)';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFEF9',
  },
  safeInner: {
    flex: 1,
  },
  bgGradient: {
    position: 'absolute',
    left: -3,
    right: -3,
    top: -3,
    height: 315,
  },
  glowBlob1: {
    position: 'absolute',
    width: 224,
    height: 224,
    right: -50,
    top: 478,
    backgroundColor: 'rgba(254, 255, 233, 0.31)',
    borderRadius: 9999,
  },
  glowBlob2: {
    position: 'absolute',
    width: 224,
    height: 224,
    right: -60,
    top: 424,
    backgroundColor: 'rgba(244, 193, 127, 0.08)',
    borderRadius: 9999,
  },
  glowBlob3: {
    position: 'absolute',
    width: 224,
    height: 224,
    left: -67,
    top: 146,
    backgroundColor: 'rgba(244, 193, 127, 0.08)',
    borderRadius: 9999,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 25,
    height: 44,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: 56,
  },
  backText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: Theme.fonts.regular,
  },
  headerTitle: {
    fontSize: 20,
    color: '#5C4033',
    fontFamily: Theme.fonts.regular,
    lineHeight: 23,
  },
  headerRight: {
    width: 56,
  },

  /* Scroll */
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 25,
    paddingBottom: 100,
  },

  /* Hero image */
  heroImage: {
    width: 326,
    height: 228,
    borderRadius: 32,
    alignSelf: 'center',
    marginTop: 8,
  },

  /* Name + gender */
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
  },
  petName: {
    fontSize: 24,
    color: '#5C4033',
    fontFamily: Theme.fonts.regular,
    letterSpacing: 1.44,
    lineHeight: 28,
  },
  genderBadge: {
    width: 22,
    height: 22,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Location */
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginTop: 5,
  },
  locationText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: Theme.fonts.regular,
    lineHeight: 23,
  },

  /* Tags */
  tagsContainer: {
    marginTop: 9,
    gap: 6,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tagBadge: {
    paddingHorizontal: 10,
    backgroundColor: '#ED843F',
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: Theme.fonts.regular,
    lineHeight: 23,
    letterSpacing: 0.72,
  },

  /* Info cards */
  infoCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 19,
  },
  infoCardSmall: {
    width: 74,
    height: 64,
    paddingTop: 6,
    paddingBottom: 6,
    backgroundColor: WARM_CARD_BG,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  infoCardWide: {
    flex: 1,
    height: 64,
    paddingTop: 6,
    paddingHorizontal: 7,
    backgroundColor: WARM_CARD_BG,
    borderRadius: 16,
    alignItems: 'center',
  },
  infoCardLabel: {
    fontSize: 8,
    color: WARM_BROWN_MUTED,
    fontFamily: Theme.fonts.regular,
    lineHeight: 23,
  },
  infoCardValue: {
    fontSize: 14,
    color: '#875B47',
    fontFamily: Theme.fonts.regular,
    lineHeight: 23,
  },
  infoCardValueSmall: {
    fontSize: 10,
    color: '#875B47',
    fontFamily: Theme.fonts.regular,
    lineHeight: 14,
    textAlign: 'center',
  },

  /* Owner section */
  ownerSection: {
    marginTop: 19,
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  ownerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#F4C17F',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFEF9',
    overflow: 'hidden',
  },
  ownerAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 9999,
  },
  ownerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  ownerName: {
    fontSize: 14,
    color: '#5C4033',
    fontFamily: Theme.fonts.regular,
    lineHeight: 23,
    letterSpacing: 0.84,
  },
  ownerType: {
    fontSize: 8,
    color: '#9CA3AF',
    fontFamily: Theme.fonts.regular,
    lineHeight: 23,
  },

  /* Story card */
  storyCard: {
    marginTop: 19,
    paddingHorizontal: 11,
    paddingVertical: 8,
    backgroundColor: WARM_CARD_BG,
    borderRadius: 12,
  },
  storyLabel: {
    fontSize: 10,
    color: WARM_BROWN_MUTED,
    fontFamily: Theme.fonts.regular,
    lineHeight: 23,
  },
  storyText: {
    fontSize: 12,
    color: '#875B47',
    fontFamily: Theme.fonts.regular,
    lineHeight: 18,
  },

  bottomSpacer: {
    height: 40,
  },

  /* Bottom bar */
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 84,
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 22,
    backgroundColor: '#FDF4E4',
    borderTopWidth: 1,
    borderTopColor: '#F4C17F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 45,
    shadowColor: 'rgba(244, 193, 127, 0.27)',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 12,
  },
  heartButton: {
    width: 41,
    height: 41,
    backgroundColor: '#FFB6C1',
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatButton: {
    width: 216,
    paddingHorizontal: 48,
    paddingVertical: 10,
    backgroundColor: '#ED843F',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(244, 193, 127, 0.30)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
  },
  chatButtonText: {
    textAlign: 'center',
    color: '#FEFFD4',
    fontSize: 18,
    fontFamily: Theme.fonts.regular,
    lineHeight: 26,
    letterSpacing: 1.08,
  },
});
