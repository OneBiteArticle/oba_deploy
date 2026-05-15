import React, { useMemo, useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, G, Path, RadialGradient, Stop, Circle } from "react-native-svg";
import { COLORS, RADIUS, SHADOWS, SPACING, TYPO } from "../../../constants/theme";
import { apiClient } from "../../../src/api/apiClient";
import { useAuth } from "../../../src/auth/AuthContext";
import { buildDailySliceMap, clampSliceCount, extractApiData, toDateKey } from "../../../src/utils/learningStats";

const WEEKDAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];
const DAILY_SLICE_CACHE_KEY = "oba_daily_slice_map_cache";

function MiniPizza({ count, size = 30 }: { count: number; size?: number }) {
  const safe = clampSliceCount(count);
  const crustPath = "M 100 10 A 90 90 0 0 1 185.595 72.188 L 173.273 77.676 A 76 76 0 0 0 100 24 Z";
  const cheesePath = "M 100 100 L 100 24 A 76 76 0 0 1 173.273 77.676 Z";

  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Defs>
        <RadialGradient id="calendarCheese" cx="50%" cy="45%" r="70%">
          <Stop offset="0%" stopColor="#FFE9A6" />
          <Stop offset="100%" stopColor="#FFC94D" />
        </RadialGradient>
        <RadialGradient id="calendarPep" cx="40%" cy="40%" r="70%">
          <Stop offset="0%" stopColor="#FF7A59" />
          <Stop offset="100%" stopColor="#C62828" />
        </RadialGradient>
      </Defs>

      {Array.from({ length: safe }).map((_, i) => (
        <G key={i} originX={100} originY={100} rotation={72 * i}>
          <Path d={crustPath} fill="#E8A04B" stroke="#C97A22" strokeWidth={4} />
          <Path d={cheesePath} fill="url(#calendarCheese)" stroke="#E0A800" strokeWidth={4} />
          <Circle cx={126.5} cy={63.6} r={10} fill="url(#calendarPep)" stroke="#8E1B1B" strokeWidth={3} />
          <Circle cx={122} cy={58} r={2.8} fill="#FFF4CC" opacity={0.6} />
        </G>
      ))}
    </Svg>
  );
}

type DayCell = {
  date: Date;
  isCurrentMonth: boolean;
  solvedCount: number;
};

function formatMonth(date: Date) {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
}

function buildMonthCells(monthDate: Date, dailySliceMap: Record<string, number>): DayCell[] {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - startOffset);

  return Array.from({ length: 42 }).map((_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    const key = toDateKey(date);
    return {
      date,
      isCurrentMonth: date.getMonth() === monthDate.getMonth(),
      solvedCount: clampSliceCount(dailySliceMap[key] ?? 0),
    };
  });
}

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

export default function HistoryCalendarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isLoggedIn, isLoading: authLoading } = useAuth();

  const [cursorMonth, setCursorMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [dailySliceMap, setDailySliceMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    const fetchCalendar = async () => {
      try {
        if (!isLoggedIn) {
          setDailySliceMap({});
          return;
        }

        const payload = await fetchDailyStatsWithFallback();
        const stats = Array.isArray(payload) ? payload : [];
        const freshMap = buildDailySliceMap(stats);

        const mergedMap: Record<string, number> = { ...freshMap };
        try {
          await AsyncStorage.setItem(DAILY_SLICE_CACHE_KEY, JSON.stringify(mergedMap));
        } catch {}

        setDailySliceMap(mergedMap);
      } catch {
        try {
          const cachedRaw = await AsyncStorage.getItem(DAILY_SLICE_CACHE_KEY);
          const cachedMap = cachedRaw ? JSON.parse(cachedRaw) : {};
          if (cachedMap && typeof cachedMap === "object") {
            setDailySliceMap(cachedMap);
          } else {
            setDailySliceMap({});
          }
        } catch {
          setDailySliceMap({});
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCalendar();
  }, [authLoading, isLoggedIn]);

  const cells = useMemo(() => buildMonthCells(cursorMonth, dailySliceMap), [cursorMonth, dailySliceMap]);
  const today = new Date();

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.navRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>캘린더</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>학습 기록 캘린더</Text>
          <Text style={styles.cardSubtitle}>월별 학습 기록과 피자 진행 상태를 확인해보세요.</Text>

          <View style={styles.monthRow}>
            <TouchableOpacity
              style={styles.monthButton}
              onPress={() => setCursorMonth(new Date(cursorMonth.getFullYear(), cursorMonth.getMonth() - 1, 1))}
              activeOpacity={0.8}
            >
              <Ionicons name="chevron-back" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>{formatMonth(cursorMonth)}</Text>
            <TouchableOpacity
              style={styles.monthButton}
              onPress={() => setCursorMonth(new Date(cursorMonth.getFullYear(), cursorMonth.getMonth() + 1, 1))}
              activeOpacity={0.8}
            >
              <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekHeader}>
            {WEEKDAY_LABELS.map((label, index) => (
              <Text key={`${label}-${index}`} style={styles.weekLabel}>
                {label}
              </Text>
            ))}
          </View>

          {loading ? (
            <View style={styles.calendarLoading}>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          ) : (
            <View style={styles.grid}>
              {cells.map((cell, idx) => {
                const isToday =
                  cell.date.getFullYear() === today.getFullYear() &&
                  cell.date.getMonth() === today.getMonth() &&
                  cell.date.getDate() === today.getDate();

                return (
                  <View
                    key={`${cell.date.toISOString()}-${idx}`}
                    style={[
                      styles.dayCell,
                      !cell.isCurrentMonth && styles.dayCellMuted,
                      isToday && styles.dayCellToday,
                    ]}
                  >
                    <Text style={[styles.dayNumber, !cell.isCurrentMonth && styles.dayNumberMuted]}>
                      {cell.date.getDate()}
                    </Text>
                    {cell.solvedCount > 0 ? <MiniPizza count={cell.solvedCount} size={26} /> : <View style={styles.emptyDot} />}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgPrimary },
  content: { paddingHorizontal: SPACING.xxl },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.lg,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: {
    ...TYPO.h3,
    color: COLORS.textPrimary,
  },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xxl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    ...SHADOWS.md,
  },
  cardTitle: { ...TYPO.h2, color: COLORS.textPrimary },
  cardSubtitle: { ...TYPO.bodySm, color: COLORS.textTertiary, marginTop: 4, marginBottom: SPACING.lg },
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },
  monthButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.bgSecondary,
  },
  monthLabel: { ...TYPO.h3, color: COLORS.textPrimary },
  weekHeader: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekLabel: {
    flex: 1,
    textAlign: "center",
    ...TYPO.caption,
    color: COLORS.textTertiary,
    fontWeight: "700",
  },
  calendarLoading: {
    height: 220,
    alignItems: "center",
    justifyContent: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 8,
  },
  dayCell: {
    width: "14.2857%",
    aspectRatio: 0.82,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.bgCardElevated,
    position: "relative",
  },
  dayCellMuted: {
    opacity: 0.38,
  },
  dayCellToday: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySurface,
  },
  dayNumber: {
    ...TYPO.caption,
    color: COLORS.textSecondary,
    position: "absolute",
    top: 4,
    left: 6,
    fontWeight: "700",
  },
  dayNumberMuted: {
    color: COLORS.textPlaceholder,
  },
  emptyDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.textPlaceholder,
    opacity: 0.35,
  },
});
