import { XStack, YStack, Text, AnimatePresence } from "tamagui";
import { useBreaStore } from "../stores/brea";
import { IntelligenceChip } from "./IntelligenceChip";

export function LiveCapturePanel() {
  const { intelligenceChips, sessionState } = useBreaStore();

  if (intelligenceChips.length === 0 && sessionState !== "listening") {
    return null;
  }

  return (
    <YStack
      backgroundColor="$backgroundHover"
      borderRadius={12}
      padding={12}
      minHeight={60}
    >
      <Text fontSize={10} color="$colorHover" marginBottom={8} textTransform="uppercase">
        {sessionState === "listening" ? "Listening..." : "What Brea learned"}
      </Text>

      <XStack flexWrap="wrap" gap={8}>
        <AnimatePresence>
          {intelligenceChips.map((chip, index) => (
            <IntelligenceChip
              key={`${chip.type}-${chip.value}-${index}`}
              type={chip.type}
              label={chip.label}
              value={chip.value}
              emoji={chip.emoji}
              confirmed={chip.confirmed}
            />
          ))}
        </AnimatePresence>

        {sessionState === "listening" && intelligenceChips.length === 0 && (
          <Text fontSize={12} color="$colorHover" fontStyle="italic">
            Chips will appear as Brea learns about you...
          </Text>
        )}
      </XStack>
    </YStack>
  );
}
