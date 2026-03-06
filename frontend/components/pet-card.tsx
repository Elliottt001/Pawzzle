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
  const confidenceLabel =
    typeof confidence === 'number' ? `匹配度 ${Math.round(confidence * 100)}%` : null;
  const energyLabel = pet.energy?.trim();
  const showTags = Boolean(energyLabel) || Boolean(confidenceLabel);
  const avatarTone = pet.tone || Theme.colors.decorativePeachSoft;
  const imageDimension = Theme.sizes.s200;
  const avatarSeed = Number.parseInt(pet.id, 10);
  const avatarId = Number.isFinite(avatarSeed) ? avatarSeed : 1;
  const fallbackAvatarUri =
    pet.icon === 'cat'
      ? `https://placekitten.com/${imageDimension}/${imageDimension}`
      : `https://placedog.net/${imageDimension}/${imageDimension}?id=${avatarId}`;
  const avatarUri = resolvePetImageUri(pet.imageUrl) ?? fallbackAvatarUri;
  const genderTone =
    pet.icon === 'cat' ? 'female' : pet.icon === 'dog' ? 'male' : 'neutral';
  const genderIcon: FontAwesome5IconName =
    genderTone === 'female' ? 'venus' : genderTone === 'male' ? 'mars' : 'paw';
  const genderIconColor =
    genderTone === 'female'
      ? Theme.colors.genderFemaleIcon
      : genderTone === 'male'
        ? Theme.colors.genderMaleIcon
        : Theme.colors.textWarm;
  const breedIcon: FontAwesome5IconName =
    pet.icon === 'cat' ? 'cat' : pet.icon === 'dog' ? 'dog' : 'paw';

  return (
    <Pressable
      onPress={() => router.push(`/pet/${pet.id}`)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <View style={styles.cardTop}>
        <View style={[styles.avatarRing, { backgroundColor: avatarTone }]}>
          <Image source={{ uri: avatarUri }} style={styles.avatar} contentFit="cover" />
        </View>
        <View style={styles.cardBody}>
          {/* Name + Gender */}
          <View style={styles.nameRow}>
            <Text style={styles.petName}>{pet.name}</Text>
            <View
              style={[
                styles.genderBadge,
                genderTone === 'female'
                  ? styles.genderBadgeFemale
                  : genderTone === 'male'
                    ? styles.genderBadgeMale
                    : styles.genderBadgeNeutral,
              ]}>
              <FontAwesome5 name={genderIcon} size={Theme.typography.size.s12} color={genderIconColor} />
            </View>
          </View>
          {/* Distance (orange accent) */}
          <View style={styles.distanceRow}>
            <FontAwesome5 name="map-marker-alt" size={Theme.typography.size.s12} color={Theme.colors.distanceAccent} />
            <Text style={styles.distanceText}>
              {pet.distance?.trim() ? pet.distance : '距离待定'}
            </Text>
          </View>
          {/* Age + Breed */}
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <FontAwesome5 name="birthday-cake" size={Theme.typography.size.s14} color={Theme.colors.textWarmStrong} />
              <Text style={styles.infoText}>{pet.age?.trim() ? pet.age : '年龄待定'}</Text>
            </View>
            <View style={styles.infoItem}>
              <FontAwesome5 name={breedIcon} size={Theme.typography.size.s14} color={Theme.colors.textWarmStrong} />
              <Text style={styles.infoText}>{pet.breed?.trim() ? pet.breed : '品种待定'}</Text>
            </View>
          </View>
          {/* Tags */}
          {showTags ? (
            <View style={styles.tagRow}>
              {energyLabel ? (
                <View style={[styles.tagPill, styles.tagEnergy]}>
                  <Text style={styles.tagText}>{energyLabel}</Text>
                </View>
              ) : null}
              {confidenceLabel ? (
                <View style={[styles.tagPill, styles.tagConfidence]}>
                  <Text style={[styles.tagText, styles.tagTextConfidence]}>
                    {confidenceLabel}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
          {/* Description */}
          {pet.trait?.trim() ? (
            <View style={styles.traitWrap}>
              <Text style={styles.traitText}>{pet.trait}</Text>
            </View>
          ) : null}
        </View>
      </View>
      <View style={styles.cta}>
        <FontAwesome5 name="chevron-right" size={Theme.typography.size.s11} color={Theme.colors.ctaText} />
        <Text style={styles.ctaText}>点击查看详细信息</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Theme.spacing.s6,
    paddingTop: 21,
    paddingBottom: Theme.spacing.s18,
    paddingHorizontal: 21,
    backgroundColor: Theme.colors.cardTranslucentLight,
    borderRadius: Theme.radius.r32,
    ...Theme.shadows.cardWarm,
  },
  cardPressed: {
    transform: [{ scale: Theme.scale.pressedSoft }],
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Theme.spacing.s14,
  },
  avatarRing: {
    width: Theme.sizes.s70,
    height: Theme.sizes.s70,
    borderRadius: Theme.sizes.s70 / 2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Theme.spacing.s4,
  },
  avatar: {
    width: Theme.sizes.s60,
    height: Theme.sizes.s60,
    borderRadius: Theme.sizes.s60 / 2,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.card,
    backgroundColor: Theme.colors.surfaceWarm,
  },
  cardBody: {
    flex: Theme.layout.full,
    gap: Theme.spacing.s4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.s4,
  },
  petName: {
    fontSize: Theme.typography.size.s24,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.textWarmStrong,
    letterSpacing: 1.44,
  },
  genderBadge: {
    width: Theme.sizes.s22,
    height: Theme.sizes.s22,
    borderRadius: Theme.sizes.s22 / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderBadgeFemale: {
    backgroundColor: Theme.colors.genderFemaleBg,
  },
  genderBadgeMale: {
    backgroundColor: Theme.colors.genderMaleBg,
  },
  genderBadgeNeutral: {
    backgroundColor: Theme.colors.decorativePeachSoft,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.s6,
  },
  distanceText: {
    fontSize: Theme.typography.size.s12,
    color: Theme.colors.distanceAccent,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.s18,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.s8,
  },
  infoText: {
    fontSize: Theme.typography.size.s12,
    color: Theme.colors.textWarmStrong,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Theme.spacing.s6,
  },
  tagPill: {
    paddingHorizontal: Theme.spacing.s8,
    paddingVertical: Theme.spacing.s2,
    borderRadius: Theme.radius.pill,
    borderWidth: Theme.borderWidth.hairline,
  },
  tagEnergy: {
    backgroundColor: Theme.colors.decorativePeachSoft,
    borderColor: Theme.colors.borderWarmSoft,
  },
  tagConfidence: {
    backgroundColor: Theme.colors.decorativeSkySoft,
    borderColor: Theme.colors.decorativeSkyAlt,
  },
  tagText: {
    fontSize: Theme.typography.size.s12,
    color: Theme.colors.textWarm,
    fontFamily: Theme.fonts.medium,
  },
  tagTextConfidence: {
    fontFamily: Theme.fonts.matchScore,
  },
  traitWrap: {
    paddingVertical: Theme.spacing.s6,
    borderRadius: Theme.radius.r4,
  },
  traitText: {
    fontSize: Theme.typography.size.s15,
    color: Theme.colors.textWarmStrong,
    lineHeight: 23,
  },
  cta: {
    paddingVertical: Theme.spacing.s4,
    borderRadius: Theme.radius.r36,
    backgroundColor: Theme.colors.ctaBackground,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Theme.spacing.s2,
  },
  ctaText: {
    fontSize: Theme.typography.size.s12,
    color: Theme.colors.ctaText,
    fontFamily: Theme.fonts.regular,
    letterSpacing: 0.72,
  },
});
