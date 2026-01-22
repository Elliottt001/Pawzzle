import * as React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import type { PetCardData } from '@/types/pet';
import { Theme } from '@/constants/theme';

type PetCardProps = {
  pet: PetCardData;
  confidence?: number;
};

export function PetCard({ pet, confidence }: PetCardProps) {
  const router = useRouter();
  const confidenceLabel =
    typeof confidence === 'number' ? `匹配度 ${Math.round(confidence * 100)}%` : null;

  return (
    <Pressable onPress={() => router.push(`/pet/${pet.id}`)}>
      <View style={styles.card}>
        <View style={[styles.iconWrap, { backgroundColor: pet.tone }]}>
          <FontAwesome5 name={pet.icon} size={Theme.sizes.s22} color={Theme.colors.textEmphasis} />
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <Text style={styles.petName}>{pet.name}</Text>
            <View style={styles.pillRow}>
              <View style={styles.energyPill}>
                <Text style={styles.energyText}>{pet.energy}</Text>
              </View>
              {confidenceLabel ? (
                <View style={styles.confidencePill}>
                  <Text style={styles.confidenceText}>{confidenceLabel}</Text>
                </View>
              ) : null}
            </View>
          </View>
          <Text style={styles.petMeta}>
            {pet.breed} - {pet.age}
          </Text>
          <Text style={styles.petTrait}>{pet.trait}</Text>
          <View style={styles.distanceRow}>
            <Text style={styles.distanceText}>
              {pet.distance ? `距离：${pet.distance}` : '距离：待定'}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: Theme.spacing.s14,
    padding: Theme.spacing.s16,
    backgroundColor: Theme.colors.cardTranslucentStrong,
    borderRadius: Theme.radius.r22,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarm,
    ...Theme.shadows.card,
  },
  iconWrap: {
    width: Theme.sizes.s56,
    height: Theme.sizes.s56,
    borderRadius: Theme.radius.r18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: Theme.layout.full,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Theme.spacing.s10,
  },
  petName: {
    fontSize: Theme.typography.size.s18,
    fontWeight: Theme.typography.weight.semiBold,
    color: Theme.colors.text,
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.s6,
  },
  energyPill: {
    paddingHorizontal: Theme.spacing.s10,
    paddingVertical: Theme.spacing.s4,
    borderRadius: Theme.radius.pill,
    backgroundColor: Theme.colors.successSurface,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.successBorder,
  },
  energyText: {
    fontSize: Theme.typography.size.s12,
    color: Theme.colors.successStrong,
    fontWeight: Theme.typography.weight.semiBold,
  },
  confidencePill: {
    paddingHorizontal: Theme.spacing.s10,
    paddingVertical: Theme.spacing.s4,
    borderRadius: Theme.radius.pill,
    backgroundColor: Theme.colors.warningSurface,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.warningBorder,
  },
  confidenceText: {
    fontSize: Theme.typography.size.s12,
    color: Theme.colors.warningText,
    fontWeight: Theme.typography.weight.semiBold,
  },
  petMeta: {
    marginTop: Theme.spacing.s4,
    fontSize: Theme.typography.size.s13,
    color: Theme.colors.textSecondary,
  },
  petTrait: {
    marginTop: Theme.spacing.s8,
    fontSize: Theme.typography.size.s14,
    color: Theme.colors.textEmphasis,
  },
  distanceRow: {
    marginTop: Theme.spacing.s10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: Theme.typography.size.s12,
    color: Theme.colors.textSecondary,
  },
});
