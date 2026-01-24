import { YStack, XStack, Text } from "tamagui";
import type { ConfidenceLevel, SandboxUnknown } from "@brea/shared";

interface ConfidenceWidgetProps {
  level: ConfidenceLevel;
  unknowns: SandboxUnknown[];
}

const confidenceConfig: Record<
  ConfidenceLevel,
  { color: string; label: string; description: string }
> = {
  HIGH: {
    color: "#22C55E",
    label: "High Confidence",
    description: "I'm pretty sure about this one.",
  },
  MEDIUM: {
    color: "#EAB308",
    label: "Medium Confidence",
    description: "I like this, but need more info.",
  },
  LOW: {
    color: "#EF4444",
    label: "Low Confidence",
    description: "Too many unknowns to be sure.",
  },
};

export function ConfidenceWidget({ level, unknowns }: ConfidenceWidgetProps) {
  const config = confidenceConfig[level];

  return (
    <YStack gap={12}>
      <XStack alignItems="center" gap={8}>
        <YStack
          width={12}
          height={12}
          borderRadius={6}
          backgroundColor={config.color}
        />
        <Text fontSize={14} fontWeight="600" color="$color">
          {config.label}
        </Text>
      </XStack>

      <Text fontSize={14} color="$colorHover" fontStyle="italic">
        "{config.description}
        {unknowns.length > 0 &&
          ` I need ${unknowns.length} more answer${unknowns.length > 1 ? "s" : ""} before pushing this.`}
        "
      </Text>
    </YStack>
  );
}
