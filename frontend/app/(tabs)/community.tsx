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

const speciesOptions = [
  { id: 'CAT', label: '猫' },
  { id: 'DOG', label: '狗' },
] as const;

const breedOptions = {
  CAT: ['英短', '布偶', '暹罗'],
  DOG: ['柯基', '柴犬', '迷你贵宾'],
} as const;

const locationOptions = ['杭州', '北京', '上海'] as const;

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080');
const ensureChinese = (message: string, fallback: string) =>
  /[\u4e00-\u9fff]/.test(message) ? message : fallback;

type TabId = (typeof TABS)[number]['id'];
type UploadType = (typeof uploadTypes)[number]['id'];
type SpeciesId = (typeof speciesOptions)[number]['id'];

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
  const [cardSpecies, setCardSpecies] = React.useState<SpeciesId | null>(null);
  const [cardBreed, setCardBreed] = React.useState<string | null>(null);
  const [cardAge, setCardAge] = React.useState('');
  const [cardLocation, setCardLocation] = React.useState<string | null>(null);
  const [cardPersonality, setCardPersonality] = React.useState('');
  const [cardDescription, setCardDescription] = React.useState('');
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
  const selectedBreeds = cardSpecies ? breedOptions[cardSpecies] : [];
  const contentLabel = uploadType === 'update' ? '动态' : '指南';

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
    if (uploadType !== 'card') {
      setCardPhotoUri(null);
      setCardPhotoName(null);
      setCardPhotoType(null);
      setCardPhotoUploadStatus('idle');
      setCardPhotoUploadError(null);
      setCardPhotoImageUrl(null);
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
    const personalityTag = cardPersonality.trim();
    const location = cardLocation?.trim() ?? '';
    const description = cardDescription.trim();
    const ageValue = Number(cardAge);

    if (!name) {
      setSubmitStatus('error');
      setSubmitMessage('请输入名字。');
      return;
    }
    if (!cardSpecies) {
      setSubmitStatus('error');
      setSubmitMessage('请选择物种。');
      return;
    }
    if (!cardBreed) {
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
    if (!personalityTag) {
      setSubmitStatus('error');
      setSubmitMessage('请填写性格标签。');
      return;
    }
    if (/\s/.test(personalityTag)) {
      setSubmitStatus('error');
      setSubmitMessage('性格标签请填写一个词。');
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
          species: cardSpecies,
          breed: cardBreed,
          age: ageValue,
          location,
          personalityTag,
          description: description || undefined,
          imageUrl: imageUrl ?? undefined,
        },
        session?.token
      );
      setSubmitStatus('success');
      setSubmitMessage('卡片已发布。');
      setCardName('');
      setCardSpecies(null);
      setCardBreed(null);
      setCardAge('');
      setCardLocation(null);
      setCardPersonality('');
      setCardDescription('');
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
                      <View style={styles.formFields}>
                        <FieldLabel text="名字" />
                        <TextInput
                          value={cardName}
                          onChangeText={setCardName}
                          placeholder="宠物名字"
                          placeholderTextColor={Theme.colors.placeholder}
                          style={styles.formInput}
                        />

                        <FieldLabel text="物种" />
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
                                <Text
                                  style={[
                                    styles.choiceText,
                                    isActive && styles.choiceTextActive,
                                  ]}>
                                  {option.label}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>

                        <FieldLabel text="品种" />
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
                                  <Text
                                    style={[
                                      styles.choiceText,
                                      isActive && styles.choiceTextActive,
                                    ]}>
                                    {breed}
                                  </Text>
                                </Pressable>
                              );
                            })}
                          </View>
                        ) : (
                          <Text style={styles.formHint}>请先选择物种以查看品种。</Text>
                        )}

                        <FieldLabel text="年龄（岁）" />
                        <TextInput
                          value={cardAge}
                          onChangeText={(value) => setCardAge(value.replace(/[^0-9]/g, ''))}
                          placeholder="例如：2"
                          placeholderTextColor={Theme.colors.placeholder}
                          keyboardType="number-pad"
                          style={styles.formInput}
                        />

                        <FieldLabel text="城市" />
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
                                <Text
                                  style={[
                                    styles.choiceText,
                                    isActive && styles.choiceTextActive,
                                  ]}>
                                  {location}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>

                        <FieldLabel text="宠物照片（可选）" />
                        <Pressable
                          onPress={handlePickCardPhoto}
                          disabled={isSubmitting}
                          style={({ pressed }) => [
                            styles.photoPicker,
                            pressed && styles.photoPickerPressed,
                            isSubmitting && styles.photoPickerDisabled,
                          ]}>
                          <Text style={styles.photoPickerText}>
                            {cardPhotoUri ? '重新选择照片' : '选择照片'}
                          </Text>
                        </Pressable>
                        {cardPhotoUri ? (
                          <View style={styles.photoPreviewRow}>
                            <Image
                              source={{ uri: cardPhotoUri }}
                              style={styles.photoPreview}
                              contentFit="cover"
                            />
                            <View style={styles.photoMeta}>
                              <Text style={styles.photoNameText}>
                                {cardPhotoName ?? '已选择照片'}
                              </Text>
                              <Text style={styles.photoStatusText}>
                                {cardPhotoUploadStatus === 'uploading'
                                  ? '照片上传中...'
                                  : cardPhotoUploadStatus === 'ready'
                                    ? '照片已上传'
                                    : '照片将随发布上传'}
                              </Text>
                            </View>
                          </View>
                        ) : (
                          <Text style={styles.formHint}>未选择照片。</Text>
                        )}
                        {cardPhotoUploadError ? (
                          <Text style={styles.photoErrorText}>{cardPhotoUploadError}</Text>
                        ) : null}

                        <FieldLabel text="性格标签（一个词）" />
                        <TextInput
                          value={cardPersonality}
                          onChangeText={setCardPersonality}
                          placeholder="活泼"
                          placeholderTextColor={Theme.colors.placeholder}
                          style={styles.formInput}
                          autoCapitalize="none"
                        />

                        <FieldLabel text="描述（可选）" />
                        <TextInput
                          value={cardDescription}
                          onChangeText={setCardDescription}
                          placeholder="简单介绍..."
                          placeholderTextColor={Theme.colors.placeholder}
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
                            {isSubmitting ? '发布中...' : '发布卡片'}
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
    backgroundColor: Theme.colors.cardTranslucentSoft,
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
    backgroundColor: Theme.colors.successDeep,
    borderColor: Theme.colors.successDeep,
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
    color: Theme.colors.textInverse,
  },
  formFields: {
    gap: Theme.spacing.s10,
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
