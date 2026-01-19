import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ConfidenceLevel, UnknownItem } from '../types';

interface Props {
  level: ConfidenceLevel;
  unknowns: UnknownItem[];
}

const CONFIDENCE_CONFIG: Record<
  ConfidenceLevel,
  { color: string; icon: string; label: string }
> = {
  HIGH: {
    color: '#22C55E',
    icon: 'checkmark-circle',
    label: 'High confidence',
  },
  MEDIUM: {
    color: '#F59E0B',
    icon: 'help-circle',
    label: 'Medium confidence',
  },
  LOW: {
    color: '#EF4444',
    icon: 'alert-circle',
    label: 'Low confidence',
  },
};

export function ConfidenceWidget({ level, unknowns }: Props) {
  const config = CONFIDENCE_CONFIG[level];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons
          name={config.icon as any}
          size={20}
          color={config.color}
        />
        <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
      </View>

      {/* Explanation */}
      {level === 'HIGH' && (
        <Text style={styles.explanation}>
          I have enough information to confidently recommend this match.
        </Text>
      )}

      {level === 'MEDIUM' && unknowns.length > 0 && (
        <View style={styles.unknownsContainer}>
          <Text style={styles.explanation}>
            I like this match, but I need a few more answers:
          </Text>
          {unknowns.slice(0, 2).map((unknown, index) => (
            <View key={index} style={styles.unknownItem}>
              <Text style={styles.unknownQuestion}>{unknown.question}</Text>
              <Text style={styles.unknownReason}>{unknown.reason}</Text>
            </View>
          ))}
        </View>
      )}

      {level === 'LOW' && (
        <Text style={styles.explanation}>
          I need more conversation data to make a confident recommendation.
          Keep talking to me to improve match quality.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  explanation: {
    color: '#A0A0A0',
    fontSize: 14,
    lineHeight: 20,
  },
  unknownsContainer: {
    marginTop: 4,
  },
  unknownItem: {
    marginTop: 12,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#F59E0B',
  },
  unknownQuestion: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  unknownReason: {
    color: '#666666',
    fontSize: 12,
  },
});
