import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";

function TabsInner() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0b1220",
          borderTopColor: "rgba(255,255,255,0.08)",
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 6,
          height: (Platform.OS === "android" ? 56 : 64) + Math.max(insets.bottom, 0),
        },
        tabBarActiveTintColor: "#60a5fa",
        tabBarInactiveTintColor: "#cbd5e1",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Início",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Sobre",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "compass" : "compass-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="results"
        options={{
          href: null,
          title: "Resultados",
        }}
      />
    </Tabs>
  );
}

export default function Layout() {
  return (
    <SafeAreaProvider>
      <TabsInner />
    </SafeAreaProvider>
  );
}
