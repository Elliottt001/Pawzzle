import * as React from 'react';
import {
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
import { useRouter } from 'expo-router';
import { Theme } from '../../constants/theme';
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder';
import { API_BASE_URL } from '@/lib/apiBase';

const AI_RESPONSE_DELAY_MS = 600;
const VOICE_TRANSCRIBE_URL = `${API_BASE_URL}/api/voice/transcribe`;

const MOCK_PET = {
  name: '麻糬',
  breed: '英短',
  age: '2岁',
  distance: '3公里',
  housing: '适合公寓',
  reason: '基于距离与居住条件匹配',
};

type ChatMessage = {
  id: string;
  role: 'user' | 'ai';
  text: string;
  showCard?: boolean;
};

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export default function AgentChatScreen() {
  const router = useRouter();
  const scrollRef = React.useRef<ScrollView | null>(null);
  const typingTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      id: 'intro',
      role: 'ai',
      text: '请描述你的居住情况和日常作息，方便匹配。',
    },
  ]);
  const [input, setInput] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);
  const { startRecording, stopRecording, isRecording } = useVoiceRecorder();

  const canSend = input.trim().length > 0 && !isTyping;

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isTyping) {
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        id: createId(),
        role: 'user',
        text: trimmed,
      },
    ]);
    setInput('');
    setIsTyping(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          role: 'ai',
          text: MOCK_PET.reason,
          showCard: true,
        },
      ]);
    }, AI_RESPONSE_DELAY_MS);
  };

  const handleVoicePressIn = async () => {
    try {
      await startRecording();
    } catch (error) {
      console.warn('Failed to start recording', error);
    }
  };

  const handleVoicePressOut = async () => {
    try {
      const uri = await stopRecording();
      if (!uri) {
        return;
      }

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
        const errorMessage = payload?.error ?? 'Voice transcription failed';
        console.warn(errorMessage);
        return;
      }

      const text = typeof payload?.text === 'string' ? payload.text.trim() : '';
      if (text.length === 0) {
        return;
      }

      setInput(text);
    } catch (error) {
      console.warn('Voice transcription request failed', error);
    }
  };

  React.useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages, isTyping]);

  React.useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Text style={styles.title}>领养顾问</Text>
          <Text style={styles.subtitle}>描述你的需求，我们将给出推荐。</Text>
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.chatList}
          keyboardShouldPersistTaps="handled">
          {messages.map((message) => {
            const isUser = message.role === 'user';
            return (
              <View
                key={message.id}
                style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowAi]}>
                <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
                  <Text style={[styles.messageText, isUser ? styles.userText : styles.aiText]}>
                    {message.text}
                  </Text>
                </View>
                {message.showCard ? (
                  <PetRecommendationCard onPress={() => router.push('/pet/profile')} />
                ) : null}
              </View>
            );
          })}

          {isTyping ? <Text style={styles.typingText}>分析中...</Text> : null}
        </ScrollView>

        <View style={styles.inputDock}>
          <View style={styles.inputRow}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="输入你的需求..."
              placeholderTextColor={Theme.colors.placeholder}
              style={styles.input}
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
            <Pressable
              onPressIn={handleVoicePressIn}
              onPressOut={handleVoicePressOut}
              style={({ pressed }) => [
                styles.micButton,
                isRecording && styles.micButtonRecording,
                pressed && styles.micButtonPressed,
              ]}>
              <Text
                style={[
                  styles.micButtonText,
                  isRecording && styles.micButtonTextRecording,
                ]}>
                Mic
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
              <Text style={styles.sendButtonText}>发送</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function PetRecommendationCard({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <Text style={styles.cardTitle}>{MOCK_PET.name}</Text>
      <Text style={styles.cardMeta}>
        {MOCK_PET.breed} - {MOCK_PET.age}
      </Text>
      <View style={styles.cardDetailRow}>
        <Text style={styles.cardDetailLabel}>距离</Text>
        <Text style={styles.cardDetailValue}>{MOCK_PET.distance}</Text>
      </View>
      <View style={styles.cardDetailRow}>
        <Text style={styles.cardDetailLabel}>居住情况</Text>
        <Text style={styles.cardDetailValue}>{MOCK_PET.housing}</Text>
      </View>
      <View style={styles.cardTag}>
        <Text style={styles.cardTagText}>{MOCK_PET.reason}</Text>
      </View>
    </Pressable>
  );
}

async function buildVoiceFormData(uri: string) {
  const formData = new FormData();
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error('Failed to read recording');
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
    throw new Error('AudioContext is not available');
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

const styles = StyleSheet.create({
  container: {
    flex: Theme.layout.full,
    backgroundColor: Theme.colors.background,
  },
  flex: {
    flex: Theme.layout.full,
  },
  header: {
    paddingHorizontal: Theme.spacing.l,
    paddingTop: Theme.spacing.m,
    paddingBottom: Theme.spacing.s,
  },
  title: {
    color: Theme.colors.text,
    fontSize: Theme.typography.size.s22,
    fontFamily: Theme.fonts.semiBold,
    marginBottom: Theme.spacing.s,
  },
  subtitle: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.size.s14,
  },
  chatList: {
    paddingHorizontal: Theme.spacing.l,
    paddingTop: Theme.spacing.s,
    paddingBottom: Theme.spacing.l,
    gap: Theme.spacing.m,
  },
  messageRow: {
    gap: Theme.spacing.s,
  },
  messageRowUser: {
    alignItems: 'flex-end',
  },
  messageRowAi: {
    alignItems: 'flex-start',
  },
  bubble: {
    paddingHorizontal: Theme.spacing.m,
    paddingVertical: Theme.spacing.s,
    borderRadius: Theme.layout.radius,
    borderWidth: Theme.borderWidth.hairline,
    maxWidth: Theme.percent.p80,
  },
  userBubble: {
    backgroundColor: Theme.colors.successDeep,
    borderColor: Theme.colors.successDeep,
  },
  aiBubble: {
    backgroundColor: Theme.colors.cardTranslucentSoft,
    borderColor: Theme.colors.borderWarm,
  },
  messageText: {
    fontSize: Theme.typography.size.s14,
  },
  userText: {
    color: Theme.colors.textInverse,
  },
  aiText: {
    color: Theme.colors.text,
  },
  typingText: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.size.s12,
  },
  card: {
    width: Theme.percent.p80,
    backgroundColor: Theme.colors.cardTranslucentSoft,
    borderRadius: Theme.layout.radius,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarm,
    padding: Theme.spacing.m,
    gap: Theme.spacing.s,
  },
  cardPressed: {
    transform: [{ scale: Theme.scale.pressedSoft }],
  },
  cardTitle: {
    color: Theme.colors.text,
    fontSize: Theme.typography.size.s18,
    fontFamily: Theme.fonts.semiBold,
  },
  cardMeta: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.size.s13,
  },
  cardDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardDetailLabel: {
    color: Theme.colors.textSubtle,
    fontSize: Theme.typography.size.s12,
  },
  cardDetailValue: {
    color: Theme.colors.text,
    fontSize: Theme.typography.size.s12,
    fontFamily: Theme.fonts.semiBold,
  },
  cardTag: {
    alignSelf: 'flex-start',
    backgroundColor: Theme.colors.surfaceNeutral,
    borderRadius: Theme.layout.radius,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderNeutral,
    paddingVertical: Theme.spacing.s,
    paddingHorizontal: Theme.spacing.m,
  },
  cardTagText: {
    color: Theme.colors.text,
    fontSize: Theme.typography.size.s12,
    fontFamily: Theme.fonts.semiBold,
  },
  inputDock: {
    borderTopWidth: Theme.borderWidth.hairline,
    borderTopColor: Theme.colors.borderWarm,
    backgroundColor: Theme.colors.overlaySoft,
    paddingHorizontal: Theme.spacing.l,
    paddingVertical: Theme.spacing.m,
    gap: Theme.spacing.s,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.s,
  },
  input: {
    minHeight: Theme.sizes.s44,
    flex: Theme.layout.full,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarmAlt,
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.layout.radius,
    paddingHorizontal: Theme.spacing.m,
    paddingVertical: Theme.spacing.s,
    fontSize: Theme.typography.size.s14,
    color: Theme.colors.text,
  },
  micButton: {
    minWidth: Theme.sizes.s44,
    paddingHorizontal: Theme.spacing.s,
    paddingVertical: Theme.spacing.s,
    borderRadius: Theme.layout.radius,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarm,
    backgroundColor: Theme.colors.surfaceNeutral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButtonRecording: {
    backgroundColor: Theme.colors.danger,
    borderColor: Theme.colors.danger,
  },
  micButtonPressed: {
    transform: [{ scale: Theme.scale.pressedSoft }],
  },
  micButtonText: {
    color: Theme.colors.text,
    fontSize: Theme.typography.size.s14,
    fontFamily: Theme.fonts.semiBold,
  },
  micButtonTextRecording: {
    color: Theme.colors.textInverse,
  },
  sendButton: {
    backgroundColor: Theme.colors.successDeep,
    borderRadius: Theme.layout.radius,
    paddingVertical: Theme.spacing.s,
    alignItems: 'center',
  },
  sendButtonPressed: {
    transform: [{ scale: Theme.scale.pressedSoft }],
  },
  sendButtonDisabled: {
    opacity: Theme.opacity.o5,
  },
  sendButtonText: {
    color: Theme.colors.textInverse,
    fontSize: Theme.typography.size.s14,
    fontFamily: Theme.fonts.semiBold,
  },
});
