import * as React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { ComponentProps } from 'react';

type PetCard = {
  id: string;
  name: string;
  breed: string;
  age: string;
  energy: string;
  trait: string;
  distance: string;
  icon: ComponentProps<typeof FontAwesome5>['name'];
  tone: string;
};

const pets: PetCard[] = [
  {
    id: 'p1',
    name: 'Mochi',
    breed: 'Corgi',
    age: '2 yrs',
    energy: 'Playful',
    trait: 'Loves sunrise walks and snack puzzles.',
    distance: '2.1 km',
    icon: 'dog',
    tone: '#FDE2B3',
  },
  {
    id: 'p2',
    name: 'Luna',
    breed: 'British Shorthair',
    age: '3 yrs',
    energy: 'Calm',
    trait: 'Apartment-friendly and gentle with guests.',
    distance: '3.6 km',
    icon: 'cat',
    tone: '#DCEBFF',
  },
  {
    id: 'p3',
    name: 'Rio',
    breed: 'Mini Poodle',
    age: '1 yr',
    energy: 'Smart',
    trait: 'Quick learner, loves puzzle toys.',
    distance: '1.4 km',
    icon: 'paw',
    tone: '#E5F5DE',
  },
  {
    id: 'p4',
    name: 'Hazel',
    breed: 'Shiba Inu',
    age: '4 yrs',
    energy: 'Independent',
    trait: 'Enjoys calm mornings and steady routines.',
    distance: '4.8 km',
    icon: 'dog',
    tone: '#FFE1E1',
  },
];

export default function HomeScreen() {
  const [query, setQuery] = React.useState('');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.background}>
        <View style={[styles.blob, styles.blobLeft]} />
        <View style={[styles.blob, styles.blobRight]} />
        <View style={[styles.blob, styles.blobBottom]} />
      </View>

      <View style={styles.header}>
        <Text style={styles.overline}>Find a Companion</Text>
        <Text style={styles.title}>Pet Match Home</Text>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Feather name="search" size={18} color="#6B7280" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by breed, size, or vibe..."
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
          />
        </View>
        <View style={styles.filterButton}>
          <Feather name="sliders" size={18} color="#111827" />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.cardList}>
        {pets.map((pet) => (
          <View key={pet.id} style={styles.card}>
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
                {pet.breed} • {pet.age}
              </Text>
              <Text style={styles.petTrait}>{pet.trait}</Text>
              <View style={styles.distanceRow}>
                <Feather name="map-pin" size={14} color="#6B7280" />
                <Text style={styles.distanceText}>{pet.distance} away</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FDF7F0',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  blob: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.6,
  },
  blobLeft: {
    top: -70,
    left: -40,
    backgroundColor: '#FCE6CE',
  },
  blobRight: {
    top: 20,
    right: -50,
    backgroundColor: '#DFF3E5',
  },
  blobBottom: {
    bottom: -70,
    left: '35%',
    backgroundColor: '#DCEFFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 6,
  },
  overline: {
    fontSize: 11,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: '#6B7280',
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#111827',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#EFE3D6',
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: '#EFE3D6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 2,
  },
  cardList: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 120,
    gap: 14,
  },
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
    gap: 6,
  },
  distanceText: {
    fontSize: 12,
    color: '#6B7280',
  },
});
