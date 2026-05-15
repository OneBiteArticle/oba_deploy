import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, Animated, PanResponder } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Svg, { Defs, G, Path, RadialGradient, Stop, Circle } from "react-native-svg";
import { COLORS, RADIUS, SHADOWS, TYPO, SPACING } from "../../constants/theme";
import { clampSliceCount, toDateKey } from "../../src/utils/learningStats";

interface HomeHeaderProps {
  user: { nickname: string; profileImage: string };
  streak: number;
  daySliceCounts?: number[];
  daySliceMap?: Record<string, number>;
}

const WEEKDAYS = ["\uC6D4", "\uD654", "\uC218", "\uBAA9", "\uAE08", "\uD1A0", "\uC77C"];
const TXT_NICKNAME_FALLBACK = "\uD559\uC2B5\uC790\uB2D8";
const TXT_STREAK_PREFIX = "\uC5F0\uC18D \uD559\uC2B5";
const TXT_STREAK_SUFFIX = "\uC77C";
const TXT_CALENDAR = "\uCE98\uB9B0\uB354";
const TXT_SWIPE_HINT = "\uC88C\uC6B0\uB85C \uC2A4\uC640\uC774\uD504\uD574 \uB0A0\uC9DC\uB97C \uD655\uC778\uD574\uBCF4\uC138\uC694";

const SHOW_CALENDAR_BUTTON = true;

const DAY_SIZE = 44;
const DAY_GAP = 10;
const DAYS_BEFORE_TODAY = 14;
const DAYS_AFTER_TODAY = 7;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getWeekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

function MiniPizza({ count, size = DAY_SIZE + 8 }: { count: number; size?: number }) {
  const safe = clampSliceCount(count);
  const crustPath = "M 100 10 A 90 90 0 0 1 185.595 72.188 L 173.273 77.676 A 76 76 0 0 0 100 24 Z";
  const cheesePath = "M 100 100 L 100 24 A 76 76 0 0 1 173.273 77.676 Z";

  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Defs>
        <RadialGradient id="miniCheese" cx="50%" cy="45%" r="70%">
          <Stop offset="0%" stopColor="#FFE9A6" />
          <Stop offset="100%" stopColor="#FFC94D" />
        </RadialGradient>
        <RadialGradient id="miniPep" cx="40%" cy="40%" r="70%">
          <Stop offset="0%" stopColor="#FF7A59" />
          <Stop offset="100%" stopColor="#C62828" />
        </RadialGradient>
      </Defs>

      {Array.from({ length: safe }).map((_, i) => (
        <G key={i} originX={100} originY={100} rotation={72 * i}>
          <Path d={crustPath} fill="#E8A04B" stroke="#C97A22" strokeWidth={4} />
          <Path d={cheesePath} fill="url(#miniCheese)" stroke="#E0A800" strokeWidth={4} />
          <Circle cx={126.5} cy={63.6} r={10} fill="url(#miniPep)" stroke="#8E1B1B" strokeWidth={3} />
          <Circle cx={122} cy={58} r={2.8} fill="#FFF4CC" opacity={0.6} />
        </G>
      ))}
    </Svg>
  );
}

export default function HomeHeader({ user, streak, daySliceCounts, daySliceMap }: HomeHeaderProps) {
  const router = useRouter();
  const translateX = useRef(new Animated.Value(0)).current;
  const [viewportWidth, setViewportWidth] = useState(0);

  const avatarSource = user.profileImage
    ? { uri: user.profileImage }
    : require("../../assets/knight/basic_profile.png");

  const safeNickname = (user.nickname ?? "").trim() || TXT_NICKNAME_FALLBACK;
  const safeStreak = Number.isFinite(Number(streak)) ? Math.max(0, Math.trunc(Number(streak))) : 0;

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const rollingDays = useMemo(() => {
    const items = Array.from({ length: DAYS_BEFORE_TODAY + DAYS_AFTER_TODAY + 1 }).map((_, idx) => {
      const offset = idx - DAYS_BEFORE_TODAY;
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + offset);

      const dateKey = toDateKey(targetDate);
      const weekdayIndex = getWeekdayIndex(targetDate);
      const fromDateMap = clampSliceCount(daySliceMap?.[dateKey] ?? 0);
      const sliceCount = offset > 0 ? 0 : fromDateMap;

      return {
        key: `${dateKey}-${idx}`,
        dayLabel: WEEKDAYS[weekdayIndex],
        sliceCount,
        isToday: offset === 0,
      };
    });

    return items;
  }, [daySliceMap, today]);

  const rowWidth = rollingDays.length * DAY_SIZE + (rollingDays.length - 1) * DAY_GAP;
  const safeViewportWidth = viewportWidth > 0 ? viewportWidth : DAY_SIZE * 3.5 + DAY_GAP * 2.5;
  const maxDrag = Math.max(42, (rowWidth - safeViewportWidth) / 2);

  const snapBack = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      speed: 18,
      bounciness: 6,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => {
        const dx = Math.abs(gesture.dx);
        const dy = Math.abs(gesture.dy);
        return dx > 4 && dx > dy;
      },
      onPanResponderMove: (_, gesture) => {
        translateX.setValue(clamp(gesture.dx, -maxDrag, maxDrag));
      },
      onPanResponderRelease: () => snapBack(),
      onPanResponderTerminate: () => snapBack(),
    })
  ).current;

  const baseRowOffset =
    safeViewportWidth / 2 - DAY_SIZE / 2 - DAYS_BEFORE_TODAY * (DAY_SIZE + DAY_GAP);

  useEffect(() => {
    translateX.setValue(0);
  }, [daySliceCounts, daySliceMap, translateX]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.profileInfo}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={() => router.push("/(tabs)/my")}
              activeOpacity={0.8}
            >
              <Image source={avatarSource} style={styles.avatar} />
            </TouchableOpacity>

            <View style={styles.textContainer}>
              <TouchableOpacity style={styles.nicknameRow} onPress={() => router.push("/(tabs)/my")} activeOpacity={0.8}>
                <Text style={styles.nickname} numberOfLines={1}>{safeNickname}</Text>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
              </TouchableOpacity>

              <View style={styles.metaRow}>
                <View style={styles.streakBadge}>
                  <Text style={styles.streakText}>{`${TXT_STREAK_PREFIX} ${safeStreak}${TXT_STREAK_SUFFIX}`}</Text>
                </View>

                {SHOW_CALENDAR_BUTTON ? (
                  <TouchableOpacity
                    style={styles.calendarButton}
                    onPress={() => router.push("/(tabs)/history")}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="calendar-outline" size={15} color={COLORS.textSecondary} style={styles.calendarIcon} />
                    <Text style={styles.calendarButtonText}>{TXT_CALENDAR}</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.daysCarouselWrap}>
          <View style={styles.daysHintRow}>
            <Ionicons name="swap-horizontal" size={12} color={COLORS.textPlaceholder} style={styles.daysHintIcon} />
            <Text style={styles.daysHintText}>{TXT_SWIPE_HINT}</Text>
          </View>

          <View
            style={styles.daysViewport}
            onLayout={(e) => setViewportWidth(e.nativeEvent.layout.width)}
            {...panResponder.panHandlers}
          >
            <Animated.View
              style={[
                styles.daysRow,
                {
                  marginLeft: baseRowOffset,
                  transform: [{ translateX }],
                },
              ]}
            >
              {rollingDays.map((item, index) => (
                <View key={item.key} style={[styles.daySlot, index === rollingDays.length - 1 && styles.daySlotLast]}>
                  <View style={[styles.dayCircle, item.isToday && styles.todayCircle]}>
                    {item.sliceCount > 0 ? (
                      <MiniPizza count={item.sliceCount} />
                    ) : (
                      <Text style={[styles.dayText, item.isToday && styles.todayDayText]}>{item.dayLabel}</Text>
                    )}
                  </View>
                </View>
              ))}
            </Animated.View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: SPACING.xl, marginBottom: SPACING.xxl },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    ...SHADOWS.md,
  },
  topRow: { marginBottom: SPACING.lg, minHeight: 82 },
  profileInfo: { flexDirection: "row", alignItems: "center", flex: 1, minWidth: 0 },
  avatarContainer: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: COLORS.bgSecondary,
    padding: 2,
    marginRight: SPACING.lg,
    marginTop: 1,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: `${COLORS.primary}45`,
  },
  avatar: { width: "100%", height: "100%", borderRadius: 37, resizeMode: "cover" },
  textContainer: { flex: 1, justifyContent: "center", paddingRight: 2, minWidth: 0, alignSelf: "stretch" },
  nicknameRow: { flexDirection: "row", alignItems: "center" },
  nickname: { ...TYPO.h2, color: COLORS.textPrimary, marginRight: 4, flexShrink: 1, includeFontPadding: false },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    flexWrap: "wrap",
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bgSecondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: `${COLORS.primary}20`,
    marginRight: 8,
    marginBottom: 4,
  },
  streakText: { ...TYPO.caption, fontWeight: "700", color: COLORS.textSecondary, includeFontPadding: false },
  calendarButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bgSecondary,
    borderWidth: 1,
    borderColor: `${COLORS.primary}20`,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    marginBottom: 4,
  },
  calendarIcon: { marginRight: 4 },
  calendarButtonText: { ...TYPO.caption, color: COLORS.textSecondary, fontWeight: "700", includeFontPadding: false },

  daysCarouselWrap: { marginTop: 2, width: "100%" },
  daysHintRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  daysHintIcon: { marginRight: 4 },
  daysHintText: {
    ...TYPO.caption,
    color: COLORS.textPlaceholder,
    fontWeight: "600",
  },
  daysViewport: {
    width: "100%",
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.bgSecondary,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingVertical: 8,
    overflow: "hidden",
    alignItems: "flex-start",
    justifyContent: "center",
  },
  daysRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  daySlot: {
    width: DAY_SIZE,
    height: DAY_SIZE,
    marginRight: DAY_GAP,
  },
  daySlotLast: {
    marginRight: 0,
  },
  dayCircle: {
    width: DAY_SIZE,
    height: DAY_SIZE,
    borderRadius: DAY_SIZE / 2,
    backgroundColor: COLORS.bgCardElevated,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  todayCircle: {
    backgroundColor: COLORS.bgSecondary,
    borderWidth: 1.5,
    borderColor: `${COLORS.primary}45`,
    transform: [{ scale: 1.06 }],
  },
  dayText: { ...TYPO.label, color: COLORS.textTertiary },
  todayDayText: { color: COLORS.primary, fontWeight: "700" },
});


