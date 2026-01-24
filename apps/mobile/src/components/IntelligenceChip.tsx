import { XStack, Text } from "tamagui";
import type { IntelligenceChipType } from "@brea/shared";

interface IntelligenceChipProps {
  type: IntelligenceChipType;
  label: string;
  value: string;
  emoji?: string;
  confirmed?: boolean;
}

const chipColors: Record<IntelligenceChipType, { bg: string; text: string }> = {
  dealbreaker: { bg: "#FEE2E2", text: "#DC2626" },
  value: { bg: "#DBEAFE", text: "#2563EB" },
  energy: { bg: "#FEF3C7", text: "#D97706" },
  humor: { bg: "#FCE7F3", text: "#DB2777" },
  planning: { bg: "#E0E7FF", text: "#4F46E5" },
  conflict: { bg: "#FED7AA", text: "#EA580C" },
  hypothesis: { bg: "#E5E7EB", text: "#4B5563" },
  unknown: { bg: "#F3F4F6", text: "#6B7280" },
};

export function IntelligenceChip({
  type,
  label,
  value,
  emoji,
  confirmed,
}: IntelligenceChipProps) {
  const colors = chipColors[type] || chipColors.unknown;

  return (
    <XStack
      backgroundColor={colors.bg}
      paddingHorizontal={10}
      paddingVertical={6}
      borderRadius={16}
      alignItems="center"
      gap={4}
      opacity={confirmed === false ? 0.6 : 1}
      animation="quick"
      enterStyle={{
        opacity: 0,
        scale: 0.9,
      }}
    >
      {emoji && <Text fontSize={12}>{emoji}</Text>}
      <Text fontSize={12} fontWeight="600" color={colors.text}>
        {label}: {value}
      </Text>
      {confirmed !== undefined && (
        <Text fontSize={10}>{confirmed ? "✓" : "?"}</Text>
      )}
    </XStack>
  );
}
