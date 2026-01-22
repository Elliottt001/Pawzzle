import * as React from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Theme } from '../../constants/theme';
import { streamAiResponse } from '../../services/aiStream';

type ChatMessage = {
  id: string;
  text: string;
  isUser: boolean;
};

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export default function ChatScreen() {
  const listRef = React.useRef<FlatList<ChatMessage> | null>(null);
  const streamRef = React.useRef<ReturnType<typeof streamAiResponse> | null>(null);
  const streamingTextRef = React.useRef('');

  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState('');
  const [streamingText, setStreamingText] = React.useState('');
  const [isStreaming, setIsStreaming] = React.useState(false);

  const canSend = input.trim().length > 0 && !isStreaming;

  const finalizeStream = React.useCallback(() => {
    const finalText = streamingTextRef.current;
    if (finalText) {
      setMessages((prev) => [...prev, { id: createId(), text: finalText, isUser: false }]);
    }
    streamingTextRef.current = '';
    setStreamingText('');
    setIsStreaming(false);
    if (streamRef.current) {
      streamRef.current.close();
      streamRef.current = null;
    }
  }, []);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) {
      return;
    }

    setMessages((prev) => [...prev, { id: createId(), text: trimmed, isUser: true }]);
    setInput('');
    setIsStreaming(true);
    streamingTextRef.current = '';
    setStreamingText('');

    if (streamRef.current) {
      streamRef.current.close();
    }

    streamRef.current = streamAiResponse(
      trimmed,
      (chunk) => {
        setStreamingText((prev) => {
          const next = prev + chunk;
          streamingTextRef.current = next;
          return next;
        });
      },
      () => {
        finalizeStream();
      },
      () => {
        finalizeStream();
      }
    );
  };

  React.useEffect(() => {
    const frame = requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [messages, streamingText, isStreaming]);

  React.useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.close();
        streamRef.current = null;
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

        <FlatList
          ref={listRef}
          data={messages}
          contentContainerStyle={styles.chatList}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            return (
              <View
                style={[
                  styles.messageRow,
                  item.isUser ? styles.messageRowUser : styles.messageRowAi,
                ]}>
                <View style={[styles.bubble, item.isUser ? styles.userBubble : styles.aiBubble]}>
                  <Text style={[styles.messageText, item.isUser ? styles.userText : styles.aiText]}>
                    {item.text}
                  </Text>
                </View>
              </View>
            );
          }}
          ListFooterComponent={
            isStreaming ? (
              <View style={[styles.messageRow, styles.messageRowAi]}>
                <View style={[styles.bubble, styles.aiBubble]}>
                  <Text style={[styles.messageText, styles.aiText]}>{streamingText}</Text>
                </View>
              </View>
            ) : null
          }
        />

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
              editable={!isStreaming}
            />
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
    fontWeight: Theme.typography.weight.semiBold,
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
    fontWeight: Theme.typography.weight.semiBold,
  },
});
