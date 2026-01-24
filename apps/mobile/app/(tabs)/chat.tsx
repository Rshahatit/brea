/**
 * Chat Screen
 *
 * The main voice conversation screen with Brea.
 * Uses the VoiceRoom component for the voice interface.
 */

import { YStack } from "tamagui";
import { SafeAreaView } from "react-native-safe-area-context";
import { VoiceRoom } from "../../src/features/voice/VoiceRoom";

export default function ChatScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <YStack flex={1} backgroundColor="$background">
        <VoiceRoom />
      </YStack>
    </SafeAreaView>
  );
}
