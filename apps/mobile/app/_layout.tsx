import { useEffect } from "react";
import { useColorScheme } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { TamaguiProvider, Theme } from "tamagui";
import config from "../tamagui.config";
import { useAuthStore } from "../src/stores/auth";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <TamaguiProvider config={config}>
      <Theme name={colorScheme === "dark" ? "dark" : "light"}>
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: colorScheme === "dark" ? "#0A0A0A" : "#FFFFFF",
            },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="match/[id]"
            options={{
              presentation: "modal",
              headerShown: true,
              headerTitle: "Match Details",
            }}
          />
        </Stack>
      </Theme>
    </TamaguiProvider>
  );
}
