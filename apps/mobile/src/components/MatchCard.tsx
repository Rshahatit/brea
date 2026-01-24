import { Pressable } from "react-native";
import { XStack, YStack, Text } from "tamagui";
import { ChevronRight } from "@tamagui/lucide-icons";
import type { MatchResult } from "@brea/shared";

interface MatchCardProps {
  match: MatchResult;
  onPress: () => void;
}

export function MatchCard({ match, onPress }: MatchCardProps) {
  const confidenceColor =
    match.confidenceLevel === "HIGH"
      ? "#22C55E"
      : match.confidenceLevel === "MEDIUM"
      ? "#EAB308"
      : "#EF4444";

  return (
    <Pressable onPress={onPress}>
      <XStack
        backgroundColor="$backgroundHover"
        borderRadius={12}
        padding={16}
        alignItems="center"
        gap={12}
        pressStyle={{
          backgroundColor: "$backgroundPress",
        }}
      >
        {/* Avatar placeholder */}
        <YStack
          width={48}
          height={48}
          borderRadius={24}
          backgroundColor="$background"
          justifyContent="center"
          alignItems="center"
        >
          <Text fontSize={20}>?</Text>
        </YStack>

        {/* Match info */}
        <YStack flex={1} gap={4}>
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize={16} fontWeight="600" color="$color">
              {match.compatibilityScore}% Match
            </Text>
            <XStack
              backgroundColor={confidenceColor}
              paddingHorizontal={8}
              paddingVertical={2}
              borderRadius={8}
            >
              <Text fontSize={10} fontWeight="600" color="white">
                {match.confidenceLevel}
              </Text>
            </XStack>
          </XStack>

          <Text fontSize={12} color="$colorHover" numberOfLines={1}>
            {match.whyMatched.slice(0, 2).join(" • ")}
          </Text>

          {match.potentialFriction.length > 0 && (
            <Text fontSize={11} color="$colorHover" numberOfLines={1}>
              ⚠️ {match.potentialFriction[0]}
            </Text>
          )}
        </YStack>

        <ChevronRight size={20} color="$colorHover" />
      </XStack>
    </Pressable>
  );
}
