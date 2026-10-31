import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { COLORS } from "@/constants";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitle: "SahiMauka",
        headerStyle: { backgroundColor: COLORS.bg },
        headerTintColor: COLORS.ink,
        headerTitleStyle: { fontWeight: "800" },
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarStyle: {
          backgroundColor: COLORS.card,
          borderTopColor: COLORS.line,
        },
        sceneStyle: { backgroundColor: COLORS.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={typeof color === "number" ? COLORS.accent : (color ?? undefined)} />
          ),
        }}
      />
      <Tabs.Screen
        name="deadlines"
        options={{
          title: "Deadlines",
          tabBarIcon: ({ color, size }) => (
            <Feather name="clock" size={size} color={typeof color === "number" ? COLORS.accent : (color ?? undefined)} />
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: "Saved",
          tabBarIcon: ({ color, size }) => (
            <Feather
              name="bookmark"
              size={size}
              color={typeof color === "number" ? COLORS.accent : (color ?? undefined)}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color, size }) => (
            <Feather
              name="settings"
              size={size}
              color={typeof color === "number" ? COLORS.accent : (color ?? undefined)}
            />
          ),
        }}
      />
    </Tabs>
  );
}
