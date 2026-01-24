import { YStack, XStack, Text, ScrollView, Button } from "tamagui";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MatchesScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <YStack flex={1} backgroundColor="$background" padding={16}>
        {/* Header */}
        <XStack justifyContent="space-between" alignItems="center" marginBottom={16}>
          <Text fontSize={24} fontWeight="bold" color="$color">
            Matches
          </Text>
          <Button
            size="$3"
            backgroundColor="$accentBackground"
          >
            <Text color="white" fontSize={12}>See who Brea found</Text>
          </Button>
        </XStack>

        {/* Matches list */}
        <ScrollView flex={1}>
          <YStack alignItems="center" justifyContent="center" paddingVertical={48}>
            <Text color="$colorHover" textAlign="center" fontSize={16}>
              No matches yet.
            </Text>
            <Text color="$colorHover" textAlign="center" fontSize={14} marginTop={8}>
              Chat with Brea to build your profile, then tap "See who Brea found".
            </Text>
          </YStack>
        </ScrollView>
      </YStack>
    </SafeAreaView>
  );
}
