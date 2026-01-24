import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/base-text';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PetCard } from '@/components/pet-card';
import type { PetCardData } from '@/types/pet';
import { Theme } from '@/constants/theme';
import { API_BASE_URL } from '@/lib/apiBase';

type UserProfile = {
  id: number;
  name: string;
  userType: 'INDIVIDUAL' | 'INSTITUTION' | null;
  pets: PetCardData[];
};

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const rawId = Array.isArray(id) ? id[0] : id;
    const userId = normalizeId(rawId);
    if (!userId) {
      setError('缺少用户ID');
      setLoading(false);
      return;
    }

    async function fetchProfile() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/users/${userId}`);
        if (!response.ok) {
          throw new Error('获取用户信息失败');
        }
        const data = (await response.json()) as UserProfile;
        setProfile(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : '';
        setError(/[\u4e00-\u9fff]/.test(message) ? message : '获取用户信息失败');
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !profile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.errorText}>错误：{error || '未找到用户'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scroll}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.name}>{profile.name}</Text>
            <View style={styles.typePill}>
              <Text style={styles.typeText}>{getUserTypeLabel(profile.userType)}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>发布的宠物卡片</Text>
          {profile.pets && profile.pets.length ? (
            <View style={styles.cardList}>
              {profile.pets.map((pet) => (
                <PetCard key={pet.id} pet={pet} />
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>暂无发布的宠物卡片。</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function normalizeId(value?: string | null) {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function getUserTypeLabel(userType: UserProfile['userType']) {
  if (userType === 'INSTITUTION') {
    return '机构用户 (VIP)';
  }
  if (userType === 'INDIVIDUAL') {
    return '普通用户';
  }
  return '未知类型';
}

const styles = StyleSheet.create({
  safeArea: {
    flex: Theme.layout.full,
    backgroundColor: Theme.colors.backgroundWarmAlt,
  },
  scroll: {
    flex: Theme.layout.full,
    backgroundColor: Theme.colors.backgroundWarmAlt,
  },
  container: {
    padding: Theme.spacing.s20,
    gap: Theme.spacing.s16,
  },
  center: {
    flex: Theme.layout.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: Theme.colors.textError,
    fontSize: Theme.typography.size.s14,
  },
  header: {
    gap: Theme.spacing.s10,
  },
  name: {
    fontSize: Theme.typography.size.s22,
    fontFamily: Theme.fonts.semiBold,
    color: Theme.colors.text,
  },
  typePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: Theme.spacing.s12,
    paddingVertical: Theme.spacing.s6,
    borderRadius: Theme.radius.pill,
    backgroundColor: Theme.colors.warningSurface,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.warningBorder,
  },
  typeText: {
    fontSize: Theme.typography.size.s12,
    fontFamily: Theme.fonts.semiBold,
    color: Theme.colors.warningText,
  },
  sectionTitle: {
    fontSize: Theme.typography.size.s16,
    fontFamily: Theme.fonts.semiBold,
    color: Theme.colors.text,
  },
  cardList: {
    gap: Theme.spacing.s14,
  },
  emptyText: {
    fontSize: Theme.typography.size.s13,
    color: Theme.colors.textSecondary,
  },
});
