import { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { IntelligenceChip } from '../../src/components';
import { useProfileStore } from '../../src/stores/profile';
import { useBreaPStore } from '../../src/stores/brea';
import { useAuthStore } from '../../src/stores/auth';

export default function ProfileScreen() {
  const { user: authUser } = useAuthStore();
  const { user, isLoading, fetchProfile } = useProfileStore();
  const { chips } = useBreaPStore();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      // In production, upload to S3 and update profile
      console.log('Selected image:', result.assets[0].uri);
    }
  };

  const profile = user?.profile;
  const allChips = [
    ...chips,
    ...(profile?.values.map((v) => ({
      type: 'value' as const,
      label: v,
      emoji: '💎',
    })) || []),
    ...(profile?.dealbreakers.map((d) => ({
      type: 'dealbreaker' as const,
      label: d,
      emoji: '❌',
    })) || []),
  ];

  // Deduplicate chips
  const uniqueChips = allChips.filter(
    (chip, index, self) =>
      index ===
      self.findIndex((c) => c.type === chip.type && c.label === chip.label)
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={fetchProfile}
          tintColor="#8B5CF6"
        />
      }
    >
      {/* Photo section */}
      <Pressable style={styles.photoSection} onPress={handlePickImage}>
        {profile?.photoUrl ? (
          <Image
            source={{ uri: profile.photoUrl }}
            style={styles.photo}
            contentFit="cover"
          />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="camera" size={32} color="#666666" />
            <Text style={styles.photoPlaceholderText}>Add photo</Text>
          </View>
        )}
      </Pressable>

      {/* Account info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {authUser?.isAnonymous ? 'Anonymous' : 'Linked'}
              </Text>
            </View>
          </View>
          {user?.email && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user.email}</Text>
            </View>
          )}
        </View>
      </View>

      {/* What Brea knows */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What Brea knows about you</Text>

        {uniqueChips.length > 0 ? (
          <View style={styles.chipsContainer}>
            {uniqueChips.map((chip, index) => (
              <IntelligenceChip
                key={`${chip.type}-${chip.label}-${index}`}
                chip={chip}
                animated={false}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyChips}>
            <Text style={styles.emptyChipsText}>
              Talk to Brea to build your profile
            </Text>
          </View>
        )}
      </View>

      {/* Hypotheses */}
      {profile?.hypotheses && profile.hypotheses.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Things to confirm</Text>
          {profile.hypotheses
            .filter((h) => h.confirmed === undefined)
            .map((hypothesis, index) => (
              <View key={index} style={styles.hypothesisCard}>
                <Text style={styles.hypothesisClaim}>{hypothesis.claim}</Text>
                <Text style={styles.hypothesisQuestion}>
                  {hypothesis.question}
                </Text>
                <View style={styles.hypothesisActions}>
                  <Pressable style={[styles.hypothesisButton, styles.confirmButton]}>
                    <Ionicons name="checkmark" size={16} color="#22C55E" />
                    <Text style={styles.confirmButtonText}>Yes</Text>
                  </Pressable>
                  <Pressable style={[styles.hypothesisButton, styles.denyButton]}>
                    <Ionicons name="close" size={16} color="#EF4444" />
                    <Text style={styles.denyButtonText}>No</Text>
                  </Pressable>
                </View>
              </View>
            ))}
        </View>
      )}

      {/* Knowledge gaps */}
      {profile?.knowledgeGaps && profile.knowledgeGaps.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Questions Brea wants to ask</Text>
          {profile.knowledgeGaps.map((gap, index) => (
            <View key={index} style={styles.gapCard}>
              <Text style={styles.gapQuestion}>{gap.question}</Text>
              <Text style={styles.gapReason}>{gap.reason}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Data retention notice */}
      <View style={styles.notice}>
        <Ionicons name="shield-checkmark" size={16} color="#666666" />
        <Text style={styles.noticeText}>
          {authUser?.isAnonymous
            ? 'Anonymous data expires after 7 days of inactivity'
            : 'Your data is encrypted and securely stored'}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  content: {
    padding: 16,
    paddingBottom: 48,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 16,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#333333',
    borderStyle: 'dashed',
  },
  photoPlaceholderText: {
    color: '#666666',
    fontSize: 12,
    marginTop: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#A0A0A0',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    color: '#A0A0A0',
    fontSize: 14,
  },
  infoValue: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  statusBadge: {
    backgroundColor: '#333333',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyChips: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyChipsText: {
    color: '#666666',
    fontSize: 14,
  },
  hypothesisCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  hypothesisClaim: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  hypothesisQuestion: {
    color: '#A0A0A0',
    fontSize: 13,
    marginBottom: 16,
  },
  hypothesisActions: {
    flexDirection: 'row',
    gap: 12,
  },
  hypothesisButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  confirmButton: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  confirmButtonText: {
    color: '#22C55E',
    fontSize: 14,
    fontWeight: '500',
  },
  denyButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  denyButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '500',
  },
  gapCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  gapQuestion: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  gapReason: {
    color: '#666666',
    fontSize: 12,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  noticeText: {
    color: '#666666',
    fontSize: 12,
  },
});
