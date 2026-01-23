import * as React from 'react';
import type { ComponentProps } from 'react';
import { Image } from 'expo-image';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import type { PetCardData } from '@/types/pet';
import { Theme } from '@/constants/theme';

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
  const avatarUri =
    pet.icon === 'cat'
      ? `https://placekitten.com/${imageDimension}/${imageDimension}`
      : `https://placedog.net/${imageDimension}/${imageDimension}?id=${avatarId}`;
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
  const metaItems: { icon: FontAwesome5IconName; text: string }[] = [
    {
      icon: 'map-marker-alt',
      text: pet.distance?.trim() ? pet.distance : '距离待定',
    },
    {
      icon: 'birthday-cake',
      text: pet.age?.trim() ? pet.age : '年龄待定',
    },
    {
      icon: breedIcon,
      text: pet.breed?.trim() ? pet.breed : '品种待定',
    },
  ];

  return (
    <Pressable
      onPress={() => router.push(`/pet/${pet.id}`)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <View style={styles.cardTop}>
        <View style={[styles.avatarRing, { backgroundColor: avatarTone }]}>
          <Image source={{ uri: avatarUri }} style={styles.avatar} contentFit="cover" />
        </View>
        <View style={styles.cardBody}>
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
              <FontAwesome5 name={genderIcon} size={Theme.sizes.s16} color={genderIconColor} />
            </View>
          </View>
          {showTags ? (
            <View style={styles.tagRow}>
              {energyLabel ? (
                <View style={[styles.tagPill, styles.tagEnergy]}>
                  <Text style={styles.tagText}>{energyLabel}</Text>
                </View>
              ) : null}
              {confidenceLabel ? (
                <View style={[styles.tagPill, styles.tagConfidence]}>
                  <Text style={styles.tagText}>{confidenceLabel}</Text>
                </View>
              ) : null}
            </View>
          ) : null}
          <View style={styles.metaRow}>
            {metaItems.map((item) => (
              <View key={`${pet.id}-${item.icon}`} style={styles.metaItem}>
                <FontAwesome5
                  name={item.icon}
                  size={Theme.sizes.s16}
                  color={Theme.colors.textWarm}
                />
                <Text style={styles.metaText}>{item.text}</Text>
              </View>
            ))}
          </View>
          {pet.trait?.trim() ? <Text style={styles.traitText}>{pet.trait}</Text> : null}
        </View>
      </View>
      <View style={styles.cta}>
        <FontAwesome5 name="arrow-right" size={Theme.sizes.s16} color={Theme.colors.ctaText} />
        <Text style={styles.ctaText}>点击查看详细信息</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Theme.spacing.s12,
    padding: Theme.spacing.s18,
    backgroundColor: Theme.colors.cardTranslucentStrong,
    borderRadius: Theme.radius.r24,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarmStrong,
    ...Theme.shadows.cardSoftLarge,
  },
  cardPressed: {
    transform: [{ scale: Theme.scale.pressedSoft }],
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.s16,
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
    gap: Theme.spacing.s6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.s8,
  },
  petName: {
    fontSize: Theme.typography.size.s20,
    fontWeight: Theme.typography.weight.bold,
    color: Theme.colors.textWarmStrong,
  },
  genderBadge: {
    width: Theme.sizes.s30,
    height: Theme.sizes.s30,
    borderRadius: Theme.sizes.s30 / 2,
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
    fontWeight: Theme.typography.weight.medium,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Theme.spacing.s12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.s4,
  },
  metaText: {
    fontSize: Theme.typography.size.s12,
    color: Theme.colors.textWarm,
  },
  traitText: {
    fontSize: Theme.typography.size.s12,
    color: Theme.colors.textMuted,
  },
  cta: {
    height: Theme.sizes.s44,
    borderRadius: Theme.radius.pill,
    backgroundColor: Theme.colors.ctaBackground,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.ctaBorder,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Theme.spacing.s6,
  },
  ctaText: {
    fontSize: Theme.typography.size.s14,
    color: Theme.colors.ctaText,
    fontWeight: Theme.typography.weight.semiBold,
  },
});
