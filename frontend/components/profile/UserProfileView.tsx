import * as React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Text } from '@/components/base-text';
import { FontAwesome5 } from '@expo/vector-icons';
import { Theme } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { API_BASE_URL } from '@/lib/apiBase';
import { setSession, setGuestMode, type AuthSession } from '@/lib/session';
import { request, ApiError } from '@/lib/api-client';
import { ensureChinese, formatDate } from '@/utils/text';
import { PetCard } from '@/components/pet-card';
import { styles } from '@/app/(tabs)/index.styles';
import { AdoptionSummary, UserProfile } from '@/types/profile';

interface UserProfileViewProps {
  session: AuthSession;
}

export function UserProfileView({ session }: UserProfileViewProps) {
  const router = useRouter();
  const [status, setStatus] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = React.useState(false);
  const [profileError, setProfileError] = React.useState<string | null>(null);
  const [adoptions, setAdoptions] = React.useState<AdoptionSummary[]>([]);
  const [adoptionLoading, setAdoptionLoading] = React.useState(false);
  const [adoptionError, setAdoptionError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!session?.user?.id) {
      setUserProfile(null);
      setProfileError(null);
      setProfileLoading(false);
      return;
    }
    let active = true;
    setProfileLoading(true);
    setProfileError(null);
    fetch(`${API_BASE_URL}/api/users/${session.user.id}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('获取用户信息失败');
        }
        return response.json() as Promise<UserProfile>;
      })
      .then((data) => {
        if (active) {
          setUserProfile(data);
        }
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : '';
        if (active) {
          setProfileError(ensureChinese(message, '获取用户信息失败'));
        }
      })
      .finally(() => {
        if (active) {
          setProfileLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [session?.user?.id]);

  React.useEffect(() => {
    if (!session?.token) {
      setAdoptions([]);
      setAdoptionError(null);
      setAdoptionLoading(false);
      return;
    }
    let active = true;
    setAdoptionLoading(true);
    setAdoptionError(null);
    fetch(`${API_BASE_URL}/api/adoptions`, {
      headers: {
        Authorization: `Bearer ${session.token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('获取领养信息失败');
        }
        return response.json() as Promise<AdoptionSummary[]>;
      })
      .then((data) => {
        if (active) {
          setAdoptions(Array.isArray(data) ? data : []);
        }
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : '';
        if (active) {
          setAdoptionError(ensureChinese(message, '获取领养信息失败'));
        }
      })
      .finally(() => {
        if (active) {
          setAdoptionLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [session?.token]);

  const runAuthAction = async (action: () => Promise<void>) => {
    setStatus(null);
    setLoading(true);
    try {
      await action();
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      setStatus(ensureChinese(message, '出错了，请稍后重试。'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () =>
    runAuthAction(async () => {
      if (!session) {
        return;
      }
      await request('/api/auth/logout', { token: session.token });
      setSession(null);
      setGuestMode(false);
      setUserProfile(null);
      setStatus('已退出登录。');
    });

  const getAdoptionStageLabel = (adoption: AdoptionSummary) => {
    switch (adoption.status) {
      case 'APPLY':
        return '申请中';
      case 'SCREENING':
        return '审核中';
      case 'TRIAL':
        return formatDate(adoption.adoptedAt, '试养');
      case 'ADOPTED':
        return formatDate(adoption.adoptedAt, '领养');
      default:
        return adoption.status;
    }
  };

  const displayName = userProfile?.name ?? session?.user.name ?? '游客';
  const resolvedUserType = userProfile?.userType ?? session?.user.userType ?? null;
  const userTypeLabel = session
    ? resolvedUserType === 'INSTITUTION'
      ? '机构用户 (VIP)'
      : '普通用户'
    : '未登录';

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.overline}>首页</Text>
        <Text style={styles.title}>我的空间</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <Pressable
            disabled={!session}
            onPress={() => {
              if (session?.user.id) {
                router.push(`/user/${session.user.id}`);
              }
            }}
            style={({ pressed }) => [
              styles.avatarWrap,
              pressed && session && styles.avatarPressed,
            ]}>
            <Image source={require('@/assets/images/logo.png')} style={styles.avatar} />
          </Pressable>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.nicknameLabel}>状态</Text>
          <View style={styles.nicknamePill}>
            <Text style={styles.nicknameText}>已登录</Text>
          </View>
          <Text style={styles.nicknameLabel}>用户类型</Text>
          <View style={styles.userTypePill}>
            <Text style={styles.userTypeText}>{userTypeLabel}</Text>
          </View>
          {session ? (
            <Text style={styles.emailText}>{session.user.email}</Text>
          ) : null}
        </View>

        {status ? <Text style={styles.statusText}>{status}</Text> : null}

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>我的领养</Text>
            <Text style={styles.sectionSubtitle}>{adoptions.length} 只</Text>
          </View>
          {adoptionLoading ? <ActivityIndicator size="small" /> : null}
          {adoptionError ? <Text style={styles.errorText}>{adoptionError}</Text> : null}
          {!adoptionLoading && !adoptionError && adoptions.length ? (
            <View style={styles.adoptionList}>
              {adoptions.map((adoption) => (
                <View key={adoption.id} style={styles.adoptionItem}>
                  <PetCard pet={adoption.pet} />
                  <View style={styles.adoptionMetaRow}>
                    <Text style={styles.adoptionMetaLabel}>当前阶段</Text>
                    <View style={styles.adoptionMetaPill}>
                      <Text style={styles.adoptionMetaText}>
                        {getAdoptionStageLabel(adoption)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : null}
          {!adoptionLoading && !adoptionError && !adoptions.length ? (
            <Text style={styles.emptyText}>暂无领养记录。</Text>
          ) : null}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>我的宠物卡片</Text>
            <Text style={styles.sectionSubtitle}>
              {userProfile?.pets?.length ?? 0} 张
            </Text>
          </View>
          {profileLoading ? <ActivityIndicator size="small" /> : null}
          {profileError ? <Text style={styles.errorText}>{profileError}</Text> : null}
          {!profileLoading && !profileError && userProfile?.pets?.length ? (
            <View style={styles.petsList}>
              {userProfile.pets.map((pet) => (
                <PetCard key={pet.id} pet={pet} />
              ))}
            </View>
          ) : null}
          {!profileLoading && !profileError && !userProfile?.pets?.length ? (
            <Text style={styles.emptyText}>暂无发布的宠物卡片。</Text>
          ) : null}
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>账户管理</Text>
          <Text style={styles.formSubtitle}>如需退出登录，可在此设备操作。</Text>
          <Pressable
            onPress={handleLogout}
            disabled={loading}
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed,
            ]}>
            <Text style={styles.actionButtonText}>
              {loading ? '正在退出...' : '退出登录'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
      {resolvedUserType === 'INSTITUTION' ? (
        <Pressable
          onPress={() => router.push('/pet/rehome/upload')}
          style={({ pressed }) => [
            styles.institutionFab,
            pressed && styles.institutionFabPressed,
          ]}>
          <FontAwesome5 name="plus" size={Theme.sizes.s24} color={Theme.colors.textInverse} />
        </Pressable>
      ) : null}
    </>
  );
}
