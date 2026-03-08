import * as React from 'react';
import {
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Text } from '@/components/base-text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { PetCard } from '@/components/pet-card';
import type { PetCardData } from '@/types/pet';
import { Theme } from '@/constants/theme';
import { API_BASE_URL } from '@/lib/apiBase';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import AgentAvatarSvg from '@/assets/images/Agent.svg';
import SendIcon from '@/assets/images/send.svg';

type ChatRole = 'user' | 'ai' | 'debug';

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

type AgentMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type EvaluationResponse = {
  ismalicious?: number | null;
  endverification: boolean;
  profile?: string | null;
  nextQuestions?: string[] | null;
  nextQuestion?: string | null;
  prompt?: string | null;
  rawResponse?: string | null;
};

type EvaluationSummary = {
  profile: string;
};

type AgentDecisionItem = { id: string; confidence?: number };

type AgentDecisionResponse = {
  ismalicious?: number | null;
  items: AgentDecisionItem[];
  rawResponse?: string;
  prompt?: string;
  debug?: string;
};

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const ensureChinese = (message: string, fallback: string) =>
  /[\u4e00-\u9fff]/.test(message) ? message : fallback;
const WAITING_TEXT_INTERVAL_MS = 2600;
const RECOMMEND_MAX_RETRIES = 3;
const RECOMMEND_RETRY_BASE_DELAY_MS = 1200;
const RECOMMEND_RETRY_MAX_DELAY_MS = 5000;
const EVALUATING_WAITING_TEXTS = [
  'Pawzy 正在思考...',
];
const RECOMMENDING_WAITING_TEXTS = [
  '正在筛选合适的毛孩子...',
  '正在匹配性格与生活节奏...',
  '正在生成推荐结果...',
];
const VOICE_TRANSCRIBE_URL = `${API_BASE_URL}/api/voice/transcribe`;
const TEST_TRANSCRIBE_URL = `${API_BASE_URL}/api/voice/transcribe-test-file`;
const MALICIOUS_TERMINATION_TEXT =
  '根据您目前的情况，暂时没有与您匹配的宠物呢，可以去宠物广场看看～';

type FlowPhase = 'quiz' | 'chat' | 'survey' | 'result';

type QuizOption = { label: string; text: string };
type QuizQuestion = { id: number; title: string; options: QuizOption[] };

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 0,
    title: '你更倾向什么类型的宠物？',
    options: [
      { label: 'A', text: '猫咪' },
      { label: 'B', text: '狗狗' },
      { label: 'C', text: '都可以，看眼缘' },
    ],
  },
  {
    id: 1,
    title: '你更喜欢的宠物年龄？',
    options: [
      { label: 'A', text: '幼崽（可爱但费心）' },
      { label: 'B', text: '青年（活泼好养）' },
      { label: 'C', text: '成年（稳定懂事）' },
      { label: 'D', text: '老年（温柔安静）' },
    ],
  },
  {
    id: 2,
    title: '你对毛发有偏好吗？',
    options: [
      { label: 'A', text: '长毛' },
      { label: 'B', text: '短毛' },
      { label: 'C', text: '无毛' },
      { label: 'D', text: '都可以' },
    ],
  },
];

const SURVEY_FIELDS = [
  { key: 'age', label: '年龄', placeholder: '例如：25' },
  { key: 'location', label: '省市县', placeholder: '例如：浙江省杭州市' },
  { key: 'workStatus', label: '工作情况', placeholder: '例如：全职上班族' },
  { key: 'salary', label: '薪资情况', placeholder: '例如：8k-12k' },
  { key: 'livingStatus', label: '居住情况', placeholder: '例如：独居/合租/和家人住' },
  { key: 'familyAcceptance', label: '家人接受情况', placeholder: '例如：家人支持' },
  { key: 'petExperience', label: '养宠经验', placeholder: '例如：养过一只猫两年' },
];

function buildSystemPromptFromQuiz(answers: Record<number, string>): string {
  const petType = answers[0] ?? '未选择';
  const agePreference = answers[1] ?? '未选择';
  const furPreference = answers[2] ?? '未选择';
  return [
    '你是 Pawzy，一只温暖友好的宠物匹配助理。请用轻松自然、像朋友聊天一样的语气和用户对话。',
    '',
    '用户已经在初始问卷中告诉了我们以下偏好：',
    `- 宠物类型偏好：${petType}`,
    `- 年龄偏好：${agePreference}`,
    `- 毛发偏好：${furPreference}`,
    '',
    '【极其严格的提问规则】',
    '你必须通过对话收集以下4个维度的信息，但【绝对不可以】在一条回复中问多个维度的信息！',
    '你一次【只能】提问一个维度。必须等用户回答完毕后，针对用户的回答给予简短、温暖的反馈，然后再抛出下一个维度的问题。',
    '',
    '需要收集的维度顺序：',
    '第一步：请用户描述一下自己（性格、生活习惯、喜好等），以及心目中理想宠物的性格。',
    '第二步：假设周末的一天，希望和宠物怎样一起度过。',
    '第三步：问问能不能接受宠物的一些行为（如掉毛、叫闹、偶尔调皮拆家、晚上活动等）。',
    '第四步：未来生活中出现突发变故（比如搬家、出差），会怎样对待自己的宠物。',
    '',
    '现在，请根据上面的“第一步”，结合用户的初始偏好，用自然聊天、非结构化的话术，向用户发起第一句开场提问！千万不要一上来就把后面的步骤也问了。',
  ].join('\n');
}

export default function AgentScreen() {
  const [hasStarted, setHasStarted] = React.useState(false);
  const [phase, setPhase] = React.useState<FlowPhase>('quiz');
  const [attitudePromptInput, setAttitudePromptInput] = React.useState('');
  const [activeAttitudePrompt, setActiveAttitudePrompt] = React.useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = React.useState<Record<number, string>>({});
  const [surveyData, setSurveyData] = React.useState<Record<string, string>>({});
  const [activeSystemPrompt, setActiveSystemPrompt] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState('');
  const [status, setStatus] = React.useState<'idle' | 'evaluating' | 'recommending' | 'error'>(
    'idle'
  );
  const [petCards, setPetCards] = React.useState<PetCardData[]>([]);
  const [petCardsStatus, setPetCardsStatus] = React.useState<'loading' | 'ready' | 'error'>(
    'loading'
  );
  const [evaluation, setEvaluation] = React.useState<EvaluationSummary | null>(null);
  const [recommendedItems, setRecommendedItems] = React.useState<AgentDecisionItem[]>([]);
  const [isTranscribing, setIsTranscribing] = React.useState(false);
  const [isTestingSample, setIsTestingSample] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [waitingIndex, setWaitingIndex] = React.useState(0);
  const scrollRef = React.useRef<ScrollView | null>(null);
  const hasStartedRef = React.useRef(false);
  const { startRecording, stopRecording, isRecording } = useVoiceRecorder();

  const isBusy = status === 'evaluating' || status === 'recommending';
  const isInputLocked = isBusy || isTranscribing || isTestingSample;
  const canSend = input.trim().length > 0 && !isInputLocked && phase === 'chat' && !evaluation;
  const canApplyAttitudePrompt = attitudePromptInput.trim().length > 0;
  const waitingMessages =
    status === 'recommending' ? RECOMMENDING_WAITING_TEXTS : EVALUATING_WAITING_TEXTS;
  const waitingText = waitingMessages[waitingIndex % waitingMessages.length];

  React.useEffect(() => {
    if (!isBusy) {
      setWaitingIndex(0);
      return;
    }

    setWaitingIndex(0);
    const activeMessages =
      status === 'recommending' ? RECOMMENDING_WAITING_TEXTS : EVALUATING_WAITING_TEXTS;
    const interval = setInterval(() => {
      setWaitingIndex((prev) => (prev + 1) % activeMessages.length);
    }, WAITING_TEXT_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isBusy, status]);

  const appendMessage = React.useCallback((role: ChatRole, content: string) => {
    setMessages((prev) => [...prev, { id: createId(), role, content }]);
  }, []);

  const appendDebug = React.useCallback((_title: string, _payload?: string | null) => {
    // Debug output disabled on the agent page.
  }, []);

  const buildAgentMessages = React.useCallback((items: ChatMessage[]) => {
    return items
      .filter((item) => item.role !== 'debug')
      .map<AgentMessage>((item) => ({
        role: item.role === 'user' ? 'user' : 'assistant',
        content: item.content,
      }));
  }, []);

  const formatEvaluationSummary = React.useCallback((summary: EvaluationSummary) => {
    return [
      '评估完成：',
      summary.profile,
    ].join('\n');
  }, []);

  const handleMaliciousInterruption = React.useCallback(() => {
    setRecommendedItems([]);
    setEvaluation({ profile: MALICIOUS_TERMINATION_TEXT });
    setErrorMessage(null);
    appendMessage('ai', MALICIOUS_TERMINATION_TEXT);
  }, [appendMessage]);

  const loadPetCards = React.useCallback(async () => {
    if (petCardsStatus === 'ready' && petCards.length) {
      return petCards;
    }
    setPetCardsStatus('loading');
    try {
      const data = await getJson<PetCardData[]>('/api/pets');
      setPetCards(data ?? []);
      setPetCardsStatus('ready');
      return data ?? [];
    } catch (error) {
      setPetCardsStatus('error');
      const message = error instanceof Error ? error.message : '';
      setErrorMessage(ensureChinese(message, '宠物卡片加载失败'));
      return [] as PetCardData[];
    }
  }, [petCards, petCardsStatus]);

  React.useEffect(() => {
    if (hasStarted) {
      loadPetCards();
    }
  }, [hasStarted, loadPetCards]);

  const resetConversationState = React.useCallback(() => {
    setMessages([]);
    setInput('');
    setStatus('idle');
    setEvaluation(null);
    setRecommendedItems([]);
    setErrorMessage(null);
    setWaitingIndex(0);
    setIsTranscribing(false);
    setIsTestingSample(false);
  }, []);

  const handleApplyAttitudePrompt = React.useCallback(() => {
    const trimmed = attitudePromptInput.trim();
    if (!trimmed) return;
    setActiveAttitudePrompt(trimmed);
    setPhase('quiz');
  }, [attitudePromptInput]);

  const handleChangeAttitudePrompt = React.useCallback(() => {
    hasStartedRef.current = false;
    resetConversationState();
    setAttitudePromptInput(activeAttitudePrompt ?? '');
    setActiveAttitudePrompt(null);
    setActiveSystemPrompt(null);
    setPhase('quiz');
  }, [activeAttitudePrompt, resetConversationState]);

  const handleQuizComplete = React.useCallback((answers: Record<number, string>) => {
    setQuizAnswers(answers);
    const quizPrompt = buildSystemPromptFromQuiz(answers);
    const combined = activeAttitudePrompt
      ? `${quizPrompt}\n\n【对话态度要求】\n${activeAttitudePrompt}`
      : quizPrompt;
    setActiveSystemPrompt(combined);
    hasStartedRef.current = false;
    resetConversationState();
    setPhase('chat');
  }, [resetConversationState, activeAttitudePrompt]);

  const handleSurveyComplete = React.useCallback(async (data: Record<string, string>) => {
    setSurveyData(data);
    setPhase('result');
    if (!evaluation) return;
    setStatus('recommending');
    try {
      const surveyContext = SURVEY_FIELDS
        .filter((f) => data[f.key]?.trim())
        .map((f) => `${f.label}：${data[f.key]}`)
        .join('\n');
      const enhancedPrompt = (activeSystemPrompt ?? '') +
        (surveyContext ? `\n\n用户的基本信息：\n${surveyContext}` : '');
      await loadPetCards();
      const decision = await requestRecommendation(
        evaluation,
        buildAgentMessages(messages),
        enhancedPrompt
      );
      if ((decision?.ismalicious ?? 0) === 1) {
        handleMaliciousInterruption();
        return;
      }
      setRecommendedItems(decision?.items ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      setErrorMessage(ensureChinese(message, '推荐生成失败'));
    } finally {
      setStatus('idle');
    }
  }, [evaluation, messages, activeSystemPrompt, buildAgentMessages, handleMaliciousInterruption, loadPetCards]);

  const handleSurveySkip = React.useCallback(async () => {
    setPhase('result');
    if (!evaluation) return;
    setStatus('recommending');
    try {
      await loadPetCards();
      const decision = await requestRecommendation(
        evaluation,
        buildAgentMessages(messages),
        activeSystemPrompt ?? ''
      );
      if ((decision?.ismalicious ?? 0) === 1) {
        handleMaliciousInterruption();
        return;
      }
      setRecommendedItems(decision?.items ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      setErrorMessage(ensureChinese(message, '推荐生成失败'));
    } finally {
      setStatus('idle');
    }
  }, [evaluation, messages, activeSystemPrompt, buildAgentMessages, handleMaliciousInterruption, loadPetCards]);

  // Effect: when entering chat phase, send initial evaluation request
  React.useEffect(() => {
    if (phase !== 'chat' || !activeSystemPrompt || hasStartedRef.current) {
      return;
    }
    hasStartedRef.current = true;
    setStatus('evaluating');
    setErrorMessage(null);

    requestEvaluation([], activeSystemPrompt)
      .then((data) => {
        if ((data?.ismalicious ?? 0) === 1) {
          handleMaliciousInterruption();
          return undefined;
        }
        if (data?.endverification) {
          const summary = buildEvaluationSummary(data);
          setEvaluation(summary);
          appendMessage('ai', formatEvaluationSummary(summary));
          setPhase('survey');
          return undefined;
        }

        const questions = normalizeQuestions(data);
        if (questions.length) {
          appendMessage('ai', questions[0]);
        }
        return undefined;
      })
      .catch((error) => {
        setStatus('error');
        const message = error instanceof Error ? error.message : '';
        setErrorMessage(ensureChinese(message, '聊天初始化失败'));
      })
      .finally(() => {
        setStatus('idle');
      });
  }, [
    appendDebug,
    appendMessage,
    activeSystemPrompt,
    formatEvaluationSummary,
    phase,
    handleMaliciousInterruption,
  ]);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 0);
    return () => clearTimeout(timeout);
  }, [messages, recommendedItems]);

  const handleVoicePressIn = React.useCallback(async () => {
    if (isInputLocked || evaluation) {
      return;
    }
    try {
      setErrorMessage(null);
      await startRecording();
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      setErrorMessage(ensureChinese(message, '录音启动失败'));
    }
  }, [evaluation, isInputLocked, setErrorMessage, startRecording]);

  const handleVoicePressOut = React.useCallback(async () => {
    if (evaluation) {
      return;
    }
    try {
      const uri = await stopRecording();
      if (!uri) {
        return;
      }

      setIsTranscribing(true);
      const formData = await buildVoiceFormData(uri);

      const response = await fetch(VOICE_TRANSCRIBE_URL, {
        method: 'POST',
        body: formData,
      });

      let payload: { text?: string; error?: string } | null = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (!response.ok) {
        const message = payload?.error ?? `HTTP ${response.status}`;
        throw new Error(String(message));
      }

      const text = typeof payload?.text === 'string' ? payload.text.trim() : '';
      if (text.length > 0) {
        setInput(text);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      setErrorMessage(message || '语音识别失败');
    } finally {
      setIsTranscribing(false);
    }
  }, [evaluation, setErrorMessage, stopRecording]);

  const handleTestAudioClick = React.useCallback(async () => {
    if (isInputLocked || evaluation) {
      return;
    }
    try {
      setErrorMessage(null);
      setIsTestingSample(true);

      const response = await fetch(TEST_TRANSCRIBE_URL, {
        method: 'POST',
      });

      let payload: { text?: string; error?: string } | null = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (!response.ok) {
        const message = payload?.error ?? `HTTP ${response.status}`;
        throw new Error(String(message));
      }

      const text = typeof payload?.text === 'string' ? payload.text.trim() : '';
      if (text.length === 0) {
        throw new Error('测试音频识别结果为空');
      }
      setInput(text);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      setErrorMessage(message || '测试音频识别失败');
    } finally {
      setIsTestingSample(false);
    }
  }, [evaluation, isInputLocked, setErrorMessage]);

  const handleSend = async () => {
    if (!activeSystemPrompt || phase !== 'chat') {
      return;
    }
    const trimmed = input.trim();
    if (!trimmed || isInputLocked || evaluation) {
      return;
    }

    const userMessage: ChatMessage = {
      id: createId(),
      role: 'user',
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setErrorMessage(null);

    setStatus('evaluating');
    const nextMessages = [...messages, userMessage];

    try {
      const data = await requestEvaluation(buildAgentMessages(nextMessages), activeSystemPrompt);
      if ((data?.ismalicious ?? 0) === 1) {
        handleMaliciousInterruption();
        return;
      }

      if (data?.endverification) {
        const summary = buildEvaluationSummary(data);
        setEvaluation(summary);
        appendMessage('ai', formatEvaluationSummary(summary));
        setPhase('survey');
      } else {
        const questions = normalizeQuestions(data);
        if (questions.length) {
          appendMessage('ai', questions[0]);
        }
      }
    } catch (error) {
      setStatus('error');
      const message = error instanceof Error ? error.message : '';
      setErrorMessage(ensureChinese(message, '出现问题，请稍后重试'));
    } finally {
      setStatus('idle');
    }
  };

  const visiblePets = React.useMemo(() => {
    if (!recommendedItems.length || !petCards.length) {
      return [] as { pet: PetCardData; confidence?: number }[];
    }
    const petById = new Map(petCards.map((pet) => [pet.id, pet]));
    return recommendedItems
      .map((item) => {
        const pet = petById.get(item.id);
        return pet ? { pet, confidence: item.confidence } : null;
      })
      .filter(Boolean) as { pet: PetCardData; confidence?: number }[];
  }, [petCards, recommendedItems]);

  if (!hasStarted) {
    return <AgentStartScreen onStart={() => {
      hasStartedRef.current = false;
      setHasStarted(true);
      setActiveAttitudePrompt(null);
      setAttitudePromptInput('');
      setPhase('quiz');
      setQuizAnswers({});
      setSurveyData({});
      setActiveSystemPrompt(null);
      resetConversationState();
    }} />;
  }

  if (!activeAttitudePrompt) {
    return (
      <AttitudePromptSetupScreen
        value={attitudePromptInput}
        onChange={setAttitudePromptInput}
        onApply={handleApplyAttitudePrompt}
        onBack={() => setHasStarted(false)}
        canApply={canApplyAttitudePrompt}
      />
    );
  }

  if (phase === 'quiz') {
    return (
      <QuizScreen
        onComplete={handleQuizComplete}
        onBack={() => setHasStarted(false)}
      />
    );
  }

  if (phase === 'survey') {
    return (
      <SurveyScreen
        onComplete={handleSurveyComplete}
        onSkip={handleSurveySkip}
        onBack={() => setPhase('chat')}
      />
    );
  }

  if (phase === 'result') {
    return (
      <SafeAreaView style={styles.safeArea as object}>
        <View style={styles.background as object}>
          <View style={[styles.blob, styles.blobLeft]} />
          <View style={[styles.blob, styles.blobRight]} />
          <View style={[styles.blob, styles.blobBottom]} />
        </View>
        <ScrollView contentContainerStyle={quizStyles.resultContent} bounces={false}>
          
          <Text style={quizStyles.resultTitle}>你的专属宠物匹配结果</Text>
          {evaluation ? (
            <View style={quizStyles.resultProfileCard}>
              <Text style={quizStyles.resultProfileText}>{evaluation.profile}</Text>
            </View>
          ) : null}

          {status === 'recommending' && visiblePets.length === 0 ? (
            <Text style={styles.matchWaitingText}>正在为您匹配伙伴…</Text>
          ) : null}

          {visiblePets.length > 0 ? (
            <>
              <Text style={quizStyles.resultSubTitle}>
                我们为你匹配到了最适合一起生活的小伙伴
              </Text>
              <Text style={quizStyles.resultSwipeHint}>见下方，右滑查看更多……</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.matchListContent}
                style={styles.matchList}>
                {visiblePets.map(({ pet, confidence }) => (
                  <PetCard key={pet.id} pet={pet} confidence={confidence} />
                ))}
              </ScrollView>
            </>
          ) : null}

          <Pressable
            style={({ pressed }) => [
              quizStyles.resultRestartButton,
              pressed && styles.sendButtonPressed,
            ]}
            onPress={() => {
              hasStartedRef.current = false;
              setHasStarted(false);
            }}>
            <Text style={quizStyles.resultRestartText}>重新测试</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // phase === 'chat'

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.background}>
        <View style={[styles.blob, styles.blobLeft]} />
        <View style={[styles.blob, styles.blobRight]} />
        <View style={[styles.blob, styles.blobBottom]} />
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.overline}>Pawzy</Text>
            <Pressable
              onPress={handleChangeAttitudePrompt}
              disabled={isBusy}
              style={({ pressed }) => [
                styles.changeAttitudeButton,
                isBusy && styles.sendButtonDisabled,
                pressed && styles.sendButtonPressed,
              ]}>
              <Text style={styles.changeAttitudeText}>更换态度</Text>
            </Pressable>
          </View>
          <Text style={styles.title}>和你聊聊</Text>
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.chatList}
          keyboardShouldPersistTaps="handled">
          {messages.map((message) => (
            <ChatBubble key={message.id} role={message.role} text={message.content} />
          ))}

          {isBusy ? <ChatBubble role="ai" text={waitingText} /> : null}
        </ScrollView>

        {!evaluation ? (
          <View style={styles.inputDock}>
            <View style={styles.inputRow}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="输入你的回答"
                placeholderTextColor="#A1A1A1"
                style={styles.input}
                returnKeyType="send"
                onSubmitEditing={handleSend}
                editable={!isInputLocked}
              />
              <Pressable
                onPressIn={handleVoicePressIn}
                onPressOut={handleVoicePressOut}
                disabled={isInputLocked || evaluation !== null}
                style={({ pressed }) => [
                  styles.voiceButton,
                  isRecording && styles.voiceButtonRecording,
                  (isInputLocked || evaluation !== null) && styles.voiceButtonDisabled,
                  pressed && !(isInputLocked || evaluation !== null) && styles.sendButtonPressed,
                ]}>
                <Text style={styles.voiceButtonText}>
                  {isRecording ? '录音中' : isTranscribing ? '识别中' : '语音'}
                </Text>
              </Pressable>
              
              <Pressable
                onPress={handleSend}
                disabled={!canSend}
                style={({ pressed }) => [
                  styles.sendButton,
                  !canSend && styles.sendButtonDisabled,
                  pressed && canSend && styles.sendButtonPressed,
                ]}>
                <SendIcon width={Theme.sizes.s18} height={Theme.sizes.s18} />
              </Pressable>
            </View>
            <Text style={styles.helperText}>
              {isTestingSample
                ? '正在请求根目录 test.m4a...'
                : isRecording
                  ? '松开后将语音转成文字'
                  : isTranscribing
                    ? '正在识别语音...'
                    : errorMessage ?? ''}
            </Text>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ChatBubble({ role, text }: { role: ChatRole; text: string }) {
  const isUser = role === 'user';
  const isDebug = role === 'debug';

  return (
    <View
      style={[
        styles.messageRow,
        isUser ? styles.messageRowUser : styles.messageRowAi,
        isDebug && styles.messageRowDebug,
      ]}>
      {!isUser && !isDebug ? (
        <View style={styles.avatar}>
          <Image
            source={require('@/assets/images/Agent.png')}
            style={styles.avatarImage}
            resizeMode="contain"
            accessibilityLabel="Pawzy"
          />
        </View>
      ) : null}
      <View
        style={[
          styles.bubble,
          isUser && styles.userBubble,
          isDebug && styles.debugBubble,
          !isUser && !isDebug && styles.aiBubble,
        ]}>
        <Text
          style={[
            styles.messageText,
            isUser && styles.userText,
            isDebug && styles.debugText,
            !isUser && !isDebug && styles.aiText,
          ]}>
          {text}
        </Text>
      </View>
    </View>
  );
}

/** Small decorative paw shape used as ambient ornaments. */
function DecoPaw({
  size = 9.71,
  color = '#F4C17F',
  rotation = 0,
  style,
}: {
  size?: number;
  color?: string;
  rotation?: number;
  style?: object;
}) {
  const s = size;
  const small = s * 0.5;
  return (
    <View
      style={[
        { width: s * 1.4, height: s * 1.6, transform: [{ rotate: `${rotation}deg` }] },
        style,
      ]}>
      {/* pad */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: (s * 1.4 - s) / 2,
          width: s,
          height: s,
          borderRadius: s / 2,
          backgroundColor: color,
        }}
      />
      {/* toe 1 */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: small,
          height: small,
          borderRadius: small / 2,
          backgroundColor: color,
        }}
      />
      {/* toe 2 */}
      <View
        style={{
          position: 'absolute',
          top: -small * 0.35,
          left: (s * 1.4 - small) / 2,
          width: small,
          height: small,
          borderRadius: small / 2,
          backgroundColor: color,
        }}
      />
      {/* toe 3 */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: small,
          height: small,
          borderRadius: small / 2,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

function AgentStartScreen({ onStart }: { onStart: () => void }) {
  const floatAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [floatAnim]);

  return (
    <View style={startStyles.safeArea}>
      {/* Background glows */}
      <View style={startStyles.background}>
        <View style={[startStyles.glow, startStyles.glowTopLeft]} />
        <View style={[startStyles.glow, startStyles.glowRight]} />
        <View style={[startStyles.glow, startStyles.glowBottomRight]} />
      </View>

      {/* Top gradient overlay */}
      <LinearGradient
        colors={['#FEFFD4', 'rgba(255, 254, 249, 0)']}
        style={startStyles.topGradient}
      />

      {/* Decorative paw prints */}
      <DecoPaw size={10} rotation={-18} style={{ position: 'absolute', left: 68, top: '60%' }} />
      <DecoPaw size={10} rotation={23} style={{ position: 'absolute', right: 50, top: '68%' }} />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={startStyles.content} bounces={false}>
          {/* Brand header */}
          <View style={startStyles.brandRow}>
            <Text style={startStyles.brandText}>Pawzzle</Text>
            <Text style={startStyles.brandSubText}> 寻爪</Text>
          </View>

          {/* Hero section */}
          <View style={startStyles.hero}>
            {/* Mascot */}
            <View style={startStyles.mascotWrap}>
              <View style={startStyles.mascotGlow} />
              <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
                <AgentAvatarSvg
                  width={150}
                  height={185}
                  style={startStyles.agentHero}
                  accessibilityLabel="Pawzy"
                />
              </Animated.View>
            </View>

            {/* Greeting */}
            <Text style={startStyles.headline}>你好！我是Pawzy</Text>
            <Text style={startStyles.subhead}>准备好寻找你的伙伴了吗</Text>

            {/* CTA button */}
            <Pressable
              onPress={onStart}
              style={({ pressed }) => [
                startStyles.ctaButton,
                pressed && startStyles.ctaButtonPressed,
              ]}>
              <Text style={startStyles.ctaText}>开始测试</Text>
            </Pressable>

            {/* Tip */}
            <Text style={startStyles.tipText}>随时开始，只需几分钟哦</Text>
          </View>

          {/* Privacy note */}
          <Text style={startStyles.privacyText}>对话仅用于匹配，我们保护你的隐私~</Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function AttitudePromptSetupScreen({
  value,
  onChange,
  onApply,
  onBack,
  canApply,
}: {
  value: string;
  onChange: (value: string) => void;
  onApply: () => void;
  onBack: () => void;
  canApply: boolean;
}) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.attitudeCard}>
          <Text style={styles.attitudeTitle}>请输入态度 prompt</Text>
          <Text style={styles.attitudeDesc}>
            会与基础身份/任务提示词拼接后，再发起对话请求。
          </Text>
          <TextInput
            value={value}
            onChangeText={onChange}
            placeholder="例如：像朋友聊天，幽默一点，但问题要聚焦领养画像"
            placeholderTextColor="#A1A1A1"
            multiline
            textAlignVertical="top"
            style={styles.attitudeInput}
          />
          <Pressable
            onPress={onApply}
            disabled={!canApply}
            style={({ pressed }) => [
              styles.attitudeApplyButton,
              !canApply && styles.sendButtonDisabled,
              pressed && canApply && styles.sendButtonPressed,
            ]}>
            <Text style={styles.attitudeApplyText}>应用并开始对话</Text>
          </Pressable>
          <Pressable onPress={onBack} style={styles.attitudeBackButton}>
            <Text style={styles.attitudeBackText}>返回</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function QuizScreen({
  onComplete,
  onBack,
}: {
  onComplete: (answers: Record<number, string>) => void;
  onBack: () => void;
}) {
  const [step, setStep] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<number, string>>({});
  const current = QUIZ_QUESTIONS[step];
  const isLast = step === QUIZ_QUESTIONS.length - 1;
  const progress = (step + 1) / QUIZ_QUESTIONS.length;

  const handleSelect = (optionText: string) => {
    const next = { ...answers, [current.id]: optionText };
    setAnswers(next);
    if (isLast) {
      onComplete(next);
    } else {
      setStep(step + 1);
    }
  };

  return (
    <View style={quizStyles.safeArea}>
      <View style={quizStyles.bgGlow} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={quizStyles.topBar}>
          <Pressable onPress={onBack} hitSlop={12}>
            <Text style={quizStyles.backText}>← 返回</Text>
          </Pressable>
          <Text style={quizStyles.stepText}>{step + 1} / {QUIZ_QUESTIONS.length}</Text>
        </View>

        <View style={quizStyles.progressBarTrack}>
          <View style={[quizStyles.progressBarFill, { width: `${progress * 100}%` }]} />
        </View>

        <ScrollView contentContainerStyle={quizStyles.content} bounces={false}>
          <Text style={quizStyles.questionTitle}>{current.title}</Text>

          {current.options.map((opt) => {
            const selected = answers[current.id] === opt.text;
            return (
              <Pressable
                key={opt.label}
                onPress={() => handleSelect(opt.text)}
                style={({ pressed }) => [
                  quizStyles.optionCard,
                  selected && quizStyles.optionCardSelected,
                  pressed && { transform: [{ scale: 0.97 }] },
                ]}>
                <View style={[quizStyles.optionLabel, selected && quizStyles.optionLabelSelected]}>
                  <Text
                    style={[
                      quizStyles.optionLabelText,
                      selected && quizStyles.optionLabelTextSelected,
                    ]}>
                    {opt.label}
                  </Text>
                </View>
                <Text style={[quizStyles.optionText, selected && quizStyles.optionTextSelected]}>
                  {opt.text}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function SurveyScreen({
  onComplete,
  onSkip,
  onBack,
}: {
  onComplete: (data: Record<string, string>) => void;
  onSkip: () => void;
  onBack: () => void;
}) {
  const [formData, setFormData] = React.useState<Record<string, string>>({});

  const updateField = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const hasAnyData = SURVEY_FIELDS.some((f) => formData[f.key]?.trim());

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={quizStyles.topBar}>
          <Pressable onPress={onBack} hitSlop={12}>
            <Text style={quizStyles.backText}>← 返回</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={quizStyles.surveyContent}
          keyboardShouldPersistTaps="handled"
          bounces={false}>
          <Text style={quizStyles.surveyTitle}>填写以下问卷</Text>
          <Text style={quizStyles.surveyDesc}>
            帮助我们更准确地为你匹配，所有信息仅用于匹配~
          </Text>

          {SURVEY_FIELDS.map((field) => (
            <View key={field.key} style={quizStyles.surveyFieldWrap}>
              <Text style={quizStyles.surveyLabel}>{field.label}</Text>
              <TextInput
                value={formData[field.key] ?? ''}
                onChangeText={(v) => updateField(field.key, v)}
                placeholder={field.placeholder}
                placeholderTextColor="#A1A1A1"
                style={quizStyles.surveyInput}
              />
            </View>
          ))}

          <Pressable
            onPress={() => onComplete(formData)}
            disabled={!hasAnyData}
            style={({ pressed }) => [
              quizStyles.surveySubmitButton,
              !hasAnyData && styles.sendButtonDisabled,
              pressed && hasAnyData && styles.sendButtonPressed,
            ]}>
            <Text style={quizStyles.surveySubmitText}>提交并查看结果</Text>
          </Pressable>

          <Pressable onPress={onSkip} style={quizStyles.surveySkipWrap}>
            <Text style={quizStyles.surveySkipText}>此处可跳过</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

async function requestEvaluation(messages: AgentMessage[], attitudePrompt: string) {
  return postJson<EvaluationResponse>('/api/agent/evaluate', {
    messages,
    attitudePrompt,
  });
}

async function requestRecommendation(
  summary: EvaluationSummary,
  messages: AgentMessage[],
  attitudePrompt: string
) {
  const payload = {
    messages,
    evaluation: summary,
    attitudePrompt,
  };
  let lastError: unknown;
  for (let attempt = 0; attempt <= RECOMMEND_MAX_RETRIES; attempt += 1) {
    try {
      return await postJson<AgentDecisionResponse>('/api/agent/recommend', payload);
    } catch (error) {
      lastError = error;
      if (attempt === RECOMMEND_MAX_RETRIES) {
        break;
      }
      const delay = Math.min(
        RECOMMEND_RETRY_BASE_DELAY_MS * (2 ** attempt),
        RECOMMEND_RETRY_MAX_DELAY_MS
      );
      await wait(delay);
    }
  }
  throw (lastError instanceof Error ? lastError : new Error('请求失败'));
}

async function buildVoiceFormData(uri: string) {
  const formData = new FormData();
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error('无法读取录音文件');
    }
    const sourceBlob = await response.blob();
    const wavBlob = await transcodeBlobToWav16k(sourceBlob);
    if (typeof File !== 'undefined') {
      formData.append('file', new File([wavBlob], 'voice.wav', { type: 'audio/wav' }));
    } else {
      formData.append('file', wavBlob, 'voice.wav');
    }
    return formData;
  }

  formData.append(
    'file',
    {
      uri,
      type: 'audio/m4a',
      name: 'voice.m4a',
    } as unknown as Blob
  );
  return formData;
}

async function transcodeBlobToWav16k(blob: Blob) {
  const contextClass = (globalThis as { AudioContext?: new () => AudioContext; webkitAudioContext?: new () => AudioContext })
    .AudioContext
    ?? (globalThis as { AudioContext?: new () => AudioContext; webkitAudioContext?: new () => AudioContext }).webkitAudioContext;
  if (!contextClass) {
    throw new Error('当前浏览器不支持语音解码');
  }

  const context = new contextClass();
  try {
    const source = await blob.arrayBuffer();
    const decoded = await context.decodeAudioData(source.slice(0));
    const mono = mixToMono(decoded);
    const resampled = resampleLinear(mono, decoded.sampleRate, 16000);
    const wavBuffer = encodeWav16Bit(resampled, 16000);
    return new Blob([wavBuffer], { type: 'audio/wav' });
  } finally {
    await context.close();
  }
}

function mixToMono(audioBuffer: AudioBuffer) {
  const channels = audioBuffer.numberOfChannels;
  if (channels <= 1) {
    return new Float32Array(audioBuffer.getChannelData(0));
  }
  const length = audioBuffer.length;
  const mixed = new Float32Array(length);
  for (let channel = 0; channel < channels; channel += 1) {
    const data = audioBuffer.getChannelData(channel);
    for (let index = 0; index < length; index += 1) {
      mixed[index] += data[index] / channels;
    }
  }
  return mixed;
}

function resampleLinear(input: Float32Array, sourceRate: number, targetRate: number) {
  if (sourceRate === targetRate) {
    return input;
  }
  const ratio = sourceRate / targetRate;
  const outputLength = Math.max(1, Math.round(input.length / ratio));
  const output = new Float32Array(outputLength);
  for (let index = 0; index < outputLength; index += 1) {
    const position = index * ratio;
    const left = Math.floor(position);
    const right = Math.min(left + 1, input.length - 1);
    const weight = position - left;
    output[index] = input[left] * (1 - weight) + input[right] * weight;
  }
  return output;
}

function encodeWav16Bit(samples: Float32Array, sampleRate: number) {
  const bytesPerSample = 2;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let index = 0; index < samples.length; index += 1) {
    const value = Math.max(-1, Math.min(1, samples[index]));
    const int16 = value < 0 ? value * 0x8000 : value * 0x7fff;
    view.setInt16(offset, int16, true);
    offset += bytesPerSample;
  }
  return buffer;
}

function writeAscii(view: DataView, offset: number, text: string) {
  for (let index = 0; index < text.length; index += 1) {
    view.setUint8(offset + index, text.charCodeAt(index));
  }
}

async function getJson<T = unknown>(path: string) {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(ensureChinese(response.statusText || '', '请求失败'));
  }
  return (await response.json()) as T;
}

async function postJson<T = unknown>(path: string, payload: Record<string, unknown>) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
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

function wait(durationMs: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, durationMs);
  });
}

function buildEvaluationSummary(data: EvaluationResponse): EvaluationSummary {
  return {
    profile: data.profile?.trim() || '暂无评估总结。',
  };
}

function normalizeQuestions(data?: EvaluationResponse | null) {
  if (!data) {
    return [];
  }
  const fromList = Array.isArray(data.nextQuestions) ? data.nextQuestions : [];
  const raw = fromList.length ? fromList : data.nextQuestion ? [data.nextQuestion] : [];
  const result: string[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    const trimmed = typeof item === 'string' ? item.trim() : '';
    if (!trimmed || seen.has(trimmed)) {
      continue;
    }
    seen.add(trimmed);
    result.push(trimmed);
  }
  return result;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: Theme.layout.full,
    backgroundColor: Theme.colors.backgroundWarmAlt,
  },
  container: {
    flex: Theme.layout.full,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  blob: {
    position: 'absolute',
    width: Theme.sizes.s220,
    height: Theme.sizes.s220,
    borderRadius: Theme.radius.r110,
    opacity: Theme.opacity.o6,
  },
  blobLeft: {
    top: -Theme.sizes.s70,
    left: -Theme.sizes.s40,
    backgroundColor: Theme.colors.decorativePeachAlt,
  },
  blobRight: {
    top: Theme.spacing.s20,
    right: -Theme.sizes.s50,
    backgroundColor: Theme.colors.decorativeMint,
  },
  blobBottom: {
    bottom: -Theme.sizes.s70,
    left: Theme.percent.p35,
    backgroundColor: Theme.colors.decorativeSkyAlt,
  },
  header: {
    paddingHorizontal: Theme.spacing.s20,
    paddingTop: Theme.spacing.s12,
    paddingBottom: Theme.spacing.s6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  overline: {
    fontSize: Theme.typography.size.s11,
    letterSpacing: Theme.typography.letterSpacing.s3,
    textTransform: 'uppercase',
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.s6,
  },
  title: {
    fontSize: Theme.typography.size.s22,
    fontFamily: Theme.fonts.semiBold,
    color: Theme.colors.text,
  },
  changeAttitudeButton: {
    backgroundColor: '#FFF6EA',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: 'rgba(237, 132, 63, 0.35)',
  },
  changeAttitudeText: {
    fontSize: 11,
    color: '#875B47',
    fontFamily: Theme.fonts.regular,
  },
  chatList: {
    paddingHorizontal: Theme.spacing.s20,
    paddingTop: Theme.spacing.s8,
    paddingBottom: Theme.sizes.s140,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowAi: {
    justifyContent: 'flex-start',
  },
  messageRowDebug: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 52,
    height: 62,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginRight: 10,
  },
  avatarImage: {
    width: 52,
    height: 62,
  },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 21,
    paddingVertical: 17,
  },
  userBubble: {
    backgroundColor: '#F4C17F',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 25,
    borderBottomLeftRadius: 25,
  },
  aiBubble: {
    backgroundColor: '#FDF4E4',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    borderBottomRightRadius: 25,
    borderBottomLeftRadius: 0,
  },
  debugBubble: {
    backgroundColor: Theme.colors.surfaceNeutral,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderNeutral,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    borderBottomRightRadius: 25,
    borderBottomLeftRadius: 0,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 23,
    fontFamily: Theme.fonts.regular,
  },
  userText: {
    color: '#FFFFFF',
  },
  aiText: {
    color: '#875B47',
  },
  debugText: {
    color: Theme.colors.textMuted,
    fontSize: Theme.typography.size.s12,
    lineHeight: Theme.typography.lineHeight.s16,
  },
  matchSection: {
    marginTop: 12,
  },
  matchWaitingText: {
    textAlign: 'center',
    color: 'rgba(237, 132, 63, 0.40)',
    fontSize: 12,
    fontFamily: Theme.fonts.regular,
    lineHeight: 20,
    marginBottom: 16,
  },
  matchList: {
    overflow: 'visible',
  },
  matchListContent: {
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 4,
    gap: 24,
  },
  inputDock: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingLeft: 22,
    paddingRight: 8,
    height: 56,
    shadowColor: 'rgba(244, 193, 127, 0.25)',
    shadowOffset: { width: 9, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 6,
  },
  input: {
    flex: 1,
    fontSize: 12,
    color: Theme.colors.text,
    fontFamily: Theme.fonts.regular,
    lineHeight: 20,
    letterSpacing: 0.72,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  voiceButton: {
    minWidth: 54,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FDF4E4',
    borderWidth: Theme.borderWidth.hairline,
    borderColor: 'rgba(237, 132, 63, 0.35)',
    marginLeft: 8,
    paddingHorizontal: 10,
  },
  voiceButtonRecording: {
    backgroundColor: '#F4C17F',
    borderColor: '#F4C17F',
  },
  voiceButtonDisabled: {
    opacity: 0.4,
  },
  voiceButtonText: {
    fontSize: 11,
    color: '#875B47',
    fontFamily: Theme.fonts.regular,
  },
  testButton: {
    minWidth: 66,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF6EA',
    borderWidth: Theme.borderWidth.hairline,
    borderColor: 'rgba(237, 132, 63, 0.35)',
    marginLeft: 8,
    paddingHorizontal: 10,
  },
  testButtonText: {
    fontSize: 11,
    color: '#875B47',
    fontFamily: Theme.fonts.regular,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendButtonPressed: {
    transform: [{ scale: 0.95 }],
  },
  helperText: {
    marginTop: 8,
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },
  attitudeCard: {
    marginHorizontal: Theme.spacing.s20,
    marginTop: Theme.spacing.s40,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 18,
    shadowColor: 'rgba(244, 193, 127, 0.25)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 5,
  },
  attitudeTitle: {
    fontSize: Theme.typography.size.s18,
    color: Theme.colors.text,
    fontFamily: Theme.fonts.semiBold,
  },
  attitudeDesc: {
    marginTop: 8,
    fontSize: 12,
    color: Theme.colors.textSecondary,
    lineHeight: 18,
  },
  attitudeInput: {
    marginTop: 14,
    minHeight: 130,
    borderRadius: 12,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: 'rgba(237, 132, 63, 0.35)',
    backgroundColor: '#FFFEF9',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: Theme.colors.text,
    fontFamily: Theme.fonts.regular,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  attitudeApplyButton: {
    marginTop: 14,
    borderRadius: 14,
    height: 44,
    backgroundColor: '#F4C17F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attitudeApplyText: {
    color: '#FFFFFF',
    fontFamily: Theme.fonts.semiBold,
    fontSize: 14,
  },
  attitudeBackButton: {
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
  },
  attitudeBackText: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.fonts.regular,
  },
});

const startStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFEF9',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 315,
  },
  glow: {
    position: 'absolute',
    borderRadius: 112,
    opacity: 0.6,
  },
  glowTopLeft: {
    top: -23,
    left: -34,
    width: 142,
    height: 137,
    backgroundColor: 'rgba(244, 193, 127, 0.27)',
  },
  glowRight: {
    top: 424,
    right: -38,
    width: 224,
    height: 224,
    backgroundColor: 'rgba(244, 193, 127, 0.08)',
  },
  glowBottomRight: {
    top: 478,
    left: 203,
    width: 224,
    height: 224,
    backgroundColor: 'rgba(254, 255, 233, 0.31)',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 80,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  brandText: {
    fontSize: 18,
    fontFamily: Theme.fonts.brandPawzzle,
    color: '#743800',
    letterSpacing: 1.08,
  },
  brandSubText: {
    fontSize: 18,
    fontFamily: Theme.fonts.brandXunzhao,
    color: '#743800',
    letterSpacing: 1.08,
  },
  hero: {
    alignItems: 'center',
    gap: 12,
  },
  mascotWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  mascotGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(244, 193, 127, 0.08)',
  },
  agentHero: {
    width: 150,
    height: 185,
  },
  headline: {
    fontSize: 18,
    fontFamily: Theme.fonts.regular,
    color: '#ED843F',
    letterSpacing: 1.08,
    lineHeight: 26,
    textAlign: 'center',
  },
  subhead: {
    fontSize: 15,
    fontFamily: Theme.fonts.regular,
    color: 'rgba(237, 132, 63, 0.80)',
    letterSpacing: 0.9,
    lineHeight: 23,
    textAlign: 'center',
  },
  ctaButton: {
    width: 180,
    height: 48,
    borderRadius: 24, // Half of height (48 / 2) to make it fully rounded
    backgroundColor: '#F4C17F',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#F4C17F',
    shadowOffset: { width: 3, height: 4 },
    shadowOpacity: 0.76,
    shadowRadius: 10.6,
    elevation: 6,
  },
  ctaButtonPressed: {
    transform: [{ scale: 0.97 }],
  },
  ctaText: {
    fontSize: 18,
    fontFamily: Theme.fonts.regular,
    color: '#FEFFD4',
    letterSpacing: 1.08,
    lineHeight: 26,
    textAlign: 'center',
  },
  tipText: {
    fontSize: 12,
    fontFamily: Theme.fonts.regular,
    color: 'rgba(237, 132, 63, 0.80)',
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 4,
  },
  privacyText: {
    fontSize: 12,
    fontFamily: Theme.fonts.regular,
    color: 'rgba(237, 132, 63, 0.40)',
    lineHeight: 20,
    textAlign: 'center',
  },
});

const quizStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFEF9',
  },
  bgGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(244, 193, 127, 0.05)',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  backText: {
    fontSize: 14,
    color: '#875B47',
    fontFamily: Theme.fonts.regular,
  },
  stepText: {
    fontSize: 13,
    color: 'rgba(237, 132, 63, 0.6)',
    fontFamily: Theme.fonts.regular,
  },
  progressBarTrack: {
    marginHorizontal: 20,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(244, 193, 127, 0.2)',
    marginTop: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#F4C17F',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 60,
  },
  questionTitle: {
    fontSize: 20,
    fontFamily: Theme.fonts.semiBold,
    color: '#5C3B2E',
    lineHeight: 30,
    marginBottom: 28,
    textAlign: 'center',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(244, 193, 127, 0.25)',
    shadowColor: 'rgba(244, 193, 127, 0.15)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  optionCardSelected: {
    backgroundColor: '#FFF6EA',
    borderColor: '#F4C17F',
  },
  optionLabel: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(244, 193, 127, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  optionLabelSelected: {
    backgroundColor: '#F4C17F',
  },
  optionLabelText: {
    fontSize: 14,
    fontFamily: Theme.fonts.semiBold,
    color: '#875B47',
  },
  optionLabelTextSelected: {
    color: '#FFFFFF',
  },
  optionText: {
    fontSize: 15,
    fontFamily: Theme.fonts.regular,
    color: '#5C3B2E',
    lineHeight: 22,
    flex: 1,
  },
  optionTextSelected: {
    color: '#5C3B2E',
    fontFamily: Theme.fonts.semiBold,
  },
  surveyContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 60,
  },
  surveyTitle: {
    fontSize: 20,
    fontFamily: Theme.fonts.semiBold,
    color: '#5C3B2E',
    lineHeight: 30,
    marginBottom: 6,
  },
  surveyDesc: {
    fontSize: 13,
    color: 'rgba(237, 132, 63, 0.7)',
    fontFamily: Theme.fonts.regular,
    lineHeight: 20,
    marginBottom: 20,
  },
  surveyFieldWrap: {
    marginBottom: 14,
  },
  surveyLabel: {
    fontSize: 13,
    fontFamily: Theme.fonts.semiBold,
    color: '#875B47',
    marginBottom: 6,
  },
  surveyInput: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(244, 193, 127, 0.3)',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#5C3B2E',
    fontFamily: Theme.fonts.regular,
    ...Platform.select({
      web: {
        outlineStyle: 'none' as const,
      },
    }),
  },
  surveySubmitButton: {
    marginTop: 20,
    borderRadius: 14,
    height: 48,
    backgroundColor: '#F4C17F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  surveySubmitText: {
    color: '#FFFFFF',
    fontFamily: Theme.fonts.semiBold,
    fontSize: 15,
  },
  surveySkipWrap: {
    marginTop: 14,
    alignItems: 'center',
    paddingVertical: 8,
  },
  surveySkipText: {
    fontSize: 12,
    color: 'rgba(150, 150, 150, 0.8)',
    fontFamily: Theme.fonts.regular,
  },
  resultContent: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 60,
    alignItems: 'center',
  },
  resultStarEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  resultTitle: {
    fontSize: 20,
    fontFamily: Theme.fonts.semiBold,
    color: '#5C3B2E',
    lineHeight: 30,
    textAlign: 'center',
    marginBottom: 16,
  },
  resultProfileCard: {
    backgroundColor: '#FFF6EA',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(244, 193, 127, 0.3)',
    marginBottom: 20,
    width: '100%',
  },
  resultProfileText: {
    fontSize: 14,
    fontFamily: Theme.fonts.regular,
    color: '#875B47',
    lineHeight: 22,
  },
  resultSubTitle: {
    fontSize: 15,
    fontFamily: Theme.fonts.regular,
    color: '#ED843F',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 4,
  },
  resultSwipeHint: {
    fontSize: 12,
    color: 'rgba(237, 132, 63, 0.5)',
    fontFamily: Theme.fonts.regular,
    marginBottom: 12,
    textAlign: 'center',
  },
  resultRestartButton: {
    marginTop: 32,
    width: 160,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F4C17F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultRestartText: {
    color: '#FFFFFF',
    fontFamily: Theme.fonts.semiBold,
    fontSize: 14,
  },
});
