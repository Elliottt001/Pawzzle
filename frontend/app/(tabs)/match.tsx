import * as React from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';

type ChatRole = 'user' | 'ai';

type ChatMessageData = {
  id: string;
  role: ChatRole;
  content: string;
  isStreaming?: boolean;
  isTyping?: boolean;
};

const initialMessages: ChatMessageData[] = [
  {
    id: 'm1',
    role: 'user',
    content: 'I work from home most days, but I hike every weekend and love early-morning walks.',
  },
  {
    id: 'm2',
    role: 'ai',
    content:
      'That sounds like a balanced routine. I will look for a dog who can relax during the week and keep up on trails.',
  },
  {
    id: 'm3',
    role: 'user',
    content:
      'I live in a small apartment and already have a mellow cat, so I need a friendly companion.',
  },
  {
    id: 'm4',
    role: 'ai',
    content:
      'Great detail. I will focus on smaller or medium breeds with calm indoor energy and good social skills.',
  },
];

const mockReplies = [
  'Thanks for sharing that. I can prioritize adaptable pups that enjoy weekend adventures without needing constant outdoor time.',
  'Got it. I will keep the matches apartment-friendly and highlight dogs known for gentle introductions to cats.',
  'Perfect. I will narrow the shortlist to friendly, trainable companions that fit your daily rhythm.',
];

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export default function MatchScreen() {
  const [messages, setMessages] = React.useState<ChatMessageData[]>(initialMessages);
  const [input, setInput] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);
  const scrollRef = React.useRef<ScrollView | null>(null);
  const typingTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamingIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const replyIndexRef = React.useRef(0);

  const isStreaming = messages.some((message) => message.isStreaming);
  const isBusy = isTyping || isStreaming;
  const canSend = input.trim().length > 0 && !isBusy;

  const startStreaming = React.useCallback((messageId: string, fullText: string) => {
    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current);
    }

    let index = 0;
    streamingIntervalRef.current = setInterval(() => {
      index += 1;
      setMessages((prev) =>
        prev.map((message) =>
          message.id === messageId
            ? {
                ...message,
                content: fullText.slice(0, index),
                isStreaming: index < fullText.length,
              }
            : message
        )
      );

      if (index >= fullText.length && streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current);
        streamingIntervalRef.current = null;
      }
    }, 22);
  }, []);

  const handleSend = React.useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isBusy) {
      return;
    }

    const userMessage: ChatMessageData = {
      id: createId(),
      role: 'user',
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    const reply = mockReplies[replyIndexRef.current % mockReplies.length];
    replyIndexRef.current += 1;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      const aiId = createId();
      setMessages((prev) => [
        ...prev,
        {
          id: aiId,
          role: 'ai',
          content: '',
          isStreaming: true,
        },
      ]);
      startStreaming(aiId, reply);
    }, 650);
  }, [input, isBusy, startStreaming]);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 0);
    return () => clearTimeout(timeout);
  }, [messages, isTyping]);

  React.useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current);
      }
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.background}>
        <View style={[styles.blob, styles.blobTopLeft]} />
        <View style={[styles.blob, styles.blobTopRight]} />
        <View style={[styles.blob, styles.blobBottom]} />
      </View>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <View>
            <Text style={styles.overline}>AI Pet Agent</Text>
            <Text style={styles.title}>Pawzzle Match</Text>
          </View>
          <View style={styles.statusChip}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Online</Text>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {isTyping ? (
            <ChatMessage
              message={{
                id: 'typing',
                role: 'ai',
                content: '',
                isTyping: true,
              }}
            />
          ) : null}
        </ScrollView>

        <View style={styles.inputDock}>
          <View style={styles.inputRow}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Tell the agent about your home, schedule, and energy level..."
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
            <Pressable
              onPress={handleSend}
              disabled={!canSend}
              style={({ pressed }) => [
                styles.sendButton,
                !canSend && styles.sendButtonDisabled,
                pressed && canSend && styles.sendButtonPressed,
              ]}>
              <Feather name="send" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
          <Text style={styles.helperText}>Focus on your routine, space, and any pets you already have.</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ChatMessage({ message }: { message: ChatMessageData }) {
  const isUser = message.role === 'user';

  return (
    <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowAi]}>
      {!isUser ? (
        <View style={styles.avatar}>
          <FontAwesome5 name="paw" size={16} color="#15803D" />
        </View>
      ) : null}
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
        {message.isTyping ? (
          <TypingIndicator />
        ) : (
          <Text style={[styles.messageText, isUser ? styles.userText : styles.aiText]}>
            {message.content}
            {message.isStreaming ? <Text style={styles.cursor}>|</Text> : null}
          </Text>
        )}
      </View>
    </View>
  );
}

function TypingIndicator() {
  const dot1 = React.useRef(new Animated.Value(0)).current;
  const dot2 = React.useRef(new Animated.Value(0)).current;
  const dot3 = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const createLoop = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 250, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 250, useNativeDriver: true }),
          Animated.delay(400),
        ])
      );

    const loop1 = createLoop(dot1, 0);
    const loop2 = createLoop(dot2, 120);
    const loop3 = createLoop(dot3, 240);

    loop1.start();
    loop2.start();
    loop3.start();

    return () => {
      loop1.stop();
      loop2.stop();
      loop3.stop();
    };
  }, [dot1, dot2, dot3]);

  const dotStyle = (dot: Animated.Value) => ({
    transform: [
      {
        translateY: dot.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -4],
        }),
      },
    ],
    opacity: dot.interpolate({
      inputRange: [0, 1],
      outputRange: [0.4, 1],
    }),
  });

  return (
    <View style={styles.typingRow} accessibilityLabel="AI is typing">
      <Animated.View style={[styles.typingDot, dotStyle(dot1)]} />
      <Animated.View style={[styles.typingDot, dotStyle(dot2)]} />
      <Animated.View style={[styles.typingDot, dotStyle(dot3)]} />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FDF6EF',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  blob: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.6,
  },
  blobTopLeft: {
    backgroundColor: '#FBE8C7',
    top: -60,
    left: -30,
  },
  blobTopRight: {
    backgroundColor: '#DFF3E5',
    top: 30,
    right: -40,
  },
  blobBottom: {
    backgroundColor: '#D8EDF8',
    bottom: -50,
    left: '30%',
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  overline: {
    fontSize: 11,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: '#6B7280',
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#EFEAE3',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#6B7280',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 120,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowAi: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF8EF',
    borderWidth: 1,
    borderColor: '#D1EBDD',
    marginRight: 8,
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: '#157B57',
    borderTopRightRadius: 6,
  },
  aiBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: '#EEE6DC',
    borderTopLeftRadius: 6,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: '#F9FAFB',
  },
  aiText: {
    color: '#111827',
  },
  cursor: {
    color: '#10B981',
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9CA3AF',
    marginRight: 4,
  },
  inputDock: {
    borderTopWidth: 1,
    borderTopColor: '#EFEAE3',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#EEE6DC',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#111827',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#157B57',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    shadowColor: '#0F172A',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 3,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonPressed: {
    transform: [{ scale: 0.97 }],
  },
  helperText: {
    marginTop: 8,
    fontSize: 12,
    color: '#6B7280',
  },
});
