import * as React from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { PetCard } from '@/components/pet-card';
import { petCards } from '@/data/pets';

const categories = [
  { id: 'all', label: 'All' },
  { id: 'cards', label: 'Pet Cards' },
  { id: 'updates', label: 'Updates' },
  { id: 'guides', label: 'Guides' },
] as const;

type CategoryId = (typeof categories)[number]['id'];

type InfoItem = {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  tone: string;
};

const updates: InfoItem[] = [
  {
    id: 'u1',
    title: 'Meet Maple',
    subtitle: 'A gentle beagle just arrived and loves couch naps.',
    tag: 'New',
    tone: '#FCE7CF',
  },
  {
    id: 'u2',
    title: 'Weekend adoption fair',
    subtitle: 'Saturday 10am to 4pm at Riverside Park.',
    tag: 'Event',
    tone: '#DCEBFF',
  },
  {
    id: 'u3',
    title: 'Trainer Q and A',
    subtitle: 'Short answers on house training and leash manners.',
    tag: 'Live',
    tone: '#E7F5DE',
  },
];

const guides: InfoItem[] = [
  {
    id: 'g1',
    title: 'Apartment ready pets',
    subtitle: 'Low shed coats and calm energy tips.',
    tag: 'Guide',
    tone: '#EAF2FF',
  },
  {
    id: 'g2',
    title: 'First week checklist',
    subtitle: 'Supplies, routines, and settling in safely.',
    tag: 'Checklist',
    tone: '#FCE9E0',
  },
  {
    id: 'g3',
    title: 'Cat and dog intros',
    subtitle: 'Slow steps for gentle introductions.',
    tag: 'Tips',
    tone: '#E8F5EE',
  },
];

export default function HomeScreen() {
  const [query, setQuery] = React.useState('');
  const [activeCategory, setActiveCategory] = React.useState<CategoryId>('all');

  const normalized = query.trim().toLowerCase();
  const visiblePets =
    normalized.length === 0
      ? petCards
      : petCards.filter((pet) =>
          [pet.name, pet.breed, pet.energy, pet.trait].some((field) =>
            field.toLowerCase().includes(normalized)
          )
        );

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

      <View style={styles.categoryRow}>
        {categories.map((category) => {
          const isActive = activeCategory === category.id;
          return (
            <Pressable
              key={category.id}
              onPress={() => setActiveCategory(category.id)}
              style={({ pressed }) => [
                styles.categoryPill,
                isActive && styles.categoryPillActive,
                pressed && styles.categoryPillPressed,
              ]}>
              <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                {category.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {activeCategory === 'all' || activeCategory === 'cards' ? (
          <Section title="Pet Cards" subtitle={`${visiblePets.length} matches`}>
            <View style={styles.cardList}>
              {visiblePets.map((pet) => (
                <PetCard key={pet.id} pet={pet} />
              ))}
            </View>
          </Section>
        ) : null}

        {activeCategory === 'all' || activeCategory === 'updates' ? (
          <Section title="Updates" subtitle="Latest activity">
            <View style={styles.infoList}>
              {updates.map((item) => (
                <InfoCard key={item.id} item={item} />
              ))}
            </View>
          </Section>
        ) : null}

        {activeCategory === 'all' || activeCategory === 'guides' ? (
          <Section title="Guides" subtitle="Quick knowledge">
            <View style={styles.infoList}>
              {guides.map((item) => (
                <InfoCard key={item.id} item={item} />
              ))}
            </View>
          </Section>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionSubtitle}>{subtitle}</Text>
        </View>
        <Feather name="chevron-right" size={18} color="#9CA3AF" />
      </View>
      {children}
    </View>
  );
}

function InfoCard({ item }: { item: InfoItem }) {
  return (
    <View style={styles.infoCard}>
      <View style={[styles.infoTag, { backgroundColor: item.tone }]}>
        <Text style={styles.infoTagText}>{item.tag}</Text>
      </View>
      <Text style={styles.infoTitle}>{item.title}</Text>
      <Text style={styles.infoSubtitle}>{item.subtitle}</Text>
    </View>
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
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 6,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1,
    borderColor: '#EFE3D6',
  },
  categoryPillActive: {
    backgroundColor: '#157B57',
    borderColor: '#157B57',
  },
  categoryPillPressed: {
    transform: [{ scale: 0.98 }],
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 140,
    gap: 18,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  cardList: {
    gap: 14,
  },
  infoList: {
    gap: 12,
  },
  infoCard: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1,
    borderColor: '#EFE3D6',
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 2,
  },
  infoTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 8,
  },
  infoTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1F2937',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  infoSubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: '#6B7280',
  },
});
