import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MatchCard } from '../../src/components';
import { useProfileStore } from '../../src/stores/profile';

export default function MatchesScreen() {
  const router = useRouter();
  const { matches, isLoading, error, fetchMatches, runArena } = useProfileStore();
  const [isRunningArena, setIsRunningArena] = useState(false);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const handleRefresh = useCallback(() => {
    fetchMatches();
  }, [fetchMatches]);

  const handleRunArena = async () => {
    setIsRunningArena(true);
    const match = await runArena();
    setIsRunningArena(false);

    if (match) {
      router.push(`/match/${match.id}`);
    }
  };

  const handleMatchPress = (matchId: string) => {
    router.push(`/match/${matchId}`);
  };

  return (
    <View style={styles.container}>
      {/* Header action */}
      <View style={styles.headerAction}>
        <Pressable
          style={[styles.findButton, isRunningArena && styles.findButtonDisabled]}
          onPress={handleRunArena}
          disabled={isRunningArena || isLoading}
        >
          {isRunningArena ? (
            <>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.findButtonText}>Finding matches...</Text>
            </>
          ) : (
            <>
              <Ionicons name="sparkles" size={20} color="#FFFFFF" />
              <Text style={styles.findButtonText}>See who Brea found</Text>
            </>
          )}
        </Pressable>
      </View>

      {/* Error */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Matches list */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor="#8B5CF6"
          />
        }
      >
        {matches.length === 0 && !isLoading ? (
          <View style={styles.emptyState}>
            <Ionicons name="heart-outline" size={64} color="#333333" />
            <Text style={styles.emptyTitle}>No matches yet</Text>
            <Text style={styles.emptyText}>
              Talk to Brea first, then tap "See who Brea found" to run a
              compatibility simulation.
            </Text>
          </View>
        ) : (
          matches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              onPress={() => handleMatchPress(match.id)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  headerAction: {
    padding: 16,
  },
  findButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  findButtonDisabled: {
    opacity: 0.7,
  },
  findButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 0,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 8,
  },
  emptyText: {
    color: '#666666',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
});
