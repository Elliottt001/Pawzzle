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
import { FontAwesome5 } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Theme } from '../../../constants/theme';
import { getSession, subscribeSession, type AuthSession } from '@/lib/session';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080');
const ensureChinese = (message: string, fallback: string) =>
  /[\u4e00-\u9fff]/.test(message) ? message : fallback;

const resolveParam = (value: string | string[] | undefined) => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || typeof raw !== 'string') {
    return null;
  }
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
};

const breedOptions = {
  CAT: ['英短', '布偶', '暹罗'],
  DOG: ['柯基', '柴犬', '迷你贵宾'],
} as const;

const locationOptions = ['杭州', '北京', '上海'] as const;

const RECOGNIZED_INFO = {
  breed: '柯基' as const,
  location: '杭州',
  ageGuess: '2',
};

const DEFAULT_DESCRIPTION = '性格友好，适合家庭领养。';
const FALLBACK_TAGS = ['干饭王', '小粘人', '高冷', '温顺', '小太阳', '机灵鬼'];
const GENDER_OPTIONS = [
  { id: 'male', label: '公' },
  { id: 'female', label: '母' },
] as const;
const STATUS_OPTIONS = ['已绝育', '已完成疫苗', '疫苗进行中', '未接种/不确定'] as const;

export default function PetRehomeVerifyScreen() {
  const router = useRouter();
  const { mode, photoUri, photoName, photoType } = useLocalSearchParams();
  const modeValue = Array.isArray(mode) ? mode[0] : mode;
  const resolvedPhotoUri = resolveParam(photoUri);
  const resolvedPhotoName = resolveParam(photoName);
  const resolvedPhotoType = resolveParam(photoType);
  const isManual = modeValue === 'manual' && !resolvedPhotoUri;
  const [session, setSessionState] = React.useState<AuthSession | null>(() => getSession());
  const [photoUriState, setPhotoUriState] = React.useState<string | null>(resolvedPhotoUri);
  const [photoNameState, setPhotoNameState] = React.useState<string | null>(resolvedPhotoName);
  const [photoTypeState, setPhotoTypeState] = React.useState<string | null>(resolvedPhotoType);
  const [name, setName] = React.useState('团子');
  const [age, setAge] = React.useState(RECOGNIZED_INFO.ageGuess);
  const [breed, setBreed] = React.useState<string | null>(() =>
    isManual ? null : RECOGNIZED_INFO.breed,
  );
  const [location] = React.useState<string>(() =>
    isManual ? locationOptions[0] : RECOGNIZED_INFO.location,
  );
  const [personalityText, setPersonalityText] = React.useState('');
  const [avoidAdopterText, setAvoidAdopterText] = React.useState('');
  const [gender, setGender] = React.useState<(typeof GENDER_OPTIONS)[number]['id'] | null>(
    null,
  );
  const [careStatus, setCareStatus] = React.useState<(typeof STATUS_OPTIONS)[number] | null>(null);
  const [tags, setTags] = React.useState<string[]>([]);
  const [tagStatus, setTagStatus] = React.useState<'idle' | 'generating' | 'ready'>('idle');
  const [tagError, setTagError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = React.useState<string | null>(null);
  const [photoUploadStatus, setPhotoUploadStatus] = React.useState<
    'idle' | 'uploading' | 'ready' | 'error'
  >('idle');
  const [photoUploadError, setPhotoUploadError] = React.useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = React.useState<string | null>(null);
  const [breedOpen, setBreedOpen] = React.useState(false);
  const allBreeds = React.useMemo(
    () => [...breedOptions.CAT, ...breedOptions.DOG],
    [],
  );

  React.useEffect(() => {
    const unsubscribe = subscribeSession((nextSession) => {
      setSessionState(nextSession);
    });
    return unsubscribe;
  }, []);

  React.useEffect(() => {
    if (breed && !allBreeds.includes(breed)) {
      setBreed(null);
    }
  }, [allBreeds, breed]);

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

  const uploadPhoto = async () => {
    if (!photoUriState || !session?.token) {
      return null;
    }
    setPhotoUploadStatus('uploading');
    setPhotoUploadError(null);
    try {
      const extension = resolveExtension(photoNameState, photoTypeState);
      const fileName = buildFileName(photoNameState, extension);
      const mimeType = resolveMimeType(photoTypeState, extension);
      const formData = new FormData();
      if (Platform.OS === 'web') {
        const response = await fetch(photoUriState);
        const blob = await response.blob();
        const finalType = blob.type || mimeType;
        const file = new File([blob], fileName, { type: finalType });
        formData.append('file', file);
      } else {
        formData.append('file', {
          uri: photoUriState,
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
      setUploadedImageUrl(data.url);
      setPhotoUploadStatus('ready');
      return data.url;
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      const friendly = ensureChinese(message, '图片上传失败，请稍后再试。');
      setPhotoUploadStatus('error');
      setPhotoUploadError(friendly);
      setSaveError(friendly);
      return null;
    }
  };

  const handlePickPhoto = async () => {
    if (photoUploadStatus === 'uploading') {
      return;
    }
    setPhotoUploadError(null);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setPhotoUploadError('需要相册权限才能选择照片。');
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
        setPhotoUploadError('未获取到照片，请重试。');
        return;
      }
      const fallbackName = `pet-photo-${Date.now()}.jpg`;
      setPhotoUriState(asset.uri);
      setPhotoNameState(asset.fileName?.trim() || fallbackName);
      setPhotoTypeState(asset.mimeType?.trim() || 'image/jpeg');
      setUploadedImageUrl(null);
      setPhotoUploadStatus('idle');
    } catch {
      setPhotoUploadError('上传失败，请稍后再试。');
    }
  };

  const handleGenerateTags = async () => {
    if (tagStatus === 'generating') {
      return;
    }
    const trimmed = personalityText.trim();
    if (!trimmed) {
      setTagError('请先填写性格侧写内容。');
      return;
    }
    setTagError(null);
    setTagStatus('generating');

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
        body: JSON.stringify({ text: trimmed }),
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
      setTags(finalTags);
      setTagStatus('ready');
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      setTagError(ensureChinese(message, '标签生成失败，请稍后再试。'));
      setTagStatus('idle');
    }
  };

  const handlePublish = async () => {
    if (saving) {
      return;
    }
    if (!session?.token) {
      setSaveError('请先登录后再保存。');
      return;
    }
    const trimmedName = name.trim();
    const ageValue = Number(age);
    if (!trimmedName) {
      setSaveError('请填写宠物名字。');
      return;
    }
    if (!Number.isFinite(ageValue) || ageValue <= 0) {
      setSaveError('请填写正确的年龄。');
      return;
    }
    if (!breed) {
      setSaveError('请选择宠物品种。');
      return;
    }
    const resolvedSpecies = resolveSpeciesFromBreed(breed);
    if (!resolvedSpecies) {
      setSaveError('请选择宠物品种。');
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      let imageUrl = uploadedImageUrl;
      if (photoUriState && !imageUrl) {
        imageUrl = await uploadPhoto();
        if (!imageUrl) {
          return;
        }
      }
      const payload = {
        name: trimmedName,
        species: resolvedSpecies,
        breed,
        age: Math.round(ageValue),
        location,
        personalityTag: tags[0] ?? '亲人',
        description: personalityText.trim() || DEFAULT_DESCRIPTION,
        imageUrl: imageUrl ?? undefined,
      };
      const response = await fetch(`${API_BASE_URL}/api/pets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify(payload),
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
      setSaveSuccess('宠物卡片已生成。');
      router.replace('/(tabs)/pets');
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      setSaveError(ensureChinese(message, '发布失败，请稍后再试。'));
    } finally {
      setSaving(false);
    }
  };

  const tagButtonText = tagStatus === 'generating' ? '生成中...' : '生成';
  const canGenerateTags = personalityText.trim().length > 0 && tagStatus !== 'generating';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}>
          <FontAwesome5 name="chevron-left" size={Theme.sizes.s14} color={Theme.colors.textWarm} />
          <Text style={styles.backText}>返回</Text>
        </Pressable>
        <Text style={styles.topTitle}>添加宠物卡片</Text>
        <Pressable
          onPress={handlePublish}
          disabled={saving}
          style={({ pressed }) => [
            styles.saveButton,
            pressed && styles.saveButtonPressed,
            saving && styles.saveButtonDisabled,
          ]}>
          <Text style={styles.saveButtonText}>{saving ? '保存中' : '保存'}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable
          onPress={handlePickPhoto}
          style={({ pressed }) => [
            styles.photoUpload,
            pressed && styles.photoUploadPressed,
          ]}>
          {photoUriState ? (
            <Image source={{ uri: photoUriState }} style={styles.photoImage} contentFit="cover" />
          ) : (
            <View style={styles.photoPlaceholder}>
              <FontAwesome5 name="camera" size={Theme.sizes.s24} color={Theme.colors.textWarm} />
              <Text style={styles.photoPlaceholderText}>拍照/上传宠物照片</Text>
            </View>
          )}
        </Pressable>
        <Text style={styles.photoHint}>支持多图上传，最多6张</Text>
        {photoUploadError ? <Text style={styles.inlineError}>{photoUploadError}</Text> : null}

        <View style={styles.field}>
          <Text style={styles.label}>名字</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="输入宠物名字"
            placeholderTextColor={Theme.colors.placeholder}
            style={styles.input}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>品种</Text>
          <Pressable
            onPress={() => setBreedOpen((prev) => !prev)}
            style={({ pressed }) => [styles.selectInput, pressed && styles.selectInputPressed]}>
            <Text style={breed ? styles.selectValue : styles.selectPlaceholder}>
              {breed ?? '选择或输入品种'}
            </Text>
            <FontAwesome5 name="chevron-down" size={Theme.sizes.s12} color={Theme.colors.textWarm} />
          </Pressable>
          {breedOpen ? (
            <View style={styles.optionRow}>
              {allBreeds.map((option) => {
                const isActive = breed === option;
                return (
                  <Pressable
                    key={option}
                    onPress={() => {
                      setBreed(option);
                      setBreedOpen(false);
                    }}
                    style={({ pressed }) => [
                      styles.optionPill,
                      isActive && styles.optionPillActive,
                      pressed && styles.optionPillPressed,
                    ]}>
                    <Text style={[styles.optionText, isActive && styles.optionTextActive]}>
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>年龄</Text>
          <TextInput
            value={age}
            onChangeText={setAge}
            placeholder="输入年龄"
            placeholderTextColor={Theme.colors.placeholder}
            style={styles.input}
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>性别与状态</Text>
          <View style={styles.optionRow}>
            {GENDER_OPTIONS.map((option) => {
              const isActive = gender === option.id;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => setGender(option.id)}
                  style={({ pressed }) => [
                    styles.optionPill,
                    isActive && styles.optionPillActive,
                    pressed && styles.optionPillPressed,
                  ]}>
                  <Text style={[styles.optionText, isActive && styles.optionTextActive]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.optionRow}>
            {STATUS_OPTIONS.map((option) => {
              const isActive = careStatus === option;
              return (
                <Pressable
                  key={option}
                  onPress={() => setCareStatus(option)}
                  style={({ pressed }) => [
                    styles.optionPill,
                    isActive && styles.optionPillActive,
                    pressed && styles.optionPillPressed,
                  ]}>
                  <Text style={[styles.optionText, isActive && styles.optionTextActive]}>
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.sectionTitle}>AI 性格侧写</Text>
          <Text style={styles.helperText}>
            请介绍你家宝贝的个性（例如它是否特别粘人？它吃饭护食吗？它怕打雷吗？）
          </Text>
          <View style={styles.textAreaWrap}>
            <TextInput
              value={personalityText}
              onChangeText={setPersonalityText}
              placeholder="描述你家宝贝的性格特点...(可粘贴小红书/朋友圈文案)"
              placeholderTextColor={Theme.colors.placeholder}
              style={styles.textArea}
              multiline
            />
            <View style={styles.micBadge}>
              <FontAwesome5 name="microphone" size={Theme.sizes.s14} color={Theme.colors.textWarm} />
            </View>
          </View>
        </View>

        <View style={styles.field}>
          <View style={styles.tagHeader}>
            <Text style={styles.sectionTitle}>tag 生成</Text>
            <Pressable
              onPress={handleGenerateTags}
              disabled={!canGenerateTags}
              style={({ pressed }) => [
                styles.tagButton,
                pressed && styles.tagButtonPressed,
                !canGenerateTags && styles.tagButtonDisabled,
              ]}>
              {tagStatus === 'generating' ? (
                <ActivityIndicator size="small" color={Theme.colors.textWarmStrong} />
              ) : null}
              <Text style={styles.tagButtonText}>{tagButtonText}</Text>
            </Pressable>
          </View>
          <View style={styles.tagRow}>
            {tags.length ? (
              tags.map((tag) => (
                <View key={tag} style={styles.tagPill}>
                  <Text style={styles.tagText}># {tag}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.tagEmpty}>暂未生成标签</Text>
            )}
          </View>
          {tagError ? <Text style={styles.inlineError}>{tagError}</Text> : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.sectionTitle}>您觉得什么样的人千万不要养这只宠物?</Text>
          <View style={styles.textAreaWrap}>
            <TextInput
              value={avoidAdopterText}
              onChangeText={setAvoidAdopterText}
              placeholder="比如：禁止宿舍..."
              placeholderTextColor={Theme.colors.placeholder}
              style={styles.textArea}
              multiline
            />
            <View style={styles.micBadge}>
              <FontAwesome5 name="microphone" size={Theme.sizes.s14} color={Theme.colors.textWarm} />
            </View>
          </View>
        </View>

        <Pressable
          onPress={handlePublish}
          disabled={saving}
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.actionButtonPressed,
            saving && styles.actionButtonDisabled,
          ]}>
          <Text style={styles.actionButtonText}>
            {saving ? '生成中...' : '生成专属宠物信息卡'}
          </Text>
        </Pressable>

        {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}
        {saveSuccess ? <Text style={styles.successText}>{saveSuccess}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
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
    backgroundColor: Theme.colors.backgroundWarmAlt,
  },
  content: {
    paddingHorizontal: Theme.spacing.s20,
    paddingTop: Theme.spacing.s16,
    paddingBottom: Theme.sizes.s140,
    gap: Theme.spacing.s18,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.s16,
    paddingVertical: Theme.spacing.s12,
    borderBottomWidth: Theme.borderWidth.hairline,
    borderBottomColor: Theme.colors.borderWarm,
    backgroundColor: Theme.colors.backgroundWarmAlt,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.s6,
    minWidth: Theme.sizes.s60,
    paddingVertical: Theme.spacing.s4,
    paddingHorizontal: Theme.spacing.s6,
    borderRadius: Theme.radius.r12,
  },
  backButtonPressed: {
    opacity: Theme.opacity.o7,
  },
  backText: {
    color: Theme.colors.textWarm,
    fontSize: Theme.typography.size.s14,
  },
  topTitle: {
    flex: 1,
    textAlign: 'center',
    color: Theme.colors.textWarmStrong,
    fontSize: Theme.typography.size.s16,
    fontFamily: Theme.fonts.semiBold,
  },
  saveButton: {
    minWidth: Theme.sizes.s60,
    alignItems: 'center',
    paddingVertical: Theme.spacing.s4,
    paddingHorizontal: Theme.spacing.s10,
    borderRadius: Theme.radius.r12,
    backgroundColor: Theme.colors.decorativePeachAlt,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarmSoft,
  },
  saveButtonPressed: {
    transform: [{ scale: Theme.scale.pressedSoft }],
  },
  saveButtonDisabled: {
    opacity: Theme.opacity.o6,
  },
  saveButtonText: {
    color: Theme.colors.textWarmStrong,
    fontSize: Theme.typography.size.s12,
    fontFamily: Theme.fonts.semiBold,
  },
  photoUpload: {
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
  photoUploadPressed: {
    transform: [{ scale: Theme.scale.pressedSoft }],
  },
  photoPlaceholder: {
    alignItems: 'center',
    gap: Theme.spacing.s8,
  },
  photoPlaceholderText: {
    color: Theme.colors.textWarm,
    fontSize: Theme.typography.size.s14,
    fontFamily: Theme.fonts.semiBold,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoHint: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.size.s12,
    textAlign: 'center',
  },
  inlineError: {
    color: Theme.colors.textError,
    fontSize: Theme.typography.size.s12,
  },
  field: {
    gap: Theme.spacing.s,
  },
  label: {
    color: Theme.colors.textWarmStrong,
    fontSize: Theme.typography.size.s14,
    fontFamily: Theme.fonts.semiBold,
  },
  input: {
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
  selectInput: {
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
  selectInputPressed: {
    transform: [{ scale: Theme.scale.pressedSoft }],
  },
  selectValue: {
    color: Theme.colors.textWarmStrong,
    fontSize: Theme.typography.size.s14,
  },
  selectPlaceholder: {
    color: Theme.colors.placeholder,
    fontSize: Theme.typography.size.s14,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.s8,
    alignItems: 'center',
  },
  optionPill: {
    paddingVertical: Theme.spacing.s6,
    paddingHorizontal: Theme.spacing.s14,
    borderRadius: Theme.radius.pill,
    backgroundColor: Theme.colors.card,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.ctaBorder,
  },
  optionPillActive: {
    backgroundColor: Theme.colors.ctaBackground,
    borderColor: Theme.colors.ctaBorder,
  },
  optionPillPressed: {
    transform: [{ scale: Theme.scale.pressedSoft }],
  },
  optionText: {
    color: Theme.colors.textWarm,
    fontSize: Theme.typography.size.s12,
  },
  optionTextActive: {
    fontFamily: Theme.fonts.semiBold,
  },
  sectionTitle: {
    color: Theme.colors.textWarmStrong,
    fontSize: Theme.typography.size.s15,
    fontFamily: Theme.fonts.semiBold,
  },
  helperText: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.size.s12,
    lineHeight: Theme.typography.lineHeight.s16,
  },
  textAreaWrap: {
    borderRadius: Theme.radius.r18,
    backgroundColor: Theme.colors.card,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.ctaBorder,
    padding: Theme.spacing.s12,
  },
  textArea: {
    minHeight: Theme.sizes.s90,
    color: Theme.colors.textWarmStrong,
    fontSize: Theme.typography.size.s14,
    textAlignVertical: 'top',
    padding: Theme.spacing.s0,
  },
  micBadge: {
    position: 'absolute',
    right: Theme.spacing.s12,
    bottom: Theme.spacing.s12,
  },
  tagHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.s8,
    alignItems: 'center',
  },
  tagPill: {
    paddingHorizontal: Theme.spacing.s12,
    paddingVertical: Theme.spacing.s6,
    borderRadius: Theme.radius.pill,
    backgroundColor: Theme.colors.ctaBackground,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.ctaBorder,
  },
  tagText: {
    color: Theme.colors.textWarmStrong,
    fontSize: Theme.typography.size.s12,
    fontFamily: Theme.fonts.semiBold,
  },
  tagEmpty: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.size.s12,
  },
  tagButton: {
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
  tagButtonPressed: {
    transform: [{ scale: Theme.scale.pressedSoft }],
  },
  tagButtonDisabled: {
    opacity: Theme.opacity.o6,
  },
  tagButtonText: {
    color: Theme.colors.textWarmStrong,
    fontSize: Theme.typography.size.s12,
    fontFamily: Theme.fonts.semiBold,
  },
  actionButton: {
    marginTop: Theme.spacing.s4,
    backgroundColor: Theme.colors.primary,
    paddingVertical: Theme.spacing.s12,
    borderRadius: Theme.radius.pill,
    alignItems: 'center',
  },
  actionButtonPressed: {
    transform: [{ scale: Theme.scale.pressedSoft }],
  },
  actionButtonDisabled: {
    opacity: Theme.opacity.o7,
  },
  actionButtonText: {
    color: Theme.colors.textInverse,
    fontSize: Theme.typography.size.s16,
    fontFamily: Theme.fonts.semiBold,
  },
  errorText: {
    color: Theme.colors.textError,
    fontSize: Theme.typography.size.s12,
    textAlign: 'center',
  },
  successText: {
    color: Theme.colors.successDeep,
    fontSize: Theme.typography.size.s12,
    textAlign: 'center',
  },
});
