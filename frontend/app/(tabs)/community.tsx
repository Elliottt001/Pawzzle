import * as React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Text } from '@/components/base-text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { Theme } from '../../constants/theme';
import { getSession, subscribeSession, type AuthSession } from '@/lib/session';

const SCAN_DELAY_MS = 900;

const TABS = [
  { id: 'recommend', label: '推荐' },
  { id: 'knowledge', label: '知识' },
  { id: 'post', label: '发布' },
] as const;

const uploadTypes = [
  { id: 'card', label: '卡片' },
  { id: 'update', label: '动态' },
  { id: 'guide', label: '指南' },
] as const;

const breedOptions = {
  CAT: ['英短', '布偶', '暹罗'],
  DOG: ['柯基', '柴犬', '迷你贵宾'],
} as const;

const locationOptions = ['杭州', '北京', '上海'] as const;
const DEFAULT_DESCRIPTION = '性格友好，适合家庭领养。';
const FALLBACK_TAGS = ['干饭王', '小粘人', '高冷', '温顺', '小太阳', '机灵鬼'];
const GENDER_OPTIONS = [
  { id: 'male', label: '公' },
  { id: 'female', label: '母' },
] as const;
const STATUS_OPTIONS = ['已绝育', '已完成疫苗', '疫苗进行中', '未接种/不确定'] as const;

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080');
const ensureChinese = (message: string, fallback: string) =>
  /[\u4e00-\u9fff]/.test(message) ? message : fallback;

type TabId = (typeof TABS)[number]['id'];
type UploadType = (typeof uploadTypes)[number]['id'];

type ContentItem = {
  id: string;
  title: string;
  subtitle: string;
  tag?: string | null;
  tone?: string | null;
};

type CommunityContentResponse = {
  updates: ContentItem[];
  guides: ContentItem[];
};

export default function CommunityScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<TabId>('recommend');
  const [isScanning, setIsScanning] = React.useState(false);
  const [hasResult, setHasResult] = React.useState(false);
  const [pushStatus, setPushStatus] = React.useState<'idle' | 'sent'>('idle');
  const [session, setSessionState] = React.useState<AuthSession | null>(() => getSession());
  const [updates, setUpdates] = React.useState<ContentItem[]>([]);
  const [guides, setGuides] = React.useState<ContentItem[]>([]);
  const [contentLoading, setContentLoading] = React.useState(false);
  const [contentError, setContentError] = React.useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [uploadType, setUploadType] = React.useState<UploadType>('card');
  const [cardName, setCardName] = React.useState('');
  const [cardBreed, setCardBreed] = React.useState<string | null>(null);
  const [cardAge, setCardAge] = React.useState('');
  const [cardLocation, setCardLocation] = React.useState<string>(locationOptions[0]);
  const [cardPersonalityText, setCardPersonalityText] = React.useState('');
  const [cardAvoidAdopterText, setCardAvoidAdopterText] = React.useState('');
  const [cardGender, setCardGender] = React.useState<(typeof GENDER_OPTIONS)[number]['id'] | null>(
    null,
  );
  const [cardCareStatus, setCardCareStatus] = React.useState<
    (typeof STATUS_OPTIONS)[number] | null
  >(null);
  const [cardTags, setCardTags] = React.useState<string[]>([]);
  const [cardTagStatus, setCardTagStatus] = React.useState<'idle' | 'generating' | 'ready'>('idle');
  const [cardTagError, setCardTagError] = React.useState<string | null>(null);
  const [cardBreedOpen, setCardBreedOpen] = React.useState(false);
  const [cardPhotoUri, setCardPhotoUri] = React.useState<string | null>(null);
  const [cardPhotoName, setCardPhotoName] = React.useState<string | null>(null);
  const [cardPhotoType, setCardPhotoType] = React.useState<string | null>(null);
  const [cardPhotoUploadStatus, setCardPhotoUploadStatus] = React.useState<
    'idle' | 'uploading' | 'ready' | 'error'
  >('idle');
  const [cardPhotoUploadError, setCardPhotoUploadError] = React.useState<string | null>(null);
  const [cardPhotoImageUrl, setCardPhotoImageUrl] = React.useState<string | null>(null);
  const [contentTitle, setContentTitle] = React.useState('');
  const [contentSubtitle, setContentSubtitle] = React.useState('');
  const [contentTag, setContentTag] = React.useState('');
  const [submitStatus, setSubmitStatus] = React.useState<
    'idle' | 'submitting' | 'success' | 'error'
  >('idle');
  const [submitMessage, setSubmitMessage] = React.useState<string | null>(null);
  const isSubmitting = submitStatus === 'submitting';
  const isLoggedIn = Boolean(session?.token);
  const contentLabel = uploadType === 'update' ? '动态' : '指南';
  const allBreeds = React.useMemo(() => [...breedOptions.CAT, ...breedOptions.DOG], []);
  const canGenerateCardTags =
    cardPersonalityText.trim().length > 0 && cardTagStatus !== 'generating';

  React.useEffect(() => {
    if (!isScanning) {
      return;
    }
    const timeout = setTimeout(() => {
      setIsScanning(false);
      setHasResult(true);
    }, SCAN_DELAY_MS);

    return () => clearTimeout(timeout);
  }, [isScanning]);

  React.useEffect(() => {
    const unsubscribe = subscribeSession((nextSession) => {
      setSessionState(nextSession);
    });
    return unsubscribe;
  }, []);

  React.useEffect(() => {
    if (cardBreed && !allBreeds.includes(cardBreed)) {
      setCardBreed(null);
    }
  }, [allBreeds, cardBreed]);

  React.useEffect(() => {
    setSubmitStatus('idle');
    setSubmitMessage(null);
    if (uploadType !== 'card') {
      setCardPhotoUri(null);
      setCardPhotoName(null);
      setCardPhotoType(null);
      setCardPhotoUploadStatus('idle');
      setCardPhotoUploadError(null);
      setCardPhotoImageUrl(null);
      setCardTags([]);
      setCardTagStatus('idle');
      setCardTagError(null);
      setCardPersonalityText('');
      setCardAvoidAdopterText('');
      setCardGender(null);
      setCardCareStatus(null);
      setCardBreedOpen(false);
    }
  }, [uploadType]);

  const resolveExtension = (name: string | null, type: string | null) => {
    if (name) {
      const trimmed = name.trim();
      const dot = trimmed.lastIndexOf('.');
      if (dot > -1 && dot < trimmed.length - 1) {
        return trimmed.slice(dot + 1).toLowerCase();
      }
    }
    if (type && type.includes('/')) {
      return type.split('/')[1].toLowerCase();
    }
    return 'jpg';
  };

  const buildFileName = (name: string | null, extension: string) => {
    const raw = name?.split('/').pop()?.split('\\').pop()?.trim();
    if (!raw) {
      return `pet-photo-${Date.now()}.${extension}`;
    }
    if (raw.includes('.')) {
      return raw;
    }
    return `${raw}.${extension}`;
  };

  const resolveMimeType = (type: string | null, extension: string) => {
    if (type) {
      return type;
    }
    switch (extension) {
      case 'png':
        return 'image/png';
      case 'webp':
        return 'image/webp';
      case 'heic':
        return 'image/heic';
      case 'heif':
        return 'image/heif';
      default:
        return 'image/jpeg';
    }
  };

  const handlePickCardPhoto = async () => {
    if (isSubmitting) {
      return;
    }
    setCardPhotoUploadError(null);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setCardPhotoUploadError('需要相册权限才能选择照片。');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });
      if (result.canceled) {
        return;
      }
      const asset = result.assets?.[0];
      if (!asset?.uri) {
        setCardPhotoUploadError('未获取到照片，请重试。');
        return;
      }
      const fallbackName = `pet-photo-${Date.now()}.jpg`;
      const resolvedName = asset.fileName?.trim() || fallbackName;
      const resolvedType = asset.mimeType?.trim() || 'image/jpeg';
      setCardPhotoUri(asset.uri);
      setCardPhotoName(resolvedName);
      setCardPhotoType(resolvedType);
      setCardPhotoUploadStatus('idle');
      setCardPhotoImageUrl(null);
    } catch {
      setCardPhotoUploadError('选择照片失败，请稍后再试。');
    }
  };

  const uploadCardPhoto = async () => {
    if (!cardPhotoUri || !session?.token) {
      return null;
    }
    setCardPhotoUploadStatus('uploading');
    setCardPhotoUploadError(null);
    try {
      const extension = resolveExtension(cardPhotoName, cardPhotoType);
      const fileName = buildFileName(cardPhotoName, extension);
      const mimeType = resolveMimeType(cardPhotoType, extension);
      const formData = new FormData();
      if (Platform.OS === 'web') {
        const response = await fetch(cardPhotoUri);
        const blob = await response.blob();
        const finalType = blob.type || mimeType;
        const file = new File([blob], fileName, { type: finalType });
        formData.append('file', file);
      } else {
        formData.append('file', {
          uri: cardPhotoUri,
          name: fileName,
          type: mimeType,
        } as unknown as Blob);
      }
      const response = await fetch(`${API_BASE_URL}/api/pets/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.token}`,
        },
        body: formData,
      });
      if (!response.ok) {
        const text = await response.text();
        let message = '';
        try {
          const data = JSON.parse(text) as { message?: string };
          message = data?.message ?? '';
        } catch {
          message = text;
        }
        throw new Error(message || response.statusText);
      }
      const data = (await response.json()) as { url?: string };
      if (!data?.url) {
        throw new Error('图片上传失败。');
      }
      setCardPhotoUploadStatus('ready');
      setCardPhotoImageUrl(data.url);
      return data.url;
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      const friendly = ensureChinese(message, '图片上传失败，请稍后再试。');
      setCardPhotoUploadStatus('error');
      setCardPhotoUploadError(friendly);
      return null;
    }
  };

  const handleGenerateCardTags = async () => {
    if (!canGenerateCardTags) {
      if (!cardPersonalityText.trim()) {
        setCardTagError('请先填写性格侧写内容。');
      }
      return;
    }
    setCardTagError(null);
    setCardTagStatus('generating');

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (session?.token) {
        headers.Authorization = `Bearer ${session.token}`;
      }
      const response = await fetch(`${API_BASE_URL}/api/pets/personality-tags`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ text: cardPersonalityText.trim() }),
      });
      const text = await response.text();
      let payload: { tags?: string[] } | null = null;
      if (text) {
        try {
          payload = JSON.parse(text) as { tags?: string[] };
        } catch {
          payload = null;
        }
      }
      if (!response.ok) {
        const message =
          payload && typeof payload === 'object' && 'message' in payload
            ? String((payload as { message?: string }).message ?? '')
            : response.statusText ?? '';
        throw new Error(message);
      }
      const aiTags = normalizeTags(Array.isArray(payload?.tags) ? payload?.tags ?? [] : []);
      const finalTags = fillTags(aiTags);
      setCardTags(finalTags);
      setCardTagStatus('ready');
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      setCardTagError(ensureChinese(message, '标签生成失败，请稍后再试。'));
      setCardTagStatus('idle');
    }
  };

  const loadContent = React.useCallback(async (isActive?: () => boolean) => {
    const shouldUpdate = () => (isActive ? isActive() : true);
    if (shouldUpdate()) {
      setContentLoading(true);
      setContentError(null);
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/home`);
      if (!response.ok) {
        throw new Error('获取社区内容失败');
      }
      const data = (await response.json()) as CommunityContentResponse;
      if (shouldUpdate()) {
        setUpdates(Array.isArray(data?.updates) ? data.updates : []);
        setGuides(Array.isArray(data?.guides) ? data.guides : []);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (shouldUpdate()) {
        setContentError(ensureChinese(message, '获取社区内容失败'));
      }
    } finally {
      if (shouldUpdate()) {
        setContentLoading(false);
      }
    }
  }, []);

  React.useEffect(() => {
    let active = true;
    void loadContent(() => active);
    return () => {
      active = false;
    };
  }, [loadContent]);

  const handleSnap = () => {
    if (isScanning) {
      return;
    }
    setHasResult(false);
    setPushStatus('idle');
    setIsScanning(true);
  };

  const handlePush = () => {
    setPushStatus('sent');
  };

  const handleToggleUpload = () => {
    setUploadOpen((prev) => !prev);
  };

  const handleCreateCard = async () => {
    if (isSubmitting) {
      return;
    }
    if (!isLoggedIn) {
      setSubmitStatus('error');
      setSubmitMessage('请先登录后再发布。');
      return;
    }
    setSubmitStatus('submitting');
    setSubmitMessage(null);

    const name = cardName.trim();
    const location = cardLocation.trim();
    const description = cardPersonalityText.trim();
    const ageValue = Number(cardAge);

    if (!name) {
      setSubmitStatus('error');
      setSubmitMessage('请输入名字。');
      return;
    }
    if (!cardBreed) {
      setSubmitStatus('error');
      setSubmitMessage('请选择品种。');
      return;
    }
    const resolvedSpecies = resolveSpeciesFromBreed(cardBreed);
    if (!resolvedSpecies) {
      setSubmitStatus('error');
      setSubmitMessage('请选择品种。');
      return;
    }
    if (!cardAge || Number.isNaN(ageValue) || ageValue <= 0) {
      setSubmitStatus('error');
      setSubmitMessage('年龄必须为正数。');
      return;
    }
    if (!location) {
      setSubmitStatus('error');
      setSubmitMessage('请选择城市。');
      return;
    }

    try {
      let imageUrl = cardPhotoImageUrl;
      if (cardPhotoUri && !imageUrl) {
        imageUrl = await uploadCardPhoto();
        if (!imageUrl) {
          setSubmitStatus('error');
          return;
        }
      }
      await postJson(
        '/api/pets',
        {
          name,
          species: resolvedSpecies,
          breed: cardBreed,
          age: ageValue,
          location,
          personalityTag: cardTags[0] ?? '亲人',
          description: description || DEFAULT_DESCRIPTION,
          imageUrl: imageUrl ?? undefined,
        },
        session?.token
      );
      setSubmitStatus('success');
      setSubmitMessage('卡片已生成。');
      setCardName('');
      setCardBreed(null);
      setCardAge('');
      setCardLocation(locationOptions[0]);
      setCardPersonalityText('');
      setCardAvoidAdopterText('');
      setCardGender(null);
      setCardCareStatus(null);
      setCardTags([]);
      setCardTagStatus('idle');
      setCardTagError(null);
      setCardBreedOpen(false);
      setCardPhotoUri(null);
      setCardPhotoName(null);
      setCardPhotoType(null);
      setCardPhotoUploadStatus('idle');
      setCardPhotoUploadError(null);
      setCardPhotoImageUrl(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      setSubmitStatus('error');
      setSubmitMessage(ensureChinese(message, '发布卡片失败。'));
    }
  };

  const handleCreateContent = async () => {
    if (isSubmitting) {
      return;
    }
    if (!isLoggedIn) {
      setSubmitStatus('error');
      setSubmitMessage('请先登录后再发布。');
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
      setSubmitMessage('标题和副标题必填。');
      return;
    }

    try {
      await postJson(
        '/api/home/content',
        {
          category: uploadType.toUpperCase(),
          title,
          subtitle,
          tag: tag || undefined,
        },
        session?.token
      );
      setSubmitStatus('success');
      setSubmitMessage(`已发布${contentLabel}`);
      setContentTitle('');
      setContentSubtitle('');
      setContentTag('');
      void loadContent();
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      setSubmitStatus('error');
      setSubmitMessage(ensureChinese(message, `发布${contentLabel}失败。`));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>社区广场</Text>
        <Text style={styles.subtitle}>浏览内容，或快速发布动态。</Text>
      </View>

      <View style={styles.segmented}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={({ pressed }) => [
                styles.segmentItem,
                isActive && styles.segmentItemActive,
                pressed && styles.segmentItemPressed,
              ]}>
              <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {activeTab === 'recommend' ? (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>最新动态</Text>
              <Text style={styles.sectionSubtitle}>领养社区正在发生的事</Text>
            </View>
            {contentLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={Theme.colors.textSecondary} />
                <Text style={styles.loadingText}>正在加载动态...</Text>
              </View>
            ) : contentError ? (
              <Text style={styles.errorText}>{contentError}</Text>
            ) : updates.length ? (
              <View style={styles.contentList}>
                {updates.map((item) => (
                  <ContentCard key={item.id ?? item.title} item={item} fallbackTag="动态" />
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>暂无动态。</Text>
            )}
          </View>
        ) : null}

        {activeTab === 'knowledge' ? (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>科普精选</Text>
              <Text style={styles.sectionSubtitle}>实用的养宠知识与技巧</Text>
            </View>
            {contentLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={Theme.colors.textSecondary} />
                <Text style={styles.loadingText}>正在加载科普...</Text>
              </View>
            ) : contentError ? (
              <Text style={styles.errorText}>{contentError}</Text>
            ) : guides.length ? (
              <View style={styles.contentList}>
                {guides.map((item) => (
                  <ContentCard key={item.id ?? item.title} item={item} fallbackTag="科普" />
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>暂无科普信息。</Text>
            )}
          </View>
        ) : null}

        {activeTab === 'post' ? (
          <View style={styles.postPanel}>
            <View style={styles.uploadCard}>
              <Pressable
                onPress={handleToggleUpload}
                style={({ pressed }) => [
                  styles.uploadHeader,
                  pressed && styles.uploadHeaderPressed,
                ]}>
                <View>
                  <Text style={styles.uploadTitle}>发布中心</Text>
                  <Text style={styles.uploadSubtitle}>
                    {isLoggedIn ? '登录后可发布卡片与动态' : '登录后才可使用发布功能'}
                  </Text>
                </View>
                <Text style={styles.uploadToggle}>{uploadOpen ? '收起' : '展开'}</Text>
              </Pressable>

              {uploadOpen ? (
                isLoggedIn ? (
                  <View style={styles.uploadBody}>
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
                            <Text
                              style={[
                                styles.uploadTypeText,
                                isActive && styles.uploadTypeTextActive,
                              ]}>
                              {type.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>

                    {uploadType === 'card' ? (
                      <View style={styles.cardForm}>
                        <Pressable
                          onPress={handlePickCardPhoto}
                          disabled={isSubmitting}
                          style={({ pressed }) => [
                            styles.cardPhotoUpload,
                            pressed && styles.cardPhotoUploadPressed,
                          ]}>
                          {cardPhotoUri ? (
                            <Image
                              source={{ uri: cardPhotoUri }}
                              style={styles.cardPhotoImage}
                              contentFit="cover"
                            />
                          ) : (
                            <View style={styles.cardPhotoPlaceholder}>
                              <FontAwesome5
                                name="camera"
                                size={Theme.sizes.s24}
                                color={Theme.colors.textWarm}
                              />
                              <Text style={styles.cardPhotoPlaceholderText}>
                                拍照/上传宠物照片
                              </Text>
                            </View>
                          )}
                        </Pressable>
                        <Text style={styles.cardPhotoHint}>支持多图上传，最多6张</Text>
                        {cardPhotoUploadError ? (
                          <Text style={styles.cardInlineError}>{cardPhotoUploadError}</Text>
                        ) : null}

                        <View style={styles.cardField}>
                          <Text style={styles.cardLabel}>名字</Text>
                          <TextInput
                            value={cardName}
                            onChangeText={setCardName}
                            placeholder="输入宠物名字"
                            placeholderTextColor={Theme.colors.placeholder}
                            style={styles.cardInput}
                          />
                        </View>

                        <View style={styles.cardField}>
                          <Text style={styles.cardLabel}>品种</Text>
                          <Pressable
                            onPress={() => setCardBreedOpen((prev) => !prev)}
                            style={({ pressed }) => [
                              styles.cardSelect,
                              pressed && styles.cardSelectPressed,
                            ]}>
                            <Text
                              style={cardBreed ? styles.cardSelectValue : styles.cardSelectPlaceholder}>
                              {cardBreed ?? '选择或输入品种'}
                            </Text>
                            <FontAwesome5
                              name="chevron-down"
                              size={Theme.sizes.s12}
                              color={Theme.colors.textWarm}
                            />
                          </Pressable>
                          {cardBreedOpen ? (
                            <View style={styles.cardOptionRow}>
                              {allBreeds.map((breed) => {
                                const isActive = cardBreed === breed;
                                return (
                                  <Pressable
                                    key={breed}
                                    onPress={() => {
                                      setCardBreed(breed);
                                      setCardBreedOpen(false);
                                    }}
                                    style={({ pressed }) => [
                                      styles.cardOptionPill,
                                      isActive && styles.cardOptionPillActive,
                                      pressed && styles.cardOptionPillPressed,
                                    ]}>
                                    <Text
                                      style={[
                                        styles.cardOptionText,
                                        isActive && styles.cardOptionTextActive,
                                      ]}>
                                      {breed}
                                    </Text>
                                  </Pressable>
                                );
                              })}
                            </View>
                          ) : null}
                        </View>

                        <View style={styles.cardField}>
                          <Text style={styles.cardLabel}>年龄</Text>
                          <TextInput
                            value={cardAge}
                            onChangeText={(value) => setCardAge(value.replace(/[^0-9]/g, ''))}
                            placeholder="输入年龄"
                            placeholderTextColor={Theme.colors.placeholder}
                            keyboardType="number-pad"
                            style={styles.cardInput}
                          />
                        </View>

                        <View style={styles.cardField}>
                          <Text style={styles.cardLabel}>性别与状态</Text>
                          <View style={styles.cardOptionRow}>
                            {GENDER_OPTIONS.map((option) => {
                              const isActive = cardGender === option.id;
                              return (
                                <Pressable
                                  key={option.id}
                                  onPress={() => setCardGender(option.id)}
                                  style={({ pressed }) => [
                                    styles.cardOptionPill,
                                    isActive && styles.cardOptionPillActive,
                                    pressed && styles.cardOptionPillPressed,
                                  ]}>
                                  <Text
                                    style={[
                                      styles.cardOptionText,
                                      isActive && styles.cardOptionTextActive,
                                    ]}>
                                    {option.label}
                                  </Text>
                                </Pressable>
                              );
                            })}
                          </View>
                          <View style={styles.cardOptionRow}>
                            {STATUS_OPTIONS.map((option) => {
                              const isActive = cardCareStatus === option;
                              return (
                                <Pressable
                                  key={option}
                                  onPress={() => setCardCareStatus(option)}
                                  style={({ pressed }) => [
                                    styles.cardOptionPill,
                                    isActive && styles.cardOptionPillActive,
                                    pressed && styles.cardOptionPillPressed,
                                  ]}>
                                  <Text
                                    style={[
                                      styles.cardOptionText,
                                      isActive && styles.cardOptionTextActive,
                                    ]}>
                                    {option}
                                  </Text>
                                </Pressable>
                              );
                            })}
                          </View>
                        </View>

                        <View style={styles.cardField}>
                          <Text style={styles.cardSectionTitle}>AI 性格侧写</Text>
                          <Text style={styles.cardHelperText}>
                            请介绍你家宝贝的个性（例如它是否特别粘人？它吃饭护食吗？它怕打雷吗？）
                          </Text>
                          <View style={styles.cardTextAreaWrap}>
                            <TextInput
                              value={cardPersonalityText}
                              onChangeText={setCardPersonalityText}
                              placeholder="描述你家宝贝的性格特点...(可粘贴小红书/朋友圈文案)"
                              placeholderTextColor={Theme.colors.placeholder}
                              style={styles.cardTextArea}
                              multiline
                            />
                            <View style={styles.cardMicBadge}>
                              <FontAwesome5
                                name="microphone"
                                size={Theme.sizes.s14}
                                color={Theme.colors.textWarm}
                              />
                            </View>
                          </View>
                        </View>

                        <View style={styles.cardField}>
                          <View style={styles.cardTagHeader}>
                            <Text style={styles.cardSectionTitle}>tag 生成</Text>
                            <Pressable
                              onPress={handleGenerateCardTags}
                              disabled={!canGenerateCardTags}
                              style={({ pressed }) => [
                                styles.cardTagButton,
                                pressed && styles.cardTagButtonPressed,
                                !canGenerateCardTags && styles.cardTagButtonDisabled,
                              ]}>
                              {cardTagStatus === 'generating' ? (
                                <ActivityIndicator size="small" color={Theme.colors.textWarmStrong} />
                              ) : null}
                              <Text style={styles.cardTagButtonText}>
                                {cardTagStatus === 'generating' ? '生成中...' : '生成'}
                              </Text>
                            </Pressable>
                          </View>
                          <View style={styles.cardTagRow}>
                            {cardTags.length ? (
                              cardTags.map((tag) => (
                                <View key={tag} style={styles.cardTagPill}>
                                  <Text style={styles.cardTagText}># {tag}</Text>
                                </View>
                              ))
                            ) : (
                              <Text style={styles.cardTagEmpty}>暂未生成标签</Text>
                            )}
                          </View>
                          {cardTagError ? (
                            <Text style={styles.cardInlineError}>{cardTagError}</Text>
                          ) : null}
                        </View>

                        <View style={styles.cardField}>
                          <Text style={styles.cardSectionTitle}>您觉得什么样的人千万不要养这只宠物?</Text>
                          <View style={styles.cardTextAreaWrap}>
                            <TextInput
                              value={cardAvoidAdopterText}
                              onChangeText={setCardAvoidAdopterText}
                              placeholder="比如：禁止宿舍..."
                              placeholderTextColor={Theme.colors.placeholder}
                              style={styles.cardTextArea}
                              multiline
                            />
                            <View style={styles.cardMicBadge}>
                              <FontAwesome5
                                name="microphone"
                                size={Theme.sizes.s14}
                                color={Theme.colors.textWarm}
                              />
                            </View>
                          </View>
                        </View>

                        <Pressable
                          onPress={handleCreateCard}
                          disabled={isSubmitting}
                          style={({ pressed }) => [
                            styles.cardSubmitButton,
                            isSubmitting && styles.cardSubmitButtonDisabled,
                            pressed && !isSubmitting && styles.cardSubmitButtonPressed,
                          ]}>
                          <Text style={styles.cardSubmitButtonText}>
                            {isSubmitting ? '生成中...' : '生成专属宠物信息卡'}
                          </Text>
                        </Pressable>
                      </View>
                    ) : (
                      <View style={styles.formFields}>
                        <FieldLabel text={`${contentLabel}标题`} />
                        <TextInput
                          value={contentTitle}
                          onChangeText={setContentTitle}
                          placeholder={`请输入${contentLabel}标题`}
                          placeholderTextColor={Theme.colors.placeholder}
                          style={styles.formInput}
                        />

                        <FieldLabel text={`${contentLabel}副标题`} />
                        <TextInput
                          value={contentSubtitle}
                          onChangeText={setContentSubtitle}
                          placeholder="简短摘要..."
                          placeholderTextColor={Theme.colors.placeholder}
                          style={styles.formInput}
                        />

                        <FieldLabel text="标签（可选）" />
                        <TextInput
                          value={contentTag}
                          onChangeText={setContentTag}
                          placeholder="最新、活动、技巧..."
                          placeholderTextColor={Theme.colors.placeholder}
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
                            {isSubmitting ? '发布中...' : `发布${contentLabel}`}
                          </Text>
                        </Pressable>
                      </View>
                    )}

                    {submitMessage ? (
                      <Text
                        style={[
                          styles.submitMessage,
                          submitStatus === 'error'
                            ? styles.submitMessageError
                            : styles.submitMessageSuccess,
                        ]}>
                        {submitMessage}
                      </Text>
                    ) : null}
                  </View>
                ) : (
                  <View style={styles.loginHint}>
                    <Text style={styles.loginHintText}>请先登录后再发布内容。</Text>
                    <Pressable
                      onPress={() => router.push('/')}
                      style={({ pressed }) => [
                        styles.loginButton,
                        pressed && styles.loginButtonPressed,
                      ]}>
                      <Text style={styles.loginButtonText}>去登录</Text>
                    </Pressable>
                  </View>
                )
              ) : null}
            </View>

            <Pressable
              onPress={handleSnap}
              disabled={isScanning}
              style={({ pressed }) => [
                styles.snapButton,
                pressed && !isScanning && styles.snapButtonPressed,
              ]}>
              <Text style={styles.snapButtonText}>拍摄流浪宠物</Text>
            </Pressable>

            {isScanning ? (
              <View style={styles.statusPill}>
                <Text style={styles.statusText}>识别中...</Text>
              </View>
            ) : null}

            {hasResult ? (
              <View style={styles.resultCard}>
                <Text style={styles.resultTitle}>识别结果</Text>
                <Text style={styles.resultSubtitle}>标签：#流浪 #猫咪 #受伤</Text>
                <View style={styles.tagsRow}>
                  {['#流浪', '#猫咪', '#受伤'].map((tag) => (
                    <View key={tag} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
                <Pressable
                  onPress={handlePush}
                  style={({ pressed }) => [
                    styles.pushButton,
                    pressed && styles.pushButtonPressed,
                  ]}>
                  <Text style={styles.pushButtonText}>
                    推送到最近机构（距离优先）
                  </Text>
                </Pressable>
                {pushStatus === 'sent' ? (
                  <Text style={styles.pushStatusText}>已进入推送队列。</Text>
                ) : null}
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function FieldLabel({ text }: { text: string }) {
  return <Text style={styles.formLabel}>{text}</Text>;
}

function ContentCard({
  item,
  fallbackTag,
}: {
  item: ContentItem;
  fallbackTag: string;
}) {
  const tone = item.tone || Theme.colors.surfaceNeutral;
  const tagLabel = item.tag?.trim() ? item.tag : fallbackTag;

  return (
    <View style={styles.contentCard}>
      <View style={[styles.contentTag, { backgroundColor: tone }]}>
        <Text style={styles.contentTagText}>{tagLabel}</Text>
      </View>
      <Text style={styles.contentTitle}>{item.title}</Text>
      <Text style={styles.contentSubtitle}>{item.subtitle}</Text>
    </View>
  );
}

async function postJson<T = unknown>(path: string, payload: Record<string, unknown>, token?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers,
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
        ? String((data as { message?: string }).message ?? '')
        : response.statusText ?? '';
    throw new Error(ensureChinese(message, '请求失败'));
  }

  return data;
}

function normalizeTags(tags: string[]) {
  const cleaned = tags
    .filter((tag): tag is string => typeof tag === 'string')
    .map((tag) => tag.replace(/^#/, '').trim())
    .filter((tag) => tag.length > 0);
  return Array.from(new Set(cleaned));
}

function fillTags(tags: string[]) {
  const merged = [...tags];
  for (const fallback of FALLBACK_TAGS) {
    if (merged.length >= 4) {
      break;
    }
    if (!merged.includes(fallback)) {
      merged.push(fallback);
    }
  }
  return merged.slice(0, 4);
}

function resolveSpeciesFromBreed(breed: string | null) {
  if (!breed) {
    return null;
  }
  if (breedOptions.CAT.includes(breed)) {
    return 'CAT';
  }
  if (breedOptions.DOG.includes(breed)) {
    return 'DOG';
  }
  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: Theme.layout.full,
    backgroundColor: Theme.colors.background,
  },
  header: {
    paddingHorizontal: Theme.spacing.l,
    paddingTop: Theme.spacing.m,
    paddingBottom: Theme.spacing.s,
    gap: Theme.spacing.s,
  },
  title: {
    color: Theme.colors.text,
    fontSize: Theme.typography.size.s22,
    fontFamily: Theme.fonts.semiBold,
  },
  subtitle: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.size.s14,
  },
  segmented: {
    flexDirection: 'row',
    marginHorizontal: Theme.spacing.l,
    backgroundColor: Theme.colors.surfaceNeutral,
    borderRadius: Theme.layout.radius,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderNeutral,
    padding: Theme.spacing.s,
  },
  segmentItem: {
    flex: Theme.layout.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Theme.spacing.s,
    borderRadius: Theme.layout.radius,
  },
  segmentItemActive: {
    backgroundColor: Theme.colors.card,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarm,
  },
  segmentItemPressed: {
    transform: [{ scale: Theme.scale.pressedSoft }],
  },
  segmentText: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.size.s14,
    fontFamily: Theme.fonts.semiBold,
  },
  segmentTextActive: {
    color: Theme.colors.text,
  },
  content: {
    paddingHorizontal: Theme.spacing.l,
    paddingTop: Theme.spacing.l,
    paddingBottom: Theme.spacing.l,
    gap: Theme.spacing.l,
  },
  sectionCard: {
    backgroundColor: Theme.colors.cardTranslucentSoft,
    borderRadius: Theme.layout.radius,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarm,
    padding: Theme.spacing.m,
    gap: Theme.spacing.m,
  },
  sectionHeader: {
    gap: Theme.spacing.s2,
  },
  sectionTitle: {
    color: Theme.colors.text,
    fontSize: Theme.typography.size.s16,
    fontFamily: Theme.fonts.semiBold,
  },
  sectionSubtitle: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.size.s12,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.s8,
  },
  loadingText: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.size.s12,
  },
  emptyText: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.size.s12,
  },
  errorText: {
    color: Theme.colors.textError,
    fontSize: Theme.typography.size.s12,
  },
  contentList: {
    gap: Theme.spacing.s10,
  },
  contentCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.r14,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarm,
    padding: Theme.spacing.s12,
    gap: Theme.spacing.s6,
  },
  contentTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: Theme.spacing.s8,
    paddingVertical: Theme.spacing.s2,
    borderRadius: Theme.radius.pill,
  },
  contentTagText: {
    fontSize: Theme.typography.size.s11,
    color: Theme.colors.text,
    fontFamily: Theme.fonts.semiBold,
  },
  contentTitle: {
    fontSize: Theme.typography.size.s15,
    color: Theme.colors.text,
    fontFamily: Theme.fonts.semiBold,
  },
  contentSubtitle: {
    fontSize: Theme.typography.size.s13,
    color: Theme.colors.textSecondary,
  },
  placeholderCard: {
    backgroundColor: Theme.colors.cardTranslucentSoft,
    borderRadius: Theme.layout.radius,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarm,
    padding: Theme.spacing.m,
    gap: Theme.spacing.s,
  },
  placeholderTitle: {
    color: Theme.colors.text,
    fontSize: Theme.typography.size.s16,
    fontFamily: Theme.fonts.semiBold,
  },
  placeholderText: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.size.s14,
  },
  uploadCard: {
    backgroundColor: Theme.colors.backgroundWarmAlt,
    borderRadius: Theme.layout.radius,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarm,
    padding: Theme.spacing.m,
    gap: Theme.spacing.m,
  },
  uploadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Theme.spacing.s,
  },
  uploadHeaderPressed: {
    transform: [{ scale: Theme.scale.pressedSoft }],
  },
  uploadTitle: {
    color: Theme.colors.text,
    fontSize: Theme.typography.size.s16,
    fontFamily: Theme.fonts.semiBold,
  },
  uploadSubtitle: {
    marginTop: Theme.spacing.s2,
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.size.s12,
  },
  uploadToggle: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.size.s12,
    fontFamily: Theme.fonts.semiBold,
  },
  uploadBody: {
    gap: Theme.spacing.m,
  },
  uploadTypeRow: {
    flexDirection: 'row',
    gap: Theme.spacing.s,
    flexWrap: 'wrap',
  },
  uploadTypePill: {
    paddingHorizontal: Theme.spacing.s12,
    paddingVertical: Theme.spacing.s6,
    borderRadius: Theme.radius.pill,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderNeutral,
    backgroundColor: Theme.colors.surfaceNeutral,
  },
  uploadTypePillActive: {
    backgroundColor: Theme.colors.ctaBackground,
    borderColor: Theme.colors.ctaBorder,
  },
  uploadTypePillPressed: {
    transform: [{ scale: Theme.scale.pressedSoft }],
  },
  uploadTypeText: {
    fontSize: Theme.typography.size.s12,
    fontFamily: Theme.fonts.semiBold,
    color: Theme.colors.textEmphasis,
  },
  uploadTypeTextActive: {
    color: Theme.colors.textWarmStrong,
  },
  formFields: {
    gap: Theme.spacing.s10,
  },
  cardForm: {
    gap: Theme.spacing.s16,
  },
  cardPhotoUpload: {
    minHeight: Theme.sizes.s180,
    borderRadius: Theme.radius.r18,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.ctaBorder,
    borderStyle: 'dashed',
    backgroundColor: Theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardPhotoUploadPressed: {
    transform: [{ scale: Theme.scale.pressedSoft }],
  },
  cardPhotoPlaceholder: {
    alignItems: 'center',
    gap: Theme.spacing.s8,
  },
  cardPhotoPlaceholderText: {
    color: Theme.colors.textWarm,
    fontSize: Theme.typography.size.s14,
    fontFamily: Theme.fonts.semiBold,
  },
  cardPhotoImage: {
    width: '100%',
    height: '100%',
  },
  cardPhotoHint: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.size.s12,
    textAlign: 'center',
  },
  cardInlineError: {
    color: Theme.colors.textError,
    fontSize: Theme.typography.size.s12,
  },
  cardField: {
    gap: Theme.spacing.s,
  },
  cardLabel: {
    color: Theme.colors.textWarmStrong,
    fontSize: Theme.typography.size.s14,
    fontFamily: Theme.fonts.semiBold,
  },
  cardInput: {
    minHeight: Theme.sizes.s44,
    paddingVertical: Theme.spacing.s,
    paddingHorizontal: Theme.spacing.s16,
    borderRadius: Theme.radius.r22,
    backgroundColor: Theme.colors.card,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.ctaBorder,
    color: Theme.colors.textWarmStrong,
    fontSize: Theme.typography.size.s14,
  },
  cardSelect: {
    minHeight: Theme.sizes.s44,
    paddingVertical: Theme.spacing.s,
    paddingHorizontal: Theme.spacing.s16,
    borderRadius: Theme.radius.r22,
    backgroundColor: Theme.colors.card,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.ctaBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardSelectPressed: {
    transform: [{ scale: Theme.scale.pressedSoft }],
  },
  cardSelectValue: {
    color: Theme.colors.textWarmStrong,
    fontSize: Theme.typography.size.s14,
  },
  cardSelectPlaceholder: {
    color: Theme.colors.placeholder,
    fontSize: Theme.typography.size.s14,
  },
  cardOptionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.s8,
    alignItems: 'center',
  },
  cardOptionPill: {
    paddingVertical: Theme.spacing.s6,
    paddingHorizontal: Theme.spacing.s14,
    borderRadius: Theme.radius.pill,
    backgroundColor: Theme.colors.card,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.ctaBorder,
  },
  cardOptionPillActive: {
    backgroundColor: Theme.colors.ctaBackground,
    borderColor: Theme.colors.ctaBorder,
  },
  cardOptionPillPressed: {
    transform: [{ scale: Theme.scale.pressedSoft }],
  },
  cardOptionText: {
    color: Theme.colors.textWarm,
    fontSize: Theme.typography.size.s12,
  },
  cardOptionTextActive: {
    fontFamily: Theme.fonts.semiBold,
  },
  cardSectionTitle: {
    color: Theme.colors.textWarmStrong,
    fontSize: Theme.typography.size.s15,
    fontFamily: Theme.fonts.semiBold,
  },
  cardHelperText: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.size.s12,
    lineHeight: Theme.typography.lineHeight.s16,
  },
  cardTextAreaWrap: {
    borderRadius: Theme.radius.r18,
    backgroundColor: Theme.colors.card,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.ctaBorder,
    padding: Theme.spacing.s12,
  },
  cardTextArea: {
    minHeight: Theme.sizes.s90,
    color: Theme.colors.textWarmStrong,
    fontSize: Theme.typography.size.s14,
    textAlignVertical: 'top',
    padding: Theme.spacing.s0,
  },
  cardMicBadge: {
    position: 'absolute',
    right: Theme.spacing.s12,
    bottom: Theme.spacing.s12,
  },
  cardTagHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.s8,
    alignItems: 'center',
  },
  cardTagPill: {
    paddingHorizontal: Theme.spacing.s12,
    paddingVertical: Theme.spacing.s6,
    borderRadius: Theme.radius.pill,
    backgroundColor: Theme.colors.ctaBackground,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.ctaBorder,
  },
  cardTagText: {
    color: Theme.colors.textWarmStrong,
    fontSize: Theme.typography.size.s12,
    fontFamily: Theme.fonts.semiBold,
  },
  cardTagEmpty: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.size.s12,
  },
  cardTagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Theme.spacing.s8,
    paddingVertical: Theme.spacing.s6,
    paddingHorizontal: Theme.spacing.s12,
    borderRadius: Theme.radius.pill,
    backgroundColor: Theme.colors.decorativePeachAlt,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarmSoft,
  },
  cardTagButtonPressed: {
    transform: [{ scale: Theme.scale.pressedSoft }],
  },
  cardTagButtonDisabled: {
    opacity: Theme.opacity.o6,
  },
  cardTagButtonText: {
    color: Theme.colors.textWarmStrong,
    fontSize: Theme.typography.size.s12,
    fontFamily: Theme.fonts.semiBold,
  },
  cardSubmitButton: {
    marginTop: Theme.spacing.s4,
    backgroundColor: Theme.colors.primary,
    paddingVertical: Theme.spacing.s12,
    borderRadius: Theme.radius.pill,
    alignItems: 'center',
  },
  cardSubmitButtonPressed: {
    transform: [{ scale: Theme.scale.pressedSoft }],
  },
  cardSubmitButtonDisabled: {
    opacity: Theme.opacity.o7,
  },
  cardSubmitButtonText: {
    color: Theme.colors.textInverse,
    fontSize: Theme.typography.size.s16,
    fontFamily: Theme.fonts.semiBold,
  },
  formLabel: {
    fontSize: Theme.typography.size.s12,
    fontFamily: Theme.fonts.semiBold,
    color: Theme.colors.textSubtle,
  },
  formInput: {
    minHeight: Theme.sizes.s40,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarmAlt,
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.r12,
    paddingHorizontal: Theme.spacing.s12,
    paddingVertical: Theme.spacing.s8,
    fontSize: Theme.typography.size.s14,
    color: Theme.colors.text,
  },
  formInputMultiline: {
    minHeight: Theme.sizes.s80,
    textAlignVertical: 'top',
  },
  formHint: {
    fontSize: Theme.typography.size.s12,
    color: Theme.colors.textSecondary,
  },
  photoPicker: {
    paddingVertical: Theme.spacing.s10,
    borderRadius: Theme.radius.r12,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarmAlt,
    backgroundColor: Theme.colors.card,
    alignItems: 'center',
  },
  photoPickerPressed: {
    transform: [{ scale: Theme.scale.pressedSoft }],
  },
  photoPickerDisabled: {
    opacity: Theme.opacity.o6,
  },
  photoPickerText: {
    fontSize: Theme.typography.size.s13,
    fontWeight: Theme.typography.weight.semiBold,
    color: Theme.colors.textWarmStrong,
  },
  photoPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.s10,
  },
  photoPreview: {
    width: Theme.sizes.s56,
    height: Theme.sizes.s56,
    borderRadius: Theme.radius.r10,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarmAlt,
    backgroundColor: Theme.colors.surfaceWarm,
  },
  photoMeta: {
    flex: Theme.layout.full,
    gap: Theme.spacing.s4,
  },
  photoNameText: {
    fontSize: Theme.typography.size.s12,
    color: Theme.colors.text,
  },
  photoStatusText: {
    fontSize: Theme.typography.size.s12,
    color: Theme.colors.textSecondary,
  },
  photoErrorText: {
    fontSize: Theme.typography.size.s12,
    color: Theme.colors.textError,
  },
  choiceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.s8,
  },
  choicePill: {
    paddingHorizontal: Theme.spacing.s12,
    paddingVertical: Theme.spacing.s6,
    borderRadius: Theme.radius.pill,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderNeutral,
    backgroundColor: Theme.colors.backgroundNeutral,
  },
  choicePillActive: {
    backgroundColor: Theme.colors.text,
    borderColor: Theme.colors.text,
  },
  choicePillPressed: {
    transform: [{ scale: Theme.scale.pressedSoft }],
  },
  choiceText: {
    fontSize: Theme.typography.size.s12,
    fontFamily: Theme.fonts.semiBold,
    color: Theme.colors.textEmphasis,
  },
  choiceTextActive: {
    color: Theme.colors.textInverse,
  },
  submitButton: {
    marginTop: Theme.spacing.s6,
    paddingVertical: Theme.spacing.s12,
    borderRadius: Theme.radius.r14,
    backgroundColor: Theme.colors.successDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: Theme.opacity.o6,
  },
  submitButtonPressed: {
    transform: [{ scale: Theme.scale.pressedSoft }],
  },
  submitButtonText: {
    color: Theme.colors.textInverse,
    fontSize: Theme.typography.size.s14,
    fontFamily: Theme.fonts.semiBold,
  },
  submitMessage: {
    marginTop: Theme.spacing.s4,
    fontSize: Theme.typography.size.s12,
  },
  submitMessageError: {
    color: Theme.colors.textError,
  },
  submitMessageSuccess: {
    color: Theme.colors.textSuccess,
  },
  loginHint: {
    gap: Theme.spacing.s8,
  },
  loginHintText: {
    fontSize: Theme.typography.size.s13,
    color: Theme.colors.textSecondary,
  },
  loginButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: Theme.spacing.s12,
    paddingVertical: Theme.spacing.s6,
    borderRadius: Theme.radius.pill,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarm,
    backgroundColor: Theme.colors.card,
  },
  loginButtonPressed: {
    transform: [{ scale: Theme.scale.pressedSoft }],
  },
  loginButtonText: {
    fontSize: Theme.typography.size.s12,
    color: Theme.colors.textEmphasis,
    fontFamily: Theme.fonts.semiBold,
  },
  postPanel: {
    gap: Theme.spacing.m,
  },
  snapButton: {
    backgroundColor: Theme.colors.successDeep,
    borderRadius: Theme.layout.radius,
    paddingVertical: Theme.spacing.m,
    alignItems: 'center',
  },
  snapButtonPressed: {
    transform: [{ scale: Theme.scale.pressedSoft }],
  },
  snapButtonText: {
    color: Theme.colors.textInverse,
    fontSize: Theme.typography.size.s14,
    fontFamily: Theme.fonts.semiBold,
  },
  statusPill: {
    alignSelf: 'flex-start',
    backgroundColor: Theme.colors.warningSurface,
    borderRadius: Theme.layout.radius,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.warningBorder,
    paddingVertical: Theme.spacing.s,
    paddingHorizontal: Theme.spacing.m,
  },
  statusText: {
    color: Theme.colors.warningText,
    fontSize: Theme.typography.size.s12,
    fontFamily: Theme.fonts.semiBold,
  },
  resultCard: {
    backgroundColor: Theme.colors.cardTranslucentSoft,
    borderRadius: Theme.layout.radius,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarm,
    padding: Theme.spacing.m,
    gap: Theme.spacing.m,
  },
  resultTitle: {
    color: Theme.colors.text,
    fontSize: Theme.typography.size.s16,
    fontFamily: Theme.fonts.semiBold,
  },
  resultSubtitle: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.size.s13,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.s,
  },
  tag: {
    backgroundColor: Theme.colors.surfaceNeutral,
    borderRadius: Theme.layout.radius,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderNeutral,
    paddingVertical: Theme.spacing.s,
    paddingHorizontal: Theme.spacing.m,
  },
  tagText: {
    color: Theme.colors.text,
    fontSize: Theme.typography.size.s12,
    fontFamily: Theme.fonts.semiBold,
  },
  pushButton: {
    backgroundColor: Theme.colors.successDeep,
    borderRadius: Theme.layout.radius,
    paddingVertical: Theme.spacing.m,
    alignItems: 'center',
  },
  pushButtonPressed: {
    transform: [{ scale: Theme.scale.pressedSoft }],
  },
  pushButtonText: {
    color: Theme.colors.textInverse,
    fontSize: Theme.typography.size.s13,
    fontFamily: Theme.fonts.semiBold,
    textAlign: 'center',
  },
  pushStatusText: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.size.s12,
  },
});
