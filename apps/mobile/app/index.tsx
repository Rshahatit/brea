import { useEffect } from "react";
import { router } from "expo-router";
import { YStack, Text, Spinner } from "tamagui";

export default function SplashScreen() {
  useEffect(() => {
    // Navigate to main app after a brief splash
    const timer = setTimeout(() => {
      router.replace("/(tabs)/chat");
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$background">
      <Text fontSize={48} fontWeight="bold" color="$color" marginBottom={8}>
        Brea
      </Text>
      <Text fontSize={16} color="$colorHover" marginBottom={32}>
        Your AI Dating Liaison
      </Text>
      <Spinner size="large" color="$accentBackground" />
    </YStack>
  );
}
