import * as React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/base-text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Theme } from '../../constants/theme';

const PET_PROFILE = {
  name: '麻糬',
  breed: '英国短毛猫',
  age: '2 岁',
  gender: '母',
  location: '杭州',
  personality: '性格安静、亲人，适合室内生活。',
  health: '已接种疫苗，已绝育，已体检。',
};

export default function PetProfileScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.photoPlaceholder}>
            <Text style={styles.photoText}>宠物照片</Text>
          </View>
          <Text style={styles.name}>{PET_PROFILE.name}</Text>
          <Text style={styles.meta}>
            {PET_PROFILE.breed} - {PET_PROFILE.age} - {PET_PROFILE.gender}
          </Text>
          <Text style={styles.location}>位置：{PET_PROFILE.location}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>性格</Text>
          <Text style={styles.bodyText}>{PET_PROFILE.personality}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>健康</Text>
          <Text style={styles.bodyText}>{PET_PROFILE.health}</Text>
        </View>

        <Pressable
          onPress={() => router.push('/adoption/verify')}
          style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}>
          <Text style={styles.actionButtonText}>开始领养</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: Theme.layout.full,
    backgroundColor: Theme.colors.background,
  },
  content: {
    padding: Theme.spacing.l,
    gap: Theme.spacing.l,
  },
  hero: {
    alignItems: 'center',
    gap: Theme.spacing.s,
  },
  photoPlaceholder: {
    width: Theme.sizes.s220,
    height: Theme.sizes.s220,
    borderRadius: Theme.radius.r24,
    backgroundColor: Theme.colors.surfaceNeutral,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderNeutral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoText: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.size.s14,
  },
  name: {
    color: Theme.colors.text,
    fontSize: Theme.typography.size.s22,
    fontFamily: Theme.fonts.semiBold,
  },
  meta: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.size.s14,
  },
  location: {
    color: Theme.colors.textSubtle,
    fontSize: Theme.typography.size.s13,
  },
  card: {
    backgroundColor: Theme.colors.cardTranslucentSoft,
    borderRadius: Theme.layout.radius,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarm,
    padding: Theme.spacing.m,
    gap: Theme.spacing.s,
  },
  sectionTitle: {
    color: Theme.colors.text,
    fontSize: Theme.typography.size.s16,
    fontFamily: Theme.fonts.semiBold,
  },
  bodyText: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.size.s14,
  },
  actionButton: {
    backgroundColor: Theme.colors.successDeep,
    borderRadius: Theme.layout.radius,
    paddingVertical: Theme.spacing.m,
    alignItems: 'center',
  },
  actionButtonPressed: {
    transform: [{ scale: Theme.scale.pressedSoft }],
  },
  actionButtonText: {
    color: Theme.colors.textInverse,
    fontSize: Theme.typography.size.s14,
    fontFamily: Theme.fonts.semiBold,
  },
});
