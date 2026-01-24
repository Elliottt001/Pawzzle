import * as React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Theme } from '../../../constants/theme';
import { getSession, subscribeSession, type AuthSession } from '@/lib/session';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080');
const ensureChinese = (message: string, fallback: string) =>
  /[\u4e00-\u9fff]/.test(message) ? message : fallback;

const RECOGNIZED_INFO = {
  species: 'DOG' as const,
  speciesLabel: '狗狗',
  breed: 'Corgi' as const,
  breedLabel: '柯基',
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
  const [session, setSessionState] = React.useState<AuthSession | null>(() => getSession());
  const [name, setName] = React.useState('团子');
  const [age, setAge] = React.useState(RECOGNIZED_INFO.ageGuess);
  const [noteText, setNoteText] = React.useState('');
  const [tags, setTags] = React.useState<string[]>([]);
  const [tagStatus, setTagStatus] = React.useState<'idle' | 'generating' | 'ready'>('idle');
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = React.useState<string | null>(null);

  React.useEffect(() => {
    const unsubscribe = subscribeSession((nextSession) => {
      setSessionState(nextSession);
    });
    return unsubscribe;
  }, []);

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

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);
    const payload = {
      name: trimmedName,
      species: RECOGNIZED_INFO.species,
      breed: RECOGNIZED_INFO.breed,
      age: Math.round(ageValue),
      location: RECOGNIZED_INFO.location,
      personalityTag: tags[0] ?? '亲人',
      description: noteText.trim() || DEFAULT_DESCRIPTION,
    };

    try {
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
          <Text style={styles.subtitle}>拍照识别与文本分析已完成。</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>影像识别结果</Text>
          <View style={styles.photoRow}>
            <View style={styles.photoBox}>
              <FontAwesome5 name="camera" size={Theme.sizes.s24} color={Theme.colors.textSecondary} />
              <Text style={styles.photoText}>识别完成</Text>
            </View>
            <View style={styles.readonlyColumn}>
              <View style={styles.readonlyItem}>
                <Text style={styles.label}>类型</Text>
                <Text style={styles.readonlyValue}>{RECOGNIZED_INFO.speciesLabel}</Text>
              </View>
              <View style={styles.readonlyItem}>
                <Text style={styles.label}>品种</Text>
                <Text style={styles.readonlyValue}>{RECOGNIZED_INFO.breedLabel}</Text>
              </View>
              <View style={styles.readonlyItem}>
                <Text style={styles.label}>城市</Text>
                <Text style={styles.readonlyValue}>{RECOGNIZED_INFO.location}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>医疗证明</Text>
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
    fontWeight: Theme.typography.weight.semiBold,
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
    fontWeight: Theme.typography.weight.semiBold,
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
  },
  photoText: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.size.s12,
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
    fontWeight: Theme.typography.weight.semiBold,
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
    fontWeight: Theme.typography.weight.semiBold,
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
    fontWeight: Theme.typography.weight.semiBold,
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
    fontWeight: Theme.typography.weight.semiBold,
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
    fontWeight: Theme.typography.weight.semiBold,
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
