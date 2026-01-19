import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import type { IntelligenceChip as ChipType } from '../types';

const CHIP_COLORS: Record<ChipType['type'], { bg: string; border: string }> = {
  dealbreaker: { bg: '#7F1D1D', border: '#DC2626' },
  value: { bg: '#1E3A5F', border: '#3B82F6' },
  energy: { bg: '#422006', border: '#F59E0B' },
  humor: { bg: '#3F3F46', border: '#A1A1AA' },
  planning: { bg: '#14532D', border: '#22C55E' },
  conflict: { bg: '#4C1D95', border: '#8B5CF6' },
  hypothesis: { bg: '#1E1B4B', border: '#6366F1' },
  lifestyle: { bg: '#134E4A', border: '#14B8A6' },
};

interface Props {
  chip: ChipType;
  animated?: boolean;
}

export function IntelligenceChip({ chip, animated = true }: Props) {
  const colors = CHIP_COLORS[chip.type] || CHIP_COLORS.value;

  const content = (
    <View style={[styles.chip, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      {chip.emoji && <Text style={styles.emoji}>{chip.emoji}</Text>}
      <Text style={styles.label}>{chip.label}</Text>
      {chip.confidence !== undefined && chip.confidence < 1 && (
        <View style={styles.confidenceContainer}>
          <View
            style={[
              styles.confidenceBar,
              { width: `${chip.confidence * 100}%`, backgroundColor: colors.border },
            ]}
          />
        </View>
      )}
    </View>
  );

  if (animated) {
    return (
      <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)}>
        {content}
      </Animated.View>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  emoji: {
    fontSize: 14,
    marginRight: 6,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  confidenceContainer: {
    width: 30,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    marginLeft: 8,
    overflow: 'hidden',
  },
  confidenceBar: {
    height: '100%',
    borderRadius: 2,
  },
});
