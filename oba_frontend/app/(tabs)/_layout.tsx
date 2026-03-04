// oba_frontend/app/_layout.tsx
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import "react-native-reanimated";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

// ✅ 수정됨: 올바른 경로로 변경 (./article/components -> ./components)
import AppBackground from "../components/AppBackground";
const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "transparent",
  },
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider value={MyTheme}>
        <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }}>
          <View style={{ flex: 1, backgroundColor: "transparent" }}>
            {/* 배경 컴포넌트 적용 */}
            <AppBackground />

            <View style={{ flex: 1, backgroundColor: "transparent" }}>
              <Stack screenOptions={{ headerShown: false }}>
                {/* 탭 화면 */}
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                {/* 로그인(인증) 화면 */}
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                {/* 기사 상세 화면 */}
                <Stack.Screen name="article/[id]" options={{ headerShown: false }} />
              </Stack>
            </View>
          </View>
        </SafeAreaView>
        <StatusBar style="auto" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}