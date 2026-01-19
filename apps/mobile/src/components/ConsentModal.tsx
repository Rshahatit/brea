import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { MatchResult } from '../types';

interface Props {
  visible: boolean;
  match: MatchResult;
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
  onClose: () => void;
}

export function ConsentModal({
  visible,
  match,
  onApprove,
  onReject,
  onClose,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async (action: 'approve' | 'reject') => {
    setIsLoading(true);
    try {
      if (action === 'approve') {
        await onApprove();
      } else {
        await onReject();
      }
      onClose();
    } catch (error) {
      console.error('Consent action failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#A0A0A0" />
          </Pressable>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Ionicons name="shield-checkmark" size={48} color="#8B5CF6" />

          <Text style={styles.title}>Date Protocol</Text>

          <Text style={styles.subtitle}>
            I won't send anything unless you say yes.
          </Text>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>What happens when you approve:</Text>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark" size={16} color="#22C55E" />
              <Text style={styles.infoText}>
                A secure invite link is generated
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark" size={16} color="#22C55E" />
              <Text style={styles.infoText}>
                {match.matchedWith.displayName} receives your interest
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark" size={16} color="#22C55E" />
              <Text style={styles.infoText}>
                Public venue suggestions only
              </Text>
            </View>
          </View>

          <View style={styles.warningCard}>
            <Ionicons name="information-circle" size={20} color="#F59E0B" />
            <Text style={styles.warningText}>
              Your profile remains private until both parties consent.
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            style={[styles.button, styles.rejectButton]}
            onPress={() => handleAction('reject')}
            disabled={isLoading}
          >
            <Text style={styles.rejectButtonText}>Not interested</Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.approveButton]}
            onPress={() => handleAction('approve')}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="heart" size={20} color="#FFFFFF" />
                <Text style={styles.approveButtonText}>Yes, reach out</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 8,
  },
  subtitle: {
    color: '#A0A0A0',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  infoCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 16,
  },
  infoTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    color: '#A0A0A0',
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  warningText: {
    color: '#F59E0B',
    fontSize: 13,
    marginLeft: 12,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    padding: 24,
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  rejectButton: {
    backgroundColor: '#333333',
  },
  rejectButtonText: {
    color: '#A0A0A0',
    fontSize: 16,
    fontWeight: '600',
  },
  approveButton: {
    backgroundColor: '#8B5CF6',
  },
  approveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
