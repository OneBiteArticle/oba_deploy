import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import "react-native-reanimated";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import AppBackground from "./components/AppBackground";

// 🔥 수정된 테마 설정 (오타 제거됨)
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
          {/* 전체 배경 적용 */}
          <View style={{ flex: 1, backgroundColor: "transparent" }}>
            <AppBackground />

            {/* 네비게이션 스택 */}
            <View style={{ flex: 1, backgroundColor: "transparent" }}>
              <Stack screenOptions={{ headerShown: false }}>
                {/* 탭 화면 */}
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                {/* 인증(로그인) 화면 */}
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                {/* 기사 상세 화면 (동적 라우팅) */}
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