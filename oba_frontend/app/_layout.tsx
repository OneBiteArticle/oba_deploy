import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import "react-native-reanimated";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import AppBackground from "./components/AppBackground";
import { AuthProvider, useAuth } from "../src/auth/AuthContext";
import { COLORS } from "../constants/theme";

const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: COLORS.bgPrimary,
  },
};

function RootNavigator() {
  const { isLoggedIn, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isLoggedIn && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (isLoggedIn && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [isLoggedIn, isLoading, segments, router]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="article/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <ThemeProvider value={MyTheme}>
          <SafeAreaView edges={["left", "right", "bottom"]} style={{ flex: 1, backgroundColor: COLORS.bgPrimary }}>
            <View style={{ flex: 1, backgroundColor: COLORS.bgPrimary }}>
              <AppBackground />
              <View style={{ flex: 1, backgroundColor: COLORS.bgPrimary }}>
                <RootNavigator />
              </View>
            </View>
          </SafeAreaView>
          <StatusBar style="dark" />
        </ThemeProvider>
      </SafeAreaProvider>
    </AuthProvider>
  );
}

