/**
 * MicIndicator Component
 *
 * Visual indicator for microphone state during voice sessions.
 * Full duplex mode - no push-to-talk needed, just a visual indicator.
 */

import { YStack } from "tamagui";
import { Mic, MicOff } from "@tamagui/lucide-icons";
import { useBreaStore } from "../stores/brea";

export function PushToTalkButton() {
  const { sessionState, isConnected } = useBreaStore();

  const isListening = sessionState === "listening";
  const isSpeaking = sessionState === "speaking";
  const isActive = isConnected && (isListening || isSpeaking);

  return (
    <YStack
      width={80}
      height={80}
      borderRadius={40}
      backgroundColor={isSpeaking ? "$blue5" : isListening ? "$green5" : "$backgroundHover"}
      justifyContent="center"
      alignItems="center"
      opacity={isConnected ? 1 : 0.5}
    >
      {isActive ? (
        <Mic size={32} color={isSpeaking ? "$blue10" : "$green10"} />
      ) : (
        <MicOff size={32} color="$color" />
      )}
    </YStack>
  );
}
