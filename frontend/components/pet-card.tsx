import * as React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import type { PetCardData } from '@/data/pets';

type PetCardProps = {
  pet: PetCardData;
};

export function PetCard({ pet }: PetCardProps) {
  const router = useRouter();

  return (
    <Pressable onPress={() => router.push(`/pet/${pet.id}`)}>
      <View style={styles.card}>
        <View style={[styles.iconWrap, { backgroundColor: pet.tone }]}>
          <FontAwesome5 name={pet.icon} size={22} color="#1F2937" />
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <Text style={styles.petName}>{pet.name}</Text>
            <View style={styles.energyPill}>
              <Text style={styles.energyText}>{pet.energy}</Text>
            </View>
          </View>
          <Text style={styles.petMeta}>
            {pet.breed} - {pet.age}
          </Text>
          <Text style={styles.petTrait}>{pet.trait}</Text>
          <View style={styles.distanceRow}>
            <Text style={styles.distanceText}>{pet.distance} away</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 14,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#EFE3D6',
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 14,
    elevation: 3,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  petName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  energyPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#E8F5EE',
    borderWidth: 1,
    borderColor: '#CDE8D9',
  },
  energyText: {
    fontSize: 12,
    color: '#15803D',
    fontWeight: '600',
  },
  petMeta: {
    marginTop: 4,
    fontSize: 13,
    color: '#6B7280',
  },
  petTrait: {
    marginTop: 8,
    fontSize: 14,
    color: '#1F2937',
  },
  distanceRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 12,
    color: '#6B7280',
  },
});
