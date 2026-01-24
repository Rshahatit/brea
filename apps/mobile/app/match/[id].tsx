import { useLocalSearchParams } from "expo-router";
import { YStack, Text, ScrollView, Button, Separator } from "tamagui";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <ScrollView flex={1} backgroundColor="$background">
        <YStack padding={16} gap={24}>
          {/* The Intel - Primary narrative */}
          <YStack gap={8}>
            <Text fontSize={12} color="$colorHover" textTransform="uppercase">
              The Intel
            </Text>
            <Text fontSize={18} fontWeight="600" color="$color">
              Match details for {id}
            </Text>
          </YStack>

          <Separator backgroundColor="$borderColor" />

          {/* Compatibility Score */}
          <YStack alignItems="center" gap={8}>
            <Text fontSize={48} fontWeight="bold" color="$accentBackground">
              85%
            </Text>
            <Text fontSize={14} color="$colorHover">
              Compatibility Score
            </Text>
          </YStack>

          {/* Date Protocol Button */}
          <Button
            size="$5"
            backgroundColor="$accentBackground"
            marginTop={16}
          >
            <Text color="white">Send Invite</Text>
          </Button>
          <Text fontSize={12} color="$colorHover" textAlign="center">
            "I won't send anything unless you say yes."
          </Text>
        </YStack>
      </ScrollView>
    </SafeAreaView>
  );
}
