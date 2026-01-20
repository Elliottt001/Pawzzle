import * as React from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

import { PetCard } from '@/components/pet-card';
import { petCards } from '@/data/pets';

type Intent = 'adopt' | 'rehome';

const colorOptions = ['Golden', 'Black', 'White', 'Mixed'];
const personalityOptions = ['Calm', 'Playful', 'Independent', 'Smart'];
const expectationOptions = ['Good with cats', 'Low shed', 'Easy to train', 'No preference'];

export default function AgentScreen() {
  const [intent, setIntent] = React.useState<Intent | null>(null);
  const [color, setColor] = React.useState<string | null>(null);
  const [personality, setPersonality] = React.useState<string | null>(null);
  const [expectation, setExpectation] = React.useState<string | null>(null);
  const scrollRef = React.useRef<ScrollView | null>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [intent, color, personality, expectation]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.background}>
        <View style={[styles.blob, styles.blobLeft]} />
        <View style={[styles.blob, styles.blobRight]} />
        <View style={[styles.blob, styles.blobBottom]} />
      </View>

      <View style={styles.header}>
        <Text style={styles.overline}>Agent</Text>
        <Text style={styles.title}>Adoption Assistant</Text>
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.chatList}>
        <ChatBubble role="ai" text="Do you want to adopt or rehome?" />
        {!intent ? (
          <View style={styles.optionRow}>
            <OptionButton label="Adopt a pet" variant="primary" onPress={() => setIntent('adopt')} />
            <OptionButton label="Rehome a pet" variant="outline" onPress={() => setIntent('rehome')} />
          </View>
        ) : null}

        {intent ? (
          <ChatBubble role="user" text={intent === 'adopt' ? 'Adopt a pet' : 'Rehome a pet'} />
        ) : null}

        {intent === 'rehome' ? (
          <ChatBubble
            role="ai"
            text="Rehome flow is coming soon. For now, I can help with adoption."
          />
        ) : null}

        {intent === 'adopt' ? (
          <>
            <ChatBubble role="ai" text="What coat color do you like?" />
            {!color ? (
              <View style={styles.optionRow}>
                {colorOptions.map((option) => (
                  <OptionButton
                    key={option}
                    label={option}
                    variant="chip"
                    onPress={() => setColor(option)}
                  />
                ))}
              </View>
            ) : (
              <ChatBubble role="user" text={color} />
            )}

            {color ? (
              <>
                <ChatBubble role="ai" text="What personality do you like?" />
                {!personality ? (
                  <View style={styles.optionRow}>
                    {personalityOptions.map((option) => (
                      <OptionButton
                        key={option}
                        label={option}
                        variant="chip"
                        onPress={() => setPersonality(option)}
                      />
                    ))}
                  </View>
                ) : (
                  <ChatBubble role="user" text={personality} />
                )}
              </>
            ) : null}

            {personality ? (
              <>
                <ChatBubble role="ai" text="Any other expectations?" />
                {!expectation ? (
                  <View style={styles.optionRow}>
                    {expectationOptions.map((option) => (
                      <OptionButton
                        key={option}
                        label={option}
                        variant="chip"
                        onPress={() => setExpectation(option)}
                      />
                    ))}
                  </View>
                ) : (
                  <ChatBubble role="user" text={expectation} />
                )}
              </>
            ) : null}

            {expectation ? (
              <>
                <ChatBubble role="ai" text="Here are your top matches." />
                <View style={styles.matchList}>
                  {petCards.slice(0, 3).map((pet) => (
                    <PetCard key={pet.id} pet={pet} />
                  ))}
                </View>
              </>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function ChatBubble({ role, text }: { role: 'user' | 'ai'; text: string }) {
  const isUser = role === 'user';
  return (
    <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowAi]}>
      {!isUser ? (
        <View style={styles.avatar}>
          <FontAwesome5 name="paw" size={16} color="#15803D" />
        </View>
      ) : null}
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
        <Text style={[styles.messageText, isUser ? styles.userText : styles.aiText]}>{text}</Text>
      </View>
    </View>
  );
}

function OptionButton({
  label,
  variant,
  onPress,
}: {
  label: string;
  variant: 'primary' | 'outline' | 'chip';
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.optionButton,
        variant === 'primary' && styles.optionPrimary,
        variant === 'outline' && styles.optionOutline,
        variant === 'chip' && styles.optionChip,
        pressed && styles.optionPressed,
      ]}>
      <Text
        style={[
          styles.optionText,
          variant === 'primary' && styles.optionTextPrimary,
          variant === 'outline' && styles.optionTextOutline,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FDF7F0',
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
  blobLeft: {
    top: -70,
    left: -40,
    backgroundColor: '#FCE6CE',
  },
  blobRight: {
    top: 20,
    right: -50,
    backgroundColor: '#DFF3E5',
  },
  blobBottom: {
    bottom: -70,
    left: '35%',
    backgroundColor: '#DCEFFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 6,
  },
  overline: {
    fontSize: 11,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: '#6B7280',
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#111827',
  },
  chatList: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 140,
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
    width: 34,
    height: 34,
    borderRadius: 17,
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
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
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
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingLeft: 42,
    marginBottom: 12,
  },
  optionButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  optionPrimary: {
    backgroundColor: '#157B57',
    borderColor: '#157B57',
  },
  optionOutline: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderColor: '#EFE3D6',
  },
  optionChip: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  optionPressed: {
    transform: [{ scale: 0.98 }],
  },
  optionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  optionTextPrimary: {
    color: '#FFFFFF',
  },
  optionTextOutline: {
    color: '#1F2937',
  },
  matchList: {
    marginTop: 6,
    gap: 14,
  },
});
