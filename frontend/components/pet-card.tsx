import * as React from 'react';
import type { ComponentProps } from 'react';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/base-text';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import type { PetCardData } from '@/types/pet';
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

type PetCardProps = {
  pet: PetCardData;
  confidence?: number;
};

type FontAwesome5IconName = ComponentProps<typeof FontAwesome5>['name'];

export function PetCard({ pet, confidence }: PetCardProps) {
  const router = useRouter();
  const confidencePercent =
    typeof confidence === 'number' ? `${Math.round(confidence * 100)}%` : null;
  const imageDimension = 200;
  const avatarSeed = Number.parseInt(pet.id, 10);
  const avatarId = Number.isFinite(avatarSeed) ? avatarSeed : 1;
  const fallbackAvatarUri =
    pet.icon === 'cat'
      ? `https://placekitten.com/${imageDimension}/${imageDimension}`
      : `https://placedog.net/${imageDimension}/${imageDimension}?id=${avatarId}`;
  const avatarUri = resolvePetImageUri(pet.imageUrl) ?? fallbackAvatarUri;
  const isFemale = pet.icon === 'cat';
  const genderIcon: FontAwesome5IconName = isFemale ? 'venus' : 'mars';
  const genderBgColor = isFemale ? '#FFB6C1' : '#8DCEFF';
  const genderIconColor = '#FFFFFF';
  const breedIcon: FontAwesome5IconName =
    pet.icon === 'cat' ? 'cat' : pet.icon === 'dog' ? 'dog' : 'paw';

  // Split energy/trait into tag pills
  const tags = React.useMemo(() => {
    const result: string[] = [];
    if (pet.energy?.trim()) result.push(pet.energy.trim());
    // If trait contains comma-separated short labels, use them as tags
    // Otherwise we show trait as description below
    return result;
  }, [pet.energy]);

  return (
    <Pressable
      onPress={() => router.push(`/pet/${pet.id}`)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      {/* Confidence badge - floating top-right */}
      {confidencePercent ? (
        <View style={styles.confidenceBadge}>
          <View style={styles.confidenceBadgeShine} />
          <Text style={styles.confidenceLabel}>匹配度</Text>
          <Text style={styles.confidenceValue}>{confidencePercent}</Text>
        </View>
      ) : null}

      {/* Top section: avatar + info */}
      <View style={styles.cardTop}>
        <View style={styles.avatarRing}>
          <Image source={{ uri: avatarUri }} style={styles.avatar} contentFit="cover" />
        </View>
        <View style={styles.cardBody}>
          {/* Name + Gender */}
          <View style={styles.nameRow}>
            <Text style={styles.petName}>{pet.name}</Text>
            <View style={[styles.genderBadge, { backgroundColor: genderBgColor }]}>
              <FontAwesome5 name={genderIcon} size={12} color={genderIconColor} />
            </View>
          </View>
          {/* Distance */}
          <View style={styles.distanceRow}>
            <FontAwesome5 name="map-marker-alt" size={12} color="#ED843F" />
            <Text style={styles.distanceText}>
              {pet.distance?.trim() ? pet.distance : '距离待定'}
            </Text>
          </View>
          {/* Age + Breed */}
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <FontAwesome5 name="birthday-cake" size={14} color="#5C4033" />
              <Text style={styles.infoText}>{pet.age?.trim() ? pet.age : '年龄待定'}</Text>
            </View>
            <View style={styles.infoItem}>
              <FontAwesome5 name={breedIcon} size={14} color="#5C4033" />
              <Text style={styles.infoText}>{pet.breed?.trim() ? pet.breed : '品种待定'}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Tags row */}
      {tags.length > 0 ? (
        <View style={styles.tagRow}>
          {tags.map((tag, index) => (
            <View key={index} style={styles.tagPill}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Description */}
      {pet.trait?.trim() ? (
        <View style={styles.traitWrap}>
          <Text style={styles.traitText} numberOfLines={3}>
            {pet.trait}
          </Text>
        </View>
      ) : null}

      {/* CTA button */}
      <View style={styles.cta}>
        <FontAwesome5 name="chevron-right" size={11} color="#FFFFFF" />
        <Text style={styles.ctaText}>点击查看详细信息</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 326,
    paddingTop: 21,
    paddingBottom: 10,
    paddingHorizontal: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.50)',
    borderRadius: 32,
    shadowColor: 'rgba(244, 193, 127, 0.44)',
    shadowOffset: { width: 6, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 7.3,
    elevation: 6,
    gap: 6,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },
  confidenceBadge: {
    position: 'absolute',
    top: -20,
    right: 21,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 36,
    backgroundColor: '#FFFBF5',
    borderWidth: 1,
    borderColor: 'rgba(244, 193, 127, 0.37)',
    shadowColor: 'rgba(244, 193, 127, 0.43)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 9.3,
    elevation: 8,
    zIndex: 10,
    overflow: 'hidden',
  },
  confidenceBadgeShine: {
    position: 'absolute',
    width: 13,
    height: 30,
    left: 25,
    top: -3,
    backgroundColor: 'white',
    opacity: 0.6,
    transform: [{ rotate: '47deg' }],
  },
  confidenceLabel: {
    fontSize: 10,
    fontFamily: Theme.fonts.regular,
    color: '#ED843F',
    lineHeight: 11,
    letterSpacing: 0.6,
  },
  confidenceValue: {
    fontSize: 32,
    fontFamily: Theme.fonts.matchScore,
    color: '#ED843F',
    lineHeight: 28,
    letterSpacing: 1.92,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  avatarRing: {
    width: 69,
    height: 69,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#F4C17F',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 9999,
  },
  cardBody: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  petName: {
    fontSize: 24,
    fontFamily: Theme.fonts.regular,
    color: '#5C4033',
    letterSpacing: 1.44,
    lineHeight: 28,
  },
  genderBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  distanceText: {
    fontSize: 12,
    fontFamily: Theme.fonts.regular,
    color: '#ED843F',
    lineHeight: 23,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 19,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 12,
    fontFamily: Theme.fonts.regular,
    color: '#5C4033',
    lineHeight: 23,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  tagPill: {
    paddingHorizontal: 10,
    backgroundColor: '#D2D1D1',
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagText: {
    fontSize: 12,
    fontFamily: Theme.fonts.regular,
    color: '#FFFFFF',
    lineHeight: 23,
    letterSpacing: 0.72,
  },
  traitWrap: {
    paddingVertical: 7,
    borderRadius: 4,
  },
  traitText: {
    fontSize: 15,
    fontFamily: Theme.fonts.regular,
    color: '#5C4033',
    lineHeight: 23,
  },
  cta: {
    height: 30,
    borderRadius: 36,
    backgroundColor: '#F4C17F',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 2,
    paddingHorizontal: 84,
  },
  ctaText: {
    fontSize: 12,
    fontFamily: Theme.fonts.regular,
    color: '#FFFFFF',
    letterSpacing: 0.72,
    lineHeight: 20,
  },
});
