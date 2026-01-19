import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import type { MatchResult, ConfidenceLevel } from '../types';

interface Props {
  match: MatchResult;
  onPress: () => void;
}

const CONFIDENCE_COLORS: Record<ConfidenceLevel, string> = {
  HIGH: '#22C55E',
  MEDIUM: '#F59E0B',
  LOW: '#EF4444',
};

export function MatchCard({ match, onPress }: Props) {
  const confidenceColor = CONFIDENCE_COLORS[match.confidenceLevel];

  return (
    <Pressable style={styles.container} onPress={onPress}>
      {/* Photo */}
      <View style={styles.photoContainer}>
        {match.matchedWith.photoUrl ? (
          <Image
            source={{ uri: match.matchedWith.photoUrl }}
            style={styles.photo}
            contentFit="cover"
          />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="person" size={32} color="#666666" />
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.name}>{match.matchedWith.displayName}</Text>

        {/* Score and confidence */}
        <View style={styles.scoreRow}>
          <View style={styles.scoreContainer}>
            <Text style={styles.score}>{match.compatibilityScore}%</Text>
            <Text style={styles.scoreLabel}>match</Text>
          </View>

          <View style={[styles.confidenceBadge, { backgroundColor: `${confidenceColor}20` }]}>
            <View style={[styles.confidenceDot, { backgroundColor: confidenceColor }]} />
            <Text style={[styles.confidenceText, { color: confidenceColor }]}>
              {match.confidenceLevel}
            </Text>
          </View>
        </View>

        {/* Top reason */}
        {match.whyMatched[0] && (
          <Text style={styles.reason} numberOfLines={1}>
            {match.whyMatched[0]}
          </Text>
        )}
      </View>

      {/* Status indicator */}
      <View style={styles.statusContainer}>
        {match.status === 'APPROVED' && (
          <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
        )}
        {match.status === 'REJECTED' && (
          <Ionicons name="close-circle" size={24} color="#EF4444" />
        )}
        {match.status === 'PENDING' && (
          <Ionicons name="chevron-forward" size={24} color="#666666" />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  photoContainer: {
    marginRight: 16,
  },
  photo: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  photoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 6,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginRight: 12,
  },
  score: {
    color: '#8B5CF6',
    fontSize: 20,
    fontWeight: '700',
  },
  scoreLabel: {
    color: '#A0A0A0',
    fontSize: 12,
    marginLeft: 4,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  confidenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  reason: {
    color: '#A0A0A0',
    fontSize: 13,
  },
  statusContainer: {
    marginLeft: 8,
  },
});
