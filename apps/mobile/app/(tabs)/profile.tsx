import { YStack, Text, ScrollView, Button } from "tamagui";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <ScrollView flex={1} backgroundColor="$background">
        <YStack padding={16} gap={24}>
          {/* Header */}
          <YStack alignItems="center" gap={8}>
            <YStack
              width={80}
              height={80}
              borderRadius={40}
              backgroundColor="$backgroundHover"
              justifyContent="center"
              alignItems="center"
            >
              <Text fontSize={32}>?</Text>
            </YStack>
            <Text fontSize={20} fontWeight="bold" color="$color">
              Anonymous User
            </Text>
            <Text fontSize={12} color="$colorHover">
              Anonymous account
            </Text>
          </YStack>

          {/* Empty state */}
          <YStack alignItems="center" padding={24}>
            <Text color="$colorHover" textAlign="center">
              Chat with Brea to build your profile.
            </Text>
          </YStack>

          {/* Sign out */}
          <Button
            size="$4"
            backgroundColor="$backgroundHover"
            marginTop={24}
          >
            <Text color="$color">Sign Out</Text>
          </Button>
        </YStack>
      </ScrollView>
    </SafeAreaView>
  );
}
