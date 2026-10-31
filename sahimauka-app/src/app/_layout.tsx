import * as Notifications from "expo-notifications";
import { DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

import Tour from "@/components/Tour";
import { COLORS } from "@/constants";

SplashScreen.preventAutoHideAsync();

// Show scheduled alerts as normal banners while the app is in the foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: COLORS.bg,
    card: COLORS.card,
    text: COLORS.ink,
    border: COLORS.line,
    primary: COLORS.accent,
    notification: COLORS.accent2,
  },
};

export default function RootLayout() {
  useEffect(() => {
    void SplashScreen.hideAsync().catch(() => {
      // Hiding twice or too early is harmless; nothing to recover.
    });
  }, []);

  return (
    <ThemeProvider value={navTheme}>
      <Stack screenOptions={{ contentStyle: { backgroundColor: COLORS.bg } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="opp/[id]"
          options={{
            headerShown: true,
            title: "Opportunity",
            headerBackTitle: "Back",
            headerStyle: { backgroundColor: COLORS.bg },
            headerTintColor: COLORS.ink,
          }}
        />
      </Stack>
      <Tour />
    </ThemeProvider>
  );
}
