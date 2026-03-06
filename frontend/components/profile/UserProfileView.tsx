import * as React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/base-text';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { API_BASE_URL } from '@/lib/apiBase';
import { setSession, setGuestMode, type AuthSession } from '@/lib/session';
import { request } from '@/lib/api-client';
import { ensureChinese, formatDate } from '@/utils/text';
import { PetCard } from '@/components/pet-card';
import { styles, homeStyles } from '@/styles/index.styles';
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
  const userTypeLabel = resolvedUserType === 'INSTITUTION' ? '机构用户' : '个人用户';

  return (
    <ScrollView
      contentContainerStyle={homeStyles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Profile Header ── */}
      <View style={homeStyles.profileRow}>
        <View style={homeStyles.profileInfo}>
          <View style={homeStyles.nameRow}>
            <Text style={homeStyles.userName}>{displayName}</Text>
          </View>
          <Text style={homeStyles.userId}>ID：{session.user.id ?? '—'}</Text>
          <Text style={homeStyles.userIp}>IP地址：北京</Text>
        </View>
        <Pressable
          onPress={() => {
            if (session?.user.id) router.push(`/user/${session.user.id}`);
          }}
          style={({ pressed }) => pressed && { opacity: 0.8 }}
        >
          <Image
            source={require('@/assets/images/logo.png')}
            style={homeStyles.avatar}
          />
        </Pressable>
      </View>

      {/* ── User type badge + bio hint ── */}
      <View style={homeStyles.badgeRow}>
        <View style={homeStyles.userBadge}>
          <Text style={homeStyles.userBadgeText}>{userTypeLabel}</Text>
        </View>
        <Pressable
          onPress={() => {
            if (session?.user.id) router.push(`/user/${session.user.id}`);
          }}
        >
          <Text style={homeStyles.bioHint}>点击这里，填写简介</Text>
        </Pressable>
      </View>

      {status ? <Text style={styles.statusText}>{status}</Text> : null}

      {/* ── AI辅养 Section ── */}
      <Text style={homeStyles.sectionTitle}>AI辅养</Text>
      <LinearGradient
        colors={['#F4C17F', 'rgba(244, 193, 127, 0.44)']}
        start={{ x: 0.22, y: 0.14 }}
        end={{ x: 1, y: 1 }}
        style={homeStyles.aiCard}
      >
        <View style={homeStyles.aiRow}>
          <View style={homeStyles.aiIconWrap}>
            <FontAwesome5 name="paw" size={15} color="#5C4033" />
          </View>
          <Text style={homeStyles.aiTitle}>3个月幼猫到家第4天</Text>
        </View>
        <View style={homeStyles.aiChecklist}>
          <View style={homeStyles.aiCheckItem}>
            <View style={homeStyles.checkboxWrap}>
              <View style={homeStyles.checkbox} />
            </View>
            <Text style={homeStyles.checkText}>原猫粮少量多餐，不喂牛奶/人食</Text>
          </View>
          <View style={homeStyles.aiCheckItem}>
            <View style={homeStyles.checkboxWrap}>
              <View style={homeStyles.checkbox} />
            </View>
            <Text style={homeStyles.checkText}>固定猫砂盆、食碗水碗，给安静小窝</Text>
          </View>
        </View>
      </LinearGradient>

      {/* ── 我的宠物 Section ── */}
      <View style={homeStyles.petHeader}>
        <Text style={homeStyles.sectionTitle}>我的宠物</Text>
        <Pressable
          style={({ pressed }) => [
            homeStyles.petAddBtn,
            pressed && { transform: [{ scale: 0.92 }] },
          ]}
          onPress={() => router.push('/pet/add')}
        >
          <FontAwesome5 name="plus" size={12} color="#FFFFFF" />
        </Pressable>
      </View>

      {profileLoading ? <ActivityIndicator size="small" /> : null}
      {profileError ? <Text style={styles.errorText}>{profileError}</Text> : null}
      {!profileLoading && !profileError && userProfile?.pets?.length ? (
        <View style={homeStyles.petList}>
          {userProfile.pets.map((pet) => (
            <PetCard key={pet.id} pet={pet} />
          ))}
        </View>
      ) : null}
      {!profileLoading && !profileError && !userProfile?.pets?.length ? (
        <Text style={styles.emptyText}>暂无发布的宠物卡片。</Text>
      ) : null}

      {/* ── 我的领养 Section ── */}
      {adoptions.length > 0 || adoptionLoading ? (
        <>
          <View style={homeStyles.petHeader}>
            <Text style={homeStyles.sectionTitle}>我的领养</Text>
          </View>
          {adoptionLoading ? <ActivityIndicator size="small" /> : null}
          {adoptionError ? <Text style={styles.errorText}>{adoptionError}</Text> : null}
          {!adoptionLoading && !adoptionError && adoptions.length > 0 ? (
            <View style={homeStyles.petList}>
              {adoptions.map((adoption) => (
                <View key={adoption.id} style={{ gap: 10 }}>
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
        </>
      ) : null}

      {/* ── 账户管理 ── */}
      <View style={homeStyles.accountCard}>
        <Pressable
          onPress={handleLogout}
          disabled={loading}
          style={({ pressed }) => [
            homeStyles.logoutBtn,
            pressed && { transform: [{ scale: 0.97 }] },
          ]}
        >
          <Text style={homeStyles.logoutText}>
            {loading ? '正在退出...' : '退出登录'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
