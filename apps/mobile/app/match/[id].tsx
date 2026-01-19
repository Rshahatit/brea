import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { ConfidenceWidget, ConsentModal } from '../../src/components';
import { useProfileStore } from '../../src/stores/profile';
import type { MatchResult } from '../../src/types';

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { matches, submitConsent } = useProfileStore();
  const [showConsentModal, setShowConsentModal] = useState(false);

  const match = matches.find((m) => m.id === id);

  if (!match) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  const handleApprove = async () => {
    const inviteLink = await submitConsent(match.id, 'APPROVE');
    if (inviteLink) {
      // Could show success and copy link
      console.log('Invite link:', inviteLink);
    }
  };

  const handleReject = async () => {
    await submitConsent(match.id, 'REJECT');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {/* Header with photo and name */}
        <View style={styles.header}>
          {match.matchedWith.photoUrl ? (
            <Image
              source={{ uri: match.matchedWith.photoUrl }}
              style={styles.photo}
              contentFit="cover"
            />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="person" size={48} color="#666666" />
            </View>
          )}
          <Text style={styles.name}>{match.matchedWith.displayName}</Text>

          {/* Score */}
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreValue}>{match.compatibilityScore}%</Text>
            <Text style={styles.scoreLabel}>compatibility</Text>
          </View>
        </View>

        {/* THE INTEL */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bulb" size={18} color="#8B5CF6" />
            <Text style={styles.sectionTitle}>THE INTEL</Text>
          </View>
          <View style={styles.card}>
            {match.whyMatched.map((reason, index) => (
              <View key={index} style={styles.reasonItem}>
                <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                <Text style={styles.reasonText}>{reason}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* POTENTIAL FRICTION */}
        {match.potentialFriction.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="alert-circle" size={18} color="#F59E0B" />
              <Text style={styles.sectionTitle}>POTENTIAL FRICTION</Text>
            </View>
            <View style={styles.card}>
              {match.potentialFriction.map((friction, index) => (
                <View key={index} style={styles.frictionItem}>
                  <Ionicons name="warning" size={16} color="#F59E0B" />
                  <Text style={styles.frictionText}>{friction}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* CONFIDENCE WIDGET */}
        <View style={styles.section}>
          <ConfidenceWidget
            level={match.confidenceLevel}
            unknowns={match.unknowns}
          />
        </View>

        {/* TRANSCRIPT (collapsed by default) */}
        <View style={styles.section}>
          <Pressable style={styles.transcriptHeader}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={18} color="#A0A0A0" />
              <Text style={styles.sectionTitle}>SIMULATION TRANSCRIPT</Text>
            </View>
            <Ionicons name="chevron-down" size={20} color="#666666" />
          </Pressable>
          <Text style={styles.transcriptHint}>
            Redacted transcript of the agent simulation
          </Text>
        </View>

        {/* Status */}
        {match.status !== 'PENDING' && (
          <View style={styles.statusSection}>
            <View
              style={[
                styles.statusBadge,
                match.status === 'APPROVED'
                  ? styles.approvedBadge
                  : styles.rejectedBadge,
              ]}
            >
              <Ionicons
                name={match.status === 'APPROVED' ? 'checkmark-circle' : 'close-circle'}
                size={20}
                color={match.status === 'APPROVED' ? '#22C55E' : '#EF4444'}
              />
              <Text
                style={[
                  styles.statusBadgeText,
                  { color: match.status === 'APPROVED' ? '#22C55E' : '#EF4444' },
                ]}
              >
                {match.status === 'APPROVED' ? 'You approved this match' : 'You passed on this match'}
              </Text>
            </View>

            {match.consent?.inviteLink && (
              <Pressable style={styles.copyLinkButton}>
                <Ionicons name="link" size={16} color="#8B5CF6" />
                <Text style={styles.copyLinkText}>Copy invite link</Text>
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>

      {/* Action buttons (only show for pending) */}
      {match.status === 'PENDING' && (
        <View style={styles.actions}>
          <Pressable
            style={[styles.actionButton, styles.passButton]}
            onPress={handleReject}
          >
            <Ionicons name="close" size={24} color="#A0A0A0" />
          </Pressable>

          <Pressable
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => setShowConsentModal(true)}
          >
            <Ionicons name="heart" size={24} color="#FFFFFF" />
            <Text style={styles.approveButtonText}>Interested</Text>
          </Pressable>
        </View>
      )}

      {/* Consent modal */}
      <ConsentModal
        visible={showConsentModal}
        match={match}
        onApprove={handleApprove}
        onReject={handleReject}
        onClose={() => setShowConsentModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D0D0D',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 120,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreValue: {
    color: '#8B5CF6',
    fontSize: 36,
    fontWeight: '700',
  },
  scoreLabel: {
    color: '#A0A0A0',
    fontSize: 14,
    marginLeft: 6,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    color: '#A0A0A0',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  reasonText: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  frictionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  frictionText: {
    color: '#A0A0A0',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  transcriptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  transcriptHint: {
    color: '#666666',
    fontSize: 12,
    marginTop: 4,
  },
  statusSection: {
    alignItems: 'center',
    marginTop: 24,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  approvedBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  rejectedBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  copyLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 6,
  },
  copyLinkText: {
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: '500',
  },
  actions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#0D0D0D',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  passButton: {
    width: 60,
    backgroundColor: '#1A1A1A',
  },
  approveButton: {
    flex: 1,
    backgroundColor: '#8B5CF6',
  },
  approveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
