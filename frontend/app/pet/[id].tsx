import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Platform, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Theme } from '@/constants/theme';

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080');

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
    const rawId = Array.isArray(id) ? id[0] : id;
    const apiId = normalizePetId(rawId);

    if (!apiId) {
      setError('缺少宠物ID');
      setLoading(false);
      return;
    }

    async function fetchPet() {
      try {
        const response = await fetch(`${API_URL}/api/pets/${apiId}`);
        if (!response.ok) {
          throw new Error('获取宠物详情失败');
        }
        const data = await response.json();
        setPet(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : '';
        setError(/[\u4e00-\u9fff]/.test(message) ? message : '获取宠物信息失败');
      } finally {
        setLoading(false);
      }
    }

    fetchPet();
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
        <ThemedText>错误：{error || '未找到宠物'}</ThemedText>
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
          <ThemedText type="subtitle" style={styles.status}>
            {getSpeciesLabel(pet.species)} • {getStatusLabel(pet.status)}
          </ThemedText>
          
          <ThemedText type="defaultSemiBold" style={styles.sectionHeader}>简介</ThemedText>
          <ThemedText>{pet.description}</ThemedText>
          
          <ThemedView style={styles.ownerCard}>
            <ThemedText type="title" style={styles.ownerTitle}>送养人信息</ThemedText>
            {pet.ownerUsername ? (
              <>
                <ThemedText>姓名：{pet.ownerUsername}</ThemedText>
                <ThemedText>联系方式：{pet.ownerContactInfo || '暂无'}</ThemedText>
              </>
            ) : (
                <ThemedText style={styles.noInfo}>暂无送养人信息。</ThemedText>
            )}
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

function normalizePetId(value?: string | null) {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.startsWith('p') && trimmed.length > 1) {
    return trimmed.slice(1);
  }
  return trimmed;
}

function getSpeciesLabel(species: Pet['species']) {
  const labels: Record<Pet['species'], string> = {
    CAT: '猫',
    DOG: '狗',
  };
  return labels[species] ?? species;
}

function getStatusLabel(status: Pet['status']) {
  const labels: Record<Pet['status'], string> = {
    OPEN: '待领养',
    MATCHED: '已匹配',
    ADOPTED: '已领养',
  };
  return labels[status] ?? status;
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: Theme.layout.full,
  },
  container: {
    flex: Theme.layout.full,
    minHeight: Theme.percent.p100,
  },
  center: {
    flex: Theme.layout.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: Theme.percent.p100,
    height: Theme.sizes.s300,
    resizeMode: 'cover',
  },
  detailsContainer: {
    padding: Theme.spacing.s16,
    gap: Theme.spacing.s12,
  },
  status: {
    opacity: Theme.opacity.o7,
    marginBottom: Theme.spacing.s8,
  },
  sectionHeader: {
    marginTop: Theme.spacing.s12,
  },
  ownerCard: {
    marginTop: Theme.spacing.s24,
    padding: Theme.spacing.s16,
    borderRadius: Theme.radius.r12,
    backgroundColor: Theme.colors.neutralAlpha,
  },
  ownerTitle: {
    fontSize: Theme.typography.size.s18,
    marginBottom: Theme.spacing.s8,
  },
  noInfo: {
    fontStyle: 'italic',
    opacity: Theme.opacity.o7,
  },
});
