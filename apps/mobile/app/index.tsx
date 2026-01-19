import { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../src/stores/auth';

export default function SplashScreen() {
  const router = useRouter();
  const { user, isLoading, error } = useAuthStore();

  useEffect(() => {
    if (user && !isLoading) {
      // Navigate to main app
      router.replace('/(tabs)/chat');
    }
  }, [user, isLoading, router]);

  return (
    <LinearGradient
      colors={['#0D0D0D', '#1A1A2E', '#0D0D0D']}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Logo */}
        <Text style={styles.logo}>brea</Text>
        <Text style={styles.tagline}>Your AI Dating Liaison</Text>

        {/* Loading indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8B5CF6" />
            <Text style={styles.loadingText}>Setting up your session...</Text>
          </View>
        )}

        {/* Error message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          "Let Brea handle it."
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    fontSize: 64,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -2,
  },
  tagline: {
    fontSize: 16,
    color: '#A0A0A0',
    marginTop: 8,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  loadingContainer: {
    marginTop: 48,
    alignItems: 'center',
  },
  loadingText: {
    color: '#666666',
    fontSize: 14,
    marginTop: 16,
  },
  errorContainer: {
    marginTop: 48,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
  },
  footer: {
    paddingBottom: 48,
    alignItems: 'center',
  },
  footerText: {
    color: '#8B5CF6',
    fontSize: 16,
    fontStyle: 'italic',
  },
});
