import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { IntelligenceChip } from './IntelligenceChip';
import { useBreaPStore } from '../stores/brea';

export function LiveCapturePanel() {
  const { chips, currentTranscription, status } = useBreaPStore();

  const showTranscription = status === 'speaking' && currentTranscription;

  return (
    <Animated.View entering={SlideInUp.duration(300)} style={styles.container}>
      {/* Current transcription */}
      {showTranscription && (
        <Animated.View entering={FadeIn.duration(200)} style={styles.transcriptionContainer}>
          <Text style={styles.transcriptionLabel}>Brea is saying:</Text>
          <Text style={styles.transcription}>{currentTranscription}</Text>
        </Animated.View>
      )}

      {/* Intelligence chips */}
      {chips.length > 0 && (
        <View style={styles.chipsSection}>
          <Text style={styles.sectionTitle}>What I'm learning about you</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContainer}
          >
            {chips.map((chip, index) => (
              <IntelligenceChip key={`${chip.type}-${chip.label}-${index}`} chip={chip} />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Empty state */}
      {chips.length === 0 && !showTranscription && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            Start talking to Brea. I'll show what I learn here.
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    minHeight: 100,
  },
  transcriptionContainer: {
    marginBottom: 12,
  },
  transcriptionLabel: {
    color: '#A0A0A0',
    fontSize: 12,
    marginBottom: 4,
  },
  transcription: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 22,
  },
  chipsSection: {
    marginTop: 8,
  },
  sectionTitle: {
    color: '#A0A0A0',
    fontSize: 12,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    color: '#666666',
    fontSize: 14,
    textAlign: 'center',
  },
});
