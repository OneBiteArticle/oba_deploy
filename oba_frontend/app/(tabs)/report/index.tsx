import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, StatusBar } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "../../../src/api/apiClient";
import { useAuth } from "../../../src/auth/AuthContext";
import DailyChart from "../../components/report/DailyChart";
import CategoryProgress from "../../components/report/CategoryProgress";
import { COLORS, RADIUS, SHADOWS, TYPO, SPACING } from "../../../constants/theme";
import { buildDailySliceMap, computeConsecutiveLearningDays, extractApiData } from "../../../src/utils/learningStats";

interface ReportData {
  consecutiveDays: number;
  maxConsecutiveDays: number;
  perfectDays: number;
  solvedCount: number;
  totalCount: number;
}

const DEFAULT: ReportData = {
  consecutiveDays: 0,
  maxConsecutiveDays: 0,
  perfectDays: 0,
  solvedCount: 0,
  totalCount: 0,
};

const DAILY_SLICE_CACHE_KEY = "oba_daily_slice_map_cache";

const ReportStats = ({
  consecutiveDays,
  maxConsecutiveDays,
  perfectDays,
}: {
  consecutiveDays: number;
  maxConsecutiveDays: number;
  perfectDays: number;
}) => (
  <View style={s.statsContainer}>
    {[
      { v: consecutiveDays, l: "연속 학습" },
      { v: maxConsecutiveDays, l: "최대 연속" },
      { v: perfectDays, l: "만점 달성" },
    ].map((item, i) => (
      <View key={i} style={s.statCard}>
        <Text style={s.statValue}>{item.v}</Text>
        <Text style={s.statLabel}>{item.l}</Text>
      </View>
    ))}
  </View>
);

const ProgressBar = ({ solvedCount }: { solvedCount: number; totalCount: number }) => {
  const todayTotal = 5;
  const todaySolved = Math.min(solvedCount, todayTotal);
  const pct = (todaySolved / todayTotal) * 100;

  return (
    <View style={s.progressSection}>
      <View style={s.progressHeader}>
        <Text style={s.progressTitle}>오늘의 학습 진행도</Text>
        <Text style={s.progressText}>
          <Text style={s.highlightText}>{Math.round(pct)}%</Text> 달성
        </Text>
      </View>
      <View style={s.track}>
        <View style={[s.fill, { width: `${pct}%` }]} />
      </View>
      <Text style={s.progressDetail}>오늘 기준 {todayTotal}문제 중 {todaySolved}문제 완료</Text>
    </View>
  );
};

async function fetchDailyStatsWithFallback(): Promise<any[]> {
  const ranges = [180, 90, 30, 14, 7];
  for (const days of ranges) {
    try {
      const res = await apiClient.get(`/api/report/daily-stats?days=${days}`);
      const payload = extractApiData<any[]>(res.data);
      if (Array.isArray(payload)) return payload;
    } catch {
      // try smaller range
    }
  }
  return [];
}

export default function ReportPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isLoading: authLoading, isLoggedIn } = useAuth();

  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) {
      setReportData(DEFAULT);
      setLoading(false);
      return;
    }

    const fetch = async () => {
      try {
        setLoading(true);
        const data = { ...DEFAULT };

        const results = await Promise.allSettled([
          apiClient.get("/api/report/stats"),
          apiClient.get("/api/report/progress"),
        ]);

        if (results[0].status === "fulfilled") {
          const d = extractApiData<any>(results[0].value.data);
          data.maxConsecutiveDays = Number(d?.maxConsecutiveDays ?? d?.maxStreak ?? 0) || 0;
          data.perfectDays = Number(d?.perfectDays ?? d?.totalPerfectDays ?? 0) || 0;
        }

        if (results[1].status === "fulfilled") {
          const d = extractApiData<any>(results[1].value.data);
          data.solvedCount = Number(d?.solvedCount ?? 0) || 0;
          data.totalCount = Number(d?.totalCount ?? 0) || 0;
        }

        const dailyPayload = await fetchDailyStatsWithFallback();
        const dailyStats = Array.isArray(dailyPayload) ? dailyPayload : [];
        const freshMap = buildDailySliceMap(dailyStats);

        const mergedMap: Record<string, number> = { ...freshMap };
        try {
          await AsyncStorage.setItem(DAILY_SLICE_CACHE_KEY, JSON.stringify(mergedMap));
        } catch {}

        data.consecutiveDays = computeConsecutiveLearningDays(mergedMap);
        setReportData(data);
      } catch {
        setReportData(DEFAULT);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [authLoading, isLoggedIn]);

  if (loading) {
    return (
      <View style={[s.loadingContainer, { paddingTop: insets.top }]}> 
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!reportData) return null;

  return (
    <View style={s.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bgPrimary} />
      <View style={[s.header, { paddingTop: insets.top }]}>
        <Pressable onPress={() => router.back()} style={s.backButton}>
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </Pressable>
        <View style={s.headerTitleContainer}>
          <Text style={s.headerTitle}>리포트</Text>
          <Text style={s.headerSubtitle}>최근 학습 성과를 확인하세요</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView style={s.scrollView} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        <ReportStats
          consecutiveDays={reportData.consecutiveDays}
          maxConsecutiveDays={reportData.maxConsecutiveDays}
          perfectDays={reportData.perfectDays}
        />
        <ProgressBar solvedCount={reportData.solvedCount} totalCount={reportData.totalCount} />
        <DailyChart />
        <CategoryProgress />
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgPrimary },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.bgPrimary },
  header: {
    backgroundColor: COLORS.bgPrimary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
  },
  backButton: { width: 40, height: 40, justifyContent: "center", alignItems: "flex-start" },
  headerTitleContainer: { alignItems: "center" },
  headerTitle: { ...TYPO.h3, color: COLORS.textPrimary },
  headerSubtitle: { ...TYPO.caption, color: COLORS.textTertiary, marginTop: 2 },
  scrollView: { flex: 1, backgroundColor: COLORS.bgPrimary },
  scrollContent: { paddingBottom: 40, backgroundColor: COLORS.bgPrimary },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.xxl,
    gap: SPACING.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.bgCardElevated,
    borderRadius: RADIUS.card,
    paddingVertical: SPACING.lg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    ...SHADOWS.md,
  },
  statValue: { fontSize: 24, fontWeight: "800", color: COLORS.primaryLight, marginBottom: 4 },
  statLabel: { ...TYPO.caption, color: COLORS.textTertiary },
  progressSection: {
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.bgCardElevated,
    borderRadius: RADIUS.card,
    padding: SPACING.xxl,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    ...SHADOWS.md,
  },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: SPACING.md },
  progressTitle: { ...TYPO.label, color: COLORS.textPrimary },
  progressText: { ...TYPO.caption, color: COLORS.textTertiary },
  highlightText: { ...TYPO.button, color: COLORS.primaryLight },
  track: { height: 10, backgroundColor: COLORS.glass, borderRadius: 5, overflow: "hidden", marginBottom: SPACING.sm },
  fill: { height: "100%", backgroundColor: COLORS.primary, borderRadius: 5 },
  progressDetail: { ...TYPO.caption, color: COLORS.textPlaceholder, textAlign: "right" },
});
