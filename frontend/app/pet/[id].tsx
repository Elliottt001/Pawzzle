import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Platform, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

// Helper for localhost on Android
const API_URL = Platform.select({
  android: 'http://10.0.2.2:8080',
  ios: 'http://localhost:8080',
  default: 'http://localhost:8080',
});

type Pet = {
  id: number;
  name: string;
  species: 'CAT' | 'DOG';
  status: 'OPEN' | 'MATCHED' | 'ADOPTED';
  description: string;
  tags: object;
  ownerUsername: string | null;
  ownerContactInfo: string | null;
};

export default function PetDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPet() {
      try {
        const response = await fetch(`${API_URL}/api/pets/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch pet details');
        }
        const data = await response.json();
        setPet(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchPet();
    }
  }, [id]);

  if (loading) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (error || !pet) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText>Error: {error || 'Pet not found'}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.scrollContainer}>
      <ThemedView style={styles.container}>
        <Image
          source={{ uri: `https://placedog.net/500/500?id=${pet.id}` }} 
          style={styles.image}
        />
        
        <ThemedView style={styles.detailsContainer}>
          <ThemedText type="title">{pet.name}</ThemedText>
          <ThemedText type="subtitle" style={styles.status}>{pet.species} • {pet.status}</ThemedText>
          
          <ThemedText type="defaultSemiBold" style={styles.sectionHeader}>Description</ThemedText>
          <ThemedText>{pet.description}</ThemedText>
          
          <ThemedView style={styles.ownerCard}>
            <ThemedText type="title" style={styles.ownerTitle}>Owner Information</ThemedText>
            {pet.ownerUsername ? (
              <>
                <ThemedText>Name: {pet.ownerUsername}</ThemedText>
                <ThemedText>Contact: {pet.ownerContactInfo}</ThemedText>
              </>
            ) : (
                <ThemedText style={styles.noInfo}>No owner information available.</ThemedText>
            )}
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    minHeight: '100%',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  detailsContainer: {
    padding: 16,
    gap: 12,
  },
  status: {
    opacity: 0.7,
    marginBottom: 8,
  },
  sectionHeader: {
    marginTop: 12,
  },
  ownerCard: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
  },
  ownerTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  noInfo: {
    fontStyle: 'italic',
    opacity: 0.7,
  },
});
