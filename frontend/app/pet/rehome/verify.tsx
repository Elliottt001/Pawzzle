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

const speciesOptions = [
  { id: 'CAT', label: '猫' },
  { id: 'DOG', label: '狗' },
] as const;

const breedOptions = {
  CAT: ['英短', '布偶', '暹罗'],
  DOG: ['柯基', '柴犬', '迷你贵宾'],
} as const;

const locationOptions = ['杭州', '北京', '上海'] as const;

type SpeciesId = (typeof speciesOptions)[number]['id'];

const RECOGNIZED_INFO = {
  species: 'DOG' as const,
  speciesLabel: '狗狗',
  breed: '柯基' as const,
  location: '杭州',
  ageGuess: '2',
  medicalProofs: ['疫苗接种记录完整', '驱虫证明已核验', '体检合格报告已上传'],
  docIds: ['免疫证编号：HZ-2024-11', '体检编号：PET-2024-728'],
};

const DEFAULT_DESCRIPTION = '已完成体检与免疫，性格友好，适合家庭领养。';
const TAG_RULES = [
  { keyword: '温顺', tag: '温顺' },
  { keyword: '亲人', tag: '亲人' },
  { keyword: '安静', tag: '安静' },
  { keyword: '活泼', tag: '活泼' },
  { keyword: '护主', tag: '护主' },
  { keyword: '胆小', tag: '怕生' },
  { keyword: '疫苗', tag: '已免疫' },
];
const DEFAULT_TAGS = ['适合家庭', '已免疫', '易相处'];

export default function PetRehomeVerifyScreen() {
  const router = useRouter();
  const { mode, photoUri, photoName, photoType } = useLocalSearchParams();
  const modeValue = Array.isArray(mode) ? mode[0] : mode;
  const resolvedPhotoUri = resolveParam(photoUri);
  const resolvedPhotoName = resolveParam(photoName);
  const resolvedPhotoType = resolveParam(photoType);
  const isManual = modeValue === 'manual' && !resolvedPhotoUri;
  const [session, setSessionState] = React.useState<AuthSession | null>(() => getSession());
  const [name, setName] = React.useState('团子');
  const [age, setAge] = React.useState(RECOGNIZED_INFO.ageGuess);
  const [species, setSpecies] = React.useState<SpeciesId | null>(() =>
    isManual ? null : RECOGNIZED_INFO.species,
  );
  const [breed, setBreed] = React.useState<string | null>(() =>
    isManual ? null : RECOGNIZED_INFO.breed,
  );
  const [location, setLocation] = React.useState<string | null>(() =>
    isManual ? null : RECOGNIZED_INFO.location,
  );
  const [noteText, setNoteText] = React.useState('');
  const [tags, setTags] = React.useState<string[]>([]);
  const [tagStatus, setTagStatus] = React.useState<'idle' | 'generating' | 'ready'>('idle');
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = React.useState<string | null>(null);
  const [photoUploadStatus, setPhotoUploadStatus] = React.useState<
    'idle' | 'uploading' | 'ready' | 'error'
  >('idle');
  const [photoUploadError, setPhotoUploadError] = React.useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = React.useState<string | null>(null);
  const selectedBreeds = species ? breedOptions[species] : [];

  React.useEffect(() => {
    const unsubscribe = subscribeSession((nextSession) => {
      setSessionState(nextSession);
    });
    return unsubscribe;
  }, []);

  React.useEffect(() => {
    if (!species) {
      setBreed(null);
      return;
    }
    const speciesBreeds = breedOptions[species];
    if (breed && !speciesBreeds.some((option) => option === breed)) {
      setBreed(null);
    }
  }, [breed, species]);

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
    if (!resolvedPhotoUri || !session?.token) {
      return null;
    }
    setPhotoUploadStatus('uploading');
    setPhotoUploadError(null);
    try {
      const extension = resolveExtension(resolvedPhotoName, resolvedPhotoType);
      const fileName = buildFileName(resolvedPhotoName, extension);
      const mimeType = resolveMimeType(resolvedPhotoType, extension);
      const formData = new FormData();
      if (Platform.OS === 'web') {
        const response = await fetch(resolvedPhotoUri);
        const blob = await response.blob();
        const finalType = blob.type || mimeType;
        const file = new File([blob], fileName, { type: finalType });
        formData.append('file', file);
      } else {
        formData.append('file', {
          uri: resolvedPhotoUri,
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

  const handleGenerateTags = () => {
    if (!noteText.trim()) {
      setSaveError('请先填写个人说明。');
      return;
    }
    setSaveError(null);
    setTagStatus('generating');
    setTimeout(() => {
      setTags(buildTags(noteText));
      setTagStatus('ready');
    }, 600);
  };

  const handlePublish = async () => {
    if (saving) {
      return;
    }
    if (!session?.token) {
      setSaveError('请先登录后再发布。');
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
    if (!species) {
      setSaveError('请选择宠物类型。');
      return;
    }
    if (!breed) {
      setSaveError('请选择宠物品种。');
      return;
    }
    if (!location) {
      setSaveError('请选择所在城市。');
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      let imageUrl = uploadedImageUrl;
      if (resolvedPhotoUri && !imageUrl) {
        imageUrl = await uploadPhoto();
        if (!imageUrl) {
          return;
        }
      }
      const payload = {
        name: trimmedName,
        species,
        breed,
        age: Math.round(ageValue),
        location,
        personalityTag: tags[0] ?? '亲人',
        description: noteText.trim() || DEFAULT_DESCRIPTION,
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
      setSaveSuccess('宠物卡片已发布。');
      router.replace('/(tabs)/pets');
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      setSaveError(ensureChinese(message, '发布失败，请稍后再试。'));
    } finally {
      setSaving(false);
    }
  };

  const tagButtonText =
    tagStatus === 'generating' ? '识别中...' : tags.length ? '重新生成标签' : '生成标签';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>宠物卡片录入</Text>
          <Text style={styles.subtitle}>
            {isManual ? '照片可选，未上传也能发布。请手动填写信息。' : '拍照识别与文本分析已完成。'}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>影像识别结果</Text>
          <View style={styles.photoRow}>
            <View style={styles.photoBox}>
              {resolvedPhotoUri ? (
                <Image source={{ uri: resolvedPhotoUri }} style={styles.photoImage} contentFit="cover" />
              ) : (
                <>
                  <FontAwesome5
                    name="camera"
                    size={Theme.sizes.s24}
                    color={Theme.colors.textSecondary}
                  />
                  <Text style={styles.photoText}>{isManual ? '未上传照片' : '识别完成'}</Text>
                </>
              )}
            </View>
            {isManual ? (
              <View style={styles.readonlyColumn}>
                <Text style={styles.photoHint}>已跳过识别，可在下方手动填写。</Text>
              </View>
            ) : (
              <View style={styles.readonlyColumn}>
                <View style={styles.readonlyItem}>
                  <Text style={styles.label}>类型</Text>
                  <Text style={styles.readonlyValue}>{RECOGNIZED_INFO.speciesLabel}</Text>
                </View>
                <View style={styles.readonlyItem}>
                  <Text style={styles.label}>品种</Text>
                  <Text style={styles.readonlyValue}>{RECOGNIZED_INFO.breed}</Text>
                </View>
                <View style={styles.readonlyItem}>
                  <Text style={styles.label}>城市</Text>
                  <Text style={styles.readonlyValue}>{RECOGNIZED_INFO.location}</Text>
                </View>
              </View>
            )}
          </View>
          {!isManual ? <Text style={styles.referenceHint}>识别仅供参考，可在下方调整。</Text> : null}
          {resolvedPhotoUri ? (
            <Text style={styles.photoUploadHint}>
              {photoUploadStatus === 'uploading'
                ? '照片上传中...'
                : photoUploadStatus === 'ready'
                  ? '照片已上传'
                  : '照片将随发布一起上传。'}
            </Text>
          ) : null}
          {photoUploadError ? <Text style={styles.photoUploadError}>{photoUploadError}</Text> : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>医疗证明</Text>
          {isManual ? (
            <Text style={styles.proofEmptyText}>暂无上传，可后续补充。</Text>
          ) : (
            <>
              <View style={styles.proofList}>
                {RECOGNIZED_INFO.medicalProofs.map((item) => (
                  <View key={item} style={styles.proofItem}>
                    <Text style={styles.proofText}>{item}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.proofList}>
                {RECOGNIZED_INFO.docIds.map((item) => (
                  <View key={item} style={styles.docItem}>
                    <Text style={styles.docText}>{item}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>宠物基础信息</Text>
          <View style={styles.field}>
            <Text style={styles.label}>名字</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="请输入名字"
              placeholderTextColor={Theme.colors.placeholder}
              style={styles.input}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>年龄</Text>
            <TextInput
              value={age}
              onChangeText={setAge}
              placeholder="请输入年龄"
              placeholderTextColor={Theme.colors.placeholder}
              style={styles.input}
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>类型</Text>
            <View style={styles.optionRow}>
              {speciesOptions.map((option) => {
                const isActive = species === option.id;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => setSpecies(option.id)}
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
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>品种</Text>
            <View style={styles.optionRow}>
              {selectedBreeds.length ? (
                selectedBreeds.map((option) => {
                  const isActive = breed === option;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => setBreed(option)}
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
                })
              ) : (
                <Text style={styles.optionHint}>请先选择类型。</Text>
              )}
            </View>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>城市</Text>
            <View style={styles.optionRow}>
              {locationOptions.map((option) => {
                const isActive = location === option;
                return (
                  <Pressable
                    key={option}
                    onPress={() => setLocation(option)}
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
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>个人说明</Text>
          <View style={styles.videoCard}>
            <FontAwesome5 name="play" size={Theme.sizes.s18} color={Theme.colors.textInverse} />
            <View>
              <Text style={styles.videoTitle}>视频已上传</Text>
              <Text style={styles.videoHint}>00:12 · 行为记录</Text>
            </View>
          </View>
          <TextInput
            value={noteText}
            onChangeText={setNoteText}
            placeholder="输入视频描述或补充说明..."
            placeholderTextColor={Theme.colors.placeholder}
            style={styles.textArea}
            multiline
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>识别标签</Text>
          <View style={styles.tagRow}>
            {tags.length ? (
              tags.map((tag) => (
                <View key={tag} style={styles.tagPill}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.tagEmpty}>暂无识别结果</Text>
            )}
          </View>
          <Pressable
            onPress={handleGenerateTags}
            disabled={tagStatus === 'generating'}
            style={({ pressed }) => [
              styles.tagButton,
              pressed && styles.tagButtonPressed,
              tagStatus === 'generating' && styles.tagButtonDisabled,
            ]}>
            {tagStatus === 'generating' ? (
              <ActivityIndicator size="small" color={Theme.colors.textWarmStrong} />
            ) : null}
            <Text style={styles.tagButtonText}>{tagButtonText}</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={handlePublish}
          disabled={saving}
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.actionButtonPressed,
            saving && styles.actionButtonDisabled,
          ]}>
          <Text style={styles.actionButtonText}>{saving ? '发布中...' : '发布宠物卡片'}</Text>
        </Pressable>

        {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}
        {saveSuccess ? <Text style={styles.successText}>{saveSuccess}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function buildTags(text: string) {
  const hits = TAG_RULES.filter((rule) => text.includes(rule.keyword)).map((rule) => rule.tag);
  const deduped = Array.from(new Set(hits));
  for (const fallback of DEFAULT_TAGS) {
    if (deduped.length >= 3) {
      break;
    }
    if (!deduped.includes(fallback)) {
      deduped.push(fallback);
    }
  }
  return deduped.slice(0, 4);
}

const styles = StyleSheet.create({
  container: {
    flex: Theme.layout.full,
    backgroundColor: Theme.colors.background,
  },
  content: {
    padding: Theme.spacing.l,
    gap: Theme.spacing.l,
    paddingBottom: Theme.sizes.s120,
  },
  header: {
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
  card: {
    backgroundColor: Theme.colors.cardTranslucentSoft,
    borderRadius: Theme.layout.radius,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarm,
    padding: Theme.spacing.m,
    gap: Theme.spacing.m,
  },
  sectionTitle: {
    color: Theme.colors.text,
    fontSize: Theme.typography.size.s16,
    fontFamily: Theme.fonts.semiBold,
  },
  photoRow: {
    flexDirection: 'row',
    gap: Theme.spacing.m,
    alignItems: 'center',
  },
  photoBox: {
    width: Theme.sizes.s110,
    height: Theme.sizes.s110,
    borderRadius: Theme.layout.radius,
    backgroundColor: Theme.colors.surfaceNeutral,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderNeutral,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Theme.spacing.s,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoText: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.size.s12,
  },
  photoHint: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.size.s12,
  },
  referenceHint: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.size.s12,
    marginTop: Theme.spacing.s,
  },
  photoUploadHint: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.size.s12,
    marginTop: Theme.spacing.s2,
  },
  photoUploadError: {
    color: Theme.colors.textError,
    fontSize: Theme.typography.size.s12,
    marginTop: Theme.spacing.s2,
  },
  readonlyColumn: {
    flex: Theme.layout.full,
    gap: Theme.spacing.s,
  },
  readonlyItem: {
    gap: Theme.spacing.s2,
  },
  field: {
    gap: Theme.spacing.s,
  },
  label: {
    color: Theme.colors.textSubtle,
    fontSize: Theme.typography.size.s13,
    fontFamily: Theme.fonts.semiBold,
  },
  readonlyValue: {
    color: Theme.colors.text,
    fontSize: Theme.typography.size.s14,
  },
  proofList: {
    gap: Theme.spacing.s6,
  },
  proofItem: {
    paddingVertical: Theme.spacing.s6,
    paddingHorizontal: Theme.spacing.s10,
    borderRadius: Theme.radius.r12,
    backgroundColor: Theme.colors.surfaceNeutral,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderNeutral,
  },
  proofText: {
    color: Theme.colors.text,
    fontSize: Theme.typography.size.s13,
  },
  proofEmptyText: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.size.s12,
  },
  docItem: {
    paddingVertical: Theme.spacing.s6,
    paddingHorizontal: Theme.spacing.s10,
    borderRadius: Theme.radius.r12,
    backgroundColor: Theme.colors.card,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarmAlt,
  },
  docText: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.size.s12,
  },
  input: {
    minHeight: Theme.sizes.s44,
    paddingVertical: Theme.spacing.s,
    paddingHorizontal: Theme.spacing.m,
    borderRadius: Theme.layout.radius,
    backgroundColor: Theme.colors.card,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarmAlt,
    color: Theme.colors.text,
    fontSize: Theme.typography.size.s14,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.s8,
    alignItems: 'center',
  },
  optionPill: {
    paddingVertical: Theme.spacing.s4,
    paddingHorizontal: Theme.spacing.s12,
    borderRadius: Theme.radius.pill,
    backgroundColor: Theme.colors.card,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarmAlt,
  },
  optionPillActive: {
    backgroundColor: Theme.colors.surfaceWarm,
    borderColor: Theme.colors.borderWarmSoft,
  },
  optionPillPressed: {
    transform: [{ scale: Theme.scale.pressedSoft }],
  },
  optionText: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.size.s12,
  },
  optionTextActive: {
    color: Theme.colors.textWarm,
    fontWeight: Theme.typography.weight.semiBold,
  },
  optionHint: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.size.s12,
  },
  videoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.s12,
    paddingVertical: Theme.spacing.s10,
    paddingHorizontal: Theme.spacing.s12,
    borderRadius: Theme.radius.r14,
    backgroundColor: Theme.colors.successDeep,
  },
  videoTitle: {
    color: Theme.colors.textInverse,
    fontSize: Theme.typography.size.s14,
    fontFamily: Theme.fonts.semiBold,
  },
  videoHint: {
    color: Theme.colors.textInverse,
    fontSize: Theme.typography.size.s12,
  },
  textArea: {
    minHeight: Theme.sizes.s90,
    paddingVertical: Theme.spacing.s10,
    paddingHorizontal: Theme.spacing.m,
    borderRadius: Theme.layout.radius,
    backgroundColor: Theme.colors.card,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarmAlt,
    color: Theme.colors.text,
    fontSize: Theme.typography.size.s14,
    textAlignVertical: 'top',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.s8,
    alignItems: 'center',
  },
  tagPill: {
    paddingHorizontal: Theme.spacing.s10,
    paddingVertical: Theme.spacing.s4,
    borderRadius: Theme.radius.pill,
    backgroundColor: Theme.colors.surfaceWarm,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarmSoft,
  },
  tagText: {
    color: Theme.colors.textWarm,
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
    paddingVertical: Theme.spacing.s10,
    borderRadius: Theme.radius.r18,
    backgroundColor: Theme.colors.card,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarmAlt,
  },
  tagButtonPressed: {
    transform: [{ scale: Theme.scale.pressedSoft }],
  },
  tagButtonDisabled: {
    opacity: Theme.opacity.o6,
  },
  tagButtonText: {
    color: Theme.colors.textWarmStrong,
    fontSize: Theme.typography.size.s13,
    fontFamily: Theme.fonts.semiBold,
  },
  actionButton: {
    backgroundColor: Theme.colors.successDeep,
    paddingVertical: Theme.spacing.m,
    borderRadius: Theme.layout.radius,
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
    fontSize: Theme.typography.size.s14,
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
