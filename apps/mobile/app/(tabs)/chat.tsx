import { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useBreaSession } from '../../src/hooks/useBreaSession';
import { LiveCapturePanel, PushToTalkButton } from '../../src/components';
import { useBreaPStore } from '../../src/stores/brea';

export default function ChatScreen() {
  const { connect, disconnect, startTalking, stopTalking, isConnected, status } =
    useBreaSession();
  const { messages, error } = useBreaPStore();

  // Connect on mount
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return (
    <LinearGradient colors={['#0D0D0D', '#0D0D0D']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>brea</Text>
          <View
            style={[
              styles.statusIndicator,
              { backgroundColor: isConnected ? '#22C55E' : '#EF4444' },
            ]}
          />
        </View>

        {/* Messages area */}
        <ScrollView
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.length === 0 && (
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeTitle}>Welcome to Brea</Text>
              <Text style={styles.welcomeText}>
                Hold the button below and tell me about yourself.
                {'\n\n'}
                Start with: "One thing I absolutely won't tolerate is..."
              </Text>
            </View>
          )}

          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageContainer,
                message.type === 'user' ? styles.userMessage : styles.breaMessage,
              ]}
            >
              <Text style={styles.messageLabel}>
                {message.type === 'user' ? 'You' : 'Brea'}
              </Text>
              <Text style={styles.messageText}>{message.transcription}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Live capture panel */}
        <LiveCapturePanel />

        {/* Error display */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Push to talk */}
        <PushToTalkButton
          onPressIn={startTalking}
          onPressOut={stopTalking}
          disabled={!isConnected && status !== 'connecting'}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  logo: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  welcomeTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  welcomeText: {
    color: '#A0A0A0',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  messageContainer: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    maxWidth: '85%',
  },
  userMessage: {
    backgroundColor: '#8B5CF6',
    alignSelf: 'flex-end',
  },
  breaMessage: {
    backgroundColor: '#1A1A1A',
    alignSelf: 'flex-start',
  },
  messageLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  messageText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 22,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    textAlign: 'center',
  },
});
