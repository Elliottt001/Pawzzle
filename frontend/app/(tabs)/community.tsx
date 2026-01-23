import * as React from 'react';
import {
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
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

export default function CommunityScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<TabId>('recommend');
  const [isScanning, setIsScanning] = React.useState(false);
  const [hasResult, setHasResult] = React.useState(false);
  const [pushStatus, setPushStatus] = React.useState<'idle' | 'sent'>('idle');
  const [session, setSessionState] = React.useState<AuthSession | null>(() => getSession());
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [uploadType, setUploadType] = React.useState<UploadType>('card');
  const [cardName, setCardName] = React.useState('');
  const [cardSpecies, setCardSpecies] = React.useState<SpeciesId | null>(null);
  const [cardBreed, setCardBreed] = React.useState<string | null>(null);
  const [cardAge, setCardAge] = React.useState('');
  const [cardLocation, setCardLocation] = React.useState<string | null>(null);
  const [cardPersonality, setCardPersonality] = React.useState('');
  const [cardDescription, setCardDescription] = React.useState('');
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
  }, [uploadType]);

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
          <View style={styles.placeholderCard}>
            <Text style={styles.placeholderTitle}>推荐内容</Text>
            <Text style={styles.placeholderText}>
              精选内容和本地动态将在这里呈现。
            </Text>
          </View>
        ) : null}

        {activeTab === 'knowledge' ? (
          <View style={styles.placeholderCard}>
            <Text style={styles.placeholderTitle}>知识库</Text>
            <Text style={styles.placeholderText}>
              养宠指南与照护技巧将在这里呈现。
            </Text>
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
                      onPress={() => router.push('/(tabs)/profile')}
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
    fontWeight: Theme.typography.weight.semiBold,
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
    fontWeight: Theme.typography.weight.semiBold,
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
    fontWeight: Theme.typography.weight.semiBold,
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
    fontWeight: Theme.typography.weight.semiBold,
  },
  uploadSubtitle: {
    marginTop: Theme.spacing.s2,
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.size.s12,
  },
  uploadToggle: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.size.s12,
    fontWeight: Theme.typography.weight.semiBold,
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
    fontWeight: Theme.typography.weight.semiBold,
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
    fontWeight: Theme.typography.weight.semiBold,
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
    fontWeight: Theme.typography.weight.semiBold,
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
    fontWeight: Theme.typography.weight.semiBold,
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
    fontWeight: Theme.typography.weight.semiBold,
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
    fontWeight: Theme.typography.weight.semiBold,
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
    fontWeight: Theme.typography.weight.semiBold,
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
    fontWeight: Theme.typography.weight.semiBold,
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
    fontWeight: Theme.typography.weight.semiBold,
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
    fontWeight: Theme.typography.weight.semiBold,
    textAlign: 'center',
  },
  pushStatusText: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.size.s12,
  },
});
