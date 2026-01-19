import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '../src/stores/auth';

// Prevent auto-hide of splash screen
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { initialize, isInitialized } = useAuthStore();

  useEffect(() => {
    // Initialize auth and hide splash when ready
    const unsubscribe = initialize();

    return () => {
      unsubscribe();
    };
  }, [initialize]);

  useEffect(() => {
    if (isInitialized) {
      SplashScreen.hideAsync();
    }
  }, [isInitialized]);

  if (!isInitialized) {
    return null;
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#0D0D0D',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: '600',
          },
          contentStyle: {
            backgroundColor: '#0D0D0D',
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="match/[id]"
          options={{
            title: 'Match Details',
            presentation: 'modal',
          }}
        />
      </Stack>
    </>
  );
}
