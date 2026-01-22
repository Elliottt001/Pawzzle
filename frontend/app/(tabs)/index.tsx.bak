import * as React from 'react';
import {
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { PetCard } from '@/components/pet-card';
import type { PetCardData } from '@/types/pet';

const categories = [
  { id: 'all', label: 'All' },
  { id: 'cards', label: 'Pet Cards' },
  { id: 'updates', label: 'Updates' },
  { id: 'guides', label: 'Guides' },
] as const;

const uploadTypes = [
  { id: 'card', label: 'Card' },
  { id: 'update', label: 'Update' },
  { id: 'guide', label: 'Guide' },
] as const;

const speciesOptions = [
  { id: 'CAT', label: 'Cat' },
  { id: 'DOG', label: 'Dog' },
] as const;

const breedOptions = {
  CAT: ['British Shorthair', 'Ragdoll', 'Siamese'],
  DOG: ['Corgi', 'Shiba Inu', 'Mini Poodle'],
} as const;

const locationOptions = ['杭州', '北京', '上海'] as const;

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080');

type CategoryId = (typeof categories)[number]['id'];
type UploadType = (typeof uploadTypes)[number]['id'];
type SpeciesId = (typeof speciesOptions)[number]['id'];

type InfoItem = {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  tone: string;
};

type HomeResponse = {
  petCards: PetCardData[];
  updates: InfoItem[];
  guides: InfoItem[];
};

export default function HomeScreen() {
  const [query, setQuery] = React.useState('');
  const [activeCategory, setActiveCategory] = React.useState<CategoryId>('all');
  const [petCards, setPetCards] = React.useState<PetCardData[]>([]);
  const [updates, setUpdates] = React.useState<InfoItem[]>([]);
  const [guides, setGuides] = React.useState<InfoItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [uploadType, setUploadType] = React.useState<UploadType>('card');
  const [cardName, setCardName] = React.useState('');
  const [cardSpecies, setCardSpecies] = React.useState<SpeciesId | null>(null);
  const [cardBreed, setCardBreed] = React.useState<string | null>(null);
  const [cardAge, setCardAge] = React.useState('');
  const [cardLocation, setCardLocation] = React.useState<string | null>(null);
  const [cardPersonality, setCardPersonality] = React.useState('');
  const [cardDescription, setCardDescription] = React.useState('');
  const [contentTitle, setContentTitle] = React.useState('');
  const [contentSubtitle, setContentSubtitle] = React.useState('');
  const [contentTag, setContentTag] = React.useState('');
  const [submitStatus, setSubmitStatus] = React.useState<
    'idle' | 'submitting' | 'success' | 'error'
  >('idle');
  const [submitMessage, setSubmitMessage] = React.useState<string | null>(null);

  const loadHomeData = React.useCallback(() => {
    let isActive = true;
    setIsLoading(true);
    setLoadError(null);

    fetch(`${API_BASE_URL}/api/home`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Failed to load home data');
        }
        return (await response.json()) as HomeResponse;
      })
      .then((data) => {
        if (!isActive) {
          return;
        }
        setPetCards(data?.petCards ?? []);
        setUpdates(data?.updates ?? []);
        setGuides(data?.guides ?? []);
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }
        const message = error instanceof Error ? error.message : 'Failed to load home data';
        setLoadError(message);
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  React.useEffect(() => {
    const cleanup = loadHomeData();
    return cleanup;
  }, [loadHomeData]);

  React.useEffect(() => {
    if (!cardSpecies) {
      setCardBreed(null);
      return;
    }
    const speciesBreeds = breedOptions[cardSpecies];
    if (cardBreed && !speciesBreeds.some((breed) => breed === cardBreed)) {
      setCardBreed(null);
    }
  }, [cardBreed, cardSpecies]);

  React.useEffect(() => {
    setSubmitStatus('idle');
    setSubmitMessage(null);
  }, [uploadType]);

  const normalized = query.trim().toLowerCase();
  const visiblePets =
    normalized.length === 0
      ? petCards
      : petCards.filter((pet) =>
          [pet.name, pet.breed, pet.energy, pet.trait, pet.distance].some((field) =>
            field ? field.toLowerCase().includes(normalized) : false
          )
        );
  const selectedBreeds = cardSpecies ? breedOptions[cardSpecies] : [];
  const isSubmitting = submitStatus === 'submitting';
  const contentLabel = uploadType === 'update' ? 'Update' : 'Guide';

  const handleCreateCard = async () => {
    if (isSubmitting) {
      return;
    }
    setSubmitStatus('submitting');
    setSubmitMessage(null);

    const name = cardName.trim();
    const personalityTag = cardPersonality.trim();
    const location = cardLocation?.trim() ?? '';
    const description = cardDescription.trim();
    const ageValue = Number(cardAge);

    if (!name) {
      setSubmitStatus('error');
      setSubmitMessage('Name is required.');
      return;
    }
    if (!cardSpecies) {
      setSubmitStatus('error');
      setSubmitMessage('Please pick a species.');
      return;
    }
    if (!cardBreed) {
      setSubmitStatus('error');
      setSubmitMessage('Please pick a breed.');
      return;
    }
    if (!cardAge || Number.isNaN(ageValue) || ageValue <= 0) {
      setSubmitStatus('error');
      setSubmitMessage('Age must be a positive number.');
      return;
    }
    if (!location) {
      setSubmitStatus('error');
      setSubmitMessage('Please pick a location.');
      return;
    }
    if (!personalityTag) {
      setSubmitStatus('error');
      setSubmitMessage('Personality tag is required.');
      return;
    }
    if (/\s/.test(personalityTag)) {
      setSubmitStatus('error');
      setSubmitMessage('Personality tag must be a single word.');
      return;
    }

    try {
      await postJson('/api/pets', {
        name,
        species: cardSpecies,
        breed: cardBreed,
        age: ageValue,
        location,
        personalityTag,
        description: description || undefined,
      });
      setSubmitStatus('success');
      setSubmitMessage('Card published.');
      setCardName('');
      setCardSpecies(null);
      setCardBreed(null);
      setCardAge('');
      setCardLocation(null);
      setCardPersonality('');
      setCardDescription('');
      loadHomeData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to publish card.';
      setSubmitStatus('error');
      setSubmitMessage(message);
    }
  };

  const handleCreateContent = async () => {
    if (isSubmitting) {
      return;
    }
    if (uploadType !== 'update' && uploadType !== 'guide') {
      return;
    }
    setSubmitStatus('submitting');
    setSubmitMessage(null);

    const title = contentTitle.trim();
    const subtitle = contentSubtitle.trim();
    const tag = contentTag.trim();

    if (!title || !subtitle) {
      setSubmitStatus('error');
      setSubmitMessage('Title and subtitle are required.');
      return;
    }

    try {
      await postJson('/api/home/content', {
        category: uploadType.toUpperCase(),
        title,
        subtitle,
        tag: tag || undefined,
      });
      setSubmitStatus('success');
      setSubmitMessage(`${contentLabel} published.`);
      setContentTitle('');
      setContentSubtitle('');
      setContentTag('');
      loadHomeData();
    } catch (error) {
      const message = error instanceof Error ? error.message : `Failed to publish ${contentLabel}.`;
      setSubmitStatus('error');
      setSubmitMessage(message);
    }
  };

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

      {loadError ? <Text style={styles.errorText}>{loadError}</Text> : null}

      <ScrollView contentContainerStyle={styles.content}>
        <Section title="Upload" subtitle="Add new cards and content">
          <View style={styles.formCard}>
            <View style={styles.uploadTypeRow}>
              {uploadTypes.map((type) => {
                const isActive = uploadType === type.id;
                return (
                  <Pressable
                    key={type.id}
                    onPress={() => setUploadType(type.id)}
                    style={({ pressed }) => [
                      styles.uploadTypePill,
                      isActive && styles.uploadTypePillActive,
                      pressed && styles.uploadTypePillPressed,
                    ]}>
                    <Text style={[styles.uploadTypeText, isActive && styles.uploadTypeTextActive]}>
                      {type.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {uploadType === 'card' ? (
              <View style={styles.formFields}>
                <FieldLabel text="Name" />
                <TextInput
                  value={cardName}
                  onChangeText={setCardName}
                  placeholder="Pet name"
                  placeholderTextColor="#9CA3AF"
                  style={styles.formInput}
                />

                <FieldLabel text="Species" />
                <View style={styles.choiceRow}>
                  {speciesOptions.map((option) => {
                    const isActive = cardSpecies === option.id;
                    return (
                      <Pressable
                        key={option.id}
                        onPress={() => setCardSpecies(option.id)}
                        style={({ pressed }) => [
                          styles.choicePill,
                          isActive && styles.choicePillActive,
                          pressed && styles.choicePillPressed,
                        ]}>
                        <Text style={[styles.choiceText, isActive && styles.choiceTextActive]}>
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <FieldLabel text="Breed" />
                {selectedBreeds.length ? (
                  <View style={styles.choiceRow}>
                    {selectedBreeds.map((breed) => {
                      const isActive = cardBreed === breed;
                      return (
                        <Pressable
                          key={breed}
                          onPress={() => setCardBreed(breed)}
                          style={({ pressed }) => [
                            styles.choicePill,
                            isActive && styles.choicePillActive,
                            pressed && styles.choicePillPressed,
                          ]}>
                          <Text style={[styles.choiceText, isActive && styles.choiceTextActive]}>
                            {breed}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : (
                  <Text style={styles.formHint}>Select a species to see breeds.</Text>
                )}

                <FieldLabel text="Age (years)" />
                <TextInput
                  value={cardAge}
                  onChangeText={(value) => setCardAge(value.replace(/[^0-9]/g, ''))}
                  placeholder="e.g. 2"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  style={styles.formInput}
                />

                <FieldLabel text="Location" />
                <View style={styles.choiceRow}>
                  {locationOptions.map((location) => {
                    const isActive = cardLocation === location;
                    return (
                      <Pressable
                        key={location}
                        onPress={() => setCardLocation(location)}
                        style={({ pressed }) => [
                          styles.choicePill,
                          isActive && styles.choicePillActive,
                          pressed && styles.choicePillPressed,
                        ]}>
                        <Text style={[styles.choiceText, isActive && styles.choiceTextActive]}>
                          {location}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <FieldLabel text="Personality tag (one word)" />
                <TextInput
                  value={cardPersonality}
                  onChangeText={setCardPersonality}
                  placeholder="Playful"
                  placeholderTextColor="#9CA3AF"
                  style={styles.formInput}
                  autoCapitalize="none"
                />

                <FieldLabel text="Description (optional)" />
                <TextInput
                  value={cardDescription}
                  onChangeText={setCardDescription}
                  placeholder="Short intro..."
                  placeholderTextColor="#9CA3AF"
                  style={[styles.formInput, styles.formInputMultiline]}
                  multiline
                />

                <Pressable
                  onPress={handleCreateCard}
                  disabled={isSubmitting}
                  style={({ pressed }) => [
                    styles.submitButton,
                    isSubmitting && styles.submitButtonDisabled,
                    pressed && !isSubmitting && styles.submitButtonPressed,
                  ]}>
                  <Text style={styles.submitButtonText}>
                    {isSubmitting ? 'Publishing...' : 'Publish Card'}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.formFields}>
                <FieldLabel text={`${contentLabel} title`} />
                <TextInput
                  value={contentTitle}
                  onChangeText={setContentTitle}
                  placeholder={`Enter a ${contentLabel.toLowerCase()} title`}
                  placeholderTextColor="#9CA3AF"
                  style={styles.formInput}
                />

                <FieldLabel text={`${contentLabel} subtitle`} />
                <TextInput
                  value={contentSubtitle}
                  onChangeText={setContentSubtitle}
                  placeholder="Short summary..."
                  placeholderTextColor="#9CA3AF"
                  style={styles.formInput}
                />

                <FieldLabel text="Tag (optional)" />
                <TextInput
                  value={contentTag}
                  onChangeText={setContentTag}
                  placeholder="New, Event, Tips..."
                  placeholderTextColor="#9CA3AF"
                  style={styles.formInput}
                />

                <Pressable
                  onPress={handleCreateContent}
                  disabled={isSubmitting}
                  style={({ pressed }) => [
                    styles.submitButton,
                    isSubmitting && styles.submitButtonDisabled,
                    pressed && !isSubmitting && styles.submitButtonPressed,
                  ]}>
                  <Text style={styles.submitButtonText}>
                    {isSubmitting ? 'Publishing...' : `Publish ${contentLabel}`}
                  </Text>
                </Pressable>
              </View>
            )}

            {submitMessage ? (
              <Text
                style={[
                  styles.submitMessage,
                  submitStatus === 'error' ? styles.submitMessageError : styles.submitMessageSuccess,
                ]}>
                {submitMessage}
              </Text>
            ) : null}
          </View>
        </Section>

        {activeCategory === 'all' || activeCategory === 'cards' ? (
          <Section
            title="Pet Cards"
            subtitle={isLoading ? 'Loading...' : `${visiblePets.length} matches`}>
            {isLoading ? (
              <Text style={styles.emptyText}>Loading pet cards...</Text>
            ) : visiblePets.length ? (
              <View style={styles.cardList}>
                {visiblePets.map((pet) => (
                  <PetCard key={pet.id} pet={pet} />
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>No pet cards yet.</Text>
            )}
          </Section>
        ) : null}

        {activeCategory === 'all' || activeCategory === 'updates' ? (
          <Section title="Updates" subtitle="Latest activity">
            {isLoading ? (
              <Text style={styles.emptyText}>Loading updates...</Text>
            ) : updates.length ? (
              <View style={styles.infoList}>
                {updates.map((item) => (
                  <InfoCard key={item.id} item={item} />
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>No updates yet.</Text>
            )}
          </Section>
        ) : null}

        {activeCategory === 'all' || activeCategory === 'guides' ? (
          <Section title="Guides" subtitle="Quick knowledge">
            {isLoading ? (
              <Text style={styles.emptyText}>Loading guides...</Text>
            ) : guides.length ? (
              <View style={styles.infoList}>
                {guides.map((item) => (
                  <InfoCard key={item.id} item={item} />
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>No guides yet.</Text>
            )}
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

function FieldLabel({ text }: { text: string }) {
  return <Text style={styles.formLabel}>{text}</Text>;
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

async function postJson<T = unknown>(path: string, payload: Record<string, unknown>) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  let data: T | undefined;
  if (text) {
    try {
      data = JSON.parse(text) as T;
    } catch {
      data = undefined;
    }
  }

  if (!response.ok) {
    const message =
      typeof data === 'object' && data && 'message' in data
        ? String((data as { message?: string }).message)
        : response.statusText;
    throw new Error(message || 'Request failed');
  }

  return data;
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
  errorText: {
    marginTop: 6,
    paddingHorizontal: 20,
    fontSize: 12,
    color: '#B91C1C',
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
  formCard: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1,
    borderColor: '#EFE3D6',
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 2,
  },
  uploadTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  uploadTypePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F3F4F6',
  },
  uploadTypePillActive: {
    backgroundColor: '#157B57',
    borderColor: '#157B57',
  },
  uploadTypePillPressed: {
    transform: [{ scale: 0.98 }],
  },
  uploadTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  uploadTypeTextActive: {
    color: '#FFFFFF',
  },
  formFields: {
    gap: 10,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  formInput: {
    minHeight: 40,
    borderWidth: 1,
    borderColor: '#EEE6DC',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#111827',
  },
  formInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  formHint: {
    fontSize: 12,
    color: '#6B7280',
  },
  choiceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  choicePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  choicePillActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  choicePillPressed: {
    transform: [{ scale: 0.98 }],
  },
  choiceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  choiceTextActive: {
    color: '#FFFFFF',
  },
  submitButton: {
    marginTop: 6,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#157B57',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  submitMessage: {
    marginTop: 10,
    fontSize: 12,
  },
  submitMessageError: {
    color: '#B91C1C',
  },
  submitMessageSuccess: {
    color: '#047857',
  },
  cardList: {
    gap: 14,
  },
  infoList: {
    gap: 12,
  },
  emptyText: {
    fontSize: 13,
    color: '#6B7280',
    paddingVertical: 4,
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
