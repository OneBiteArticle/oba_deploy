import { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  Animated,
  useWindowDimensions,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Link, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiClient } from "../../src/api/apiClient";
import PizzaMenu from "../components/PizzaMenu";
import HomeHeader from "../components/HomeHeader";
import { COLORS, SHADOWS, TYPO, SPACING, RADIUS } from "../../constants/theme";
import {
  buildDailySliceMap,
  buildRecentWeekSliceCounts,
  computeConsecutiveLearningDays,
  extractApiData,
  toDateKey,
} from "../../src/utils/learningStats";

interface ArticleSummary {
  articleId: string;
  title: string;
  summaryBullets?: string[];
  thumbnailUrl?: string;
  servingDate?: string;
  isSolved?: boolean;
}

interface UserProfile {
  nickname: string;
  profileImage: string;
}

const DAILY_SLICE_CACHE_KEY = "oba_daily_slice_map_cache";

function extractImageFromContent(content: string[]): string | null {
  if (!content) return null;
  for (const line of content) {
    if (line.startsWith("<img>")) return line.replace("<img>", "");
  }
  return null;
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

export default function Home() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const scrollX = useRef(new Animated.Value(0)).current;
  const hasLoadedOnce = useRef(false);

  const CARD_WIDTH = width * 0.82;
  const CARD_HEIGHT = Math.min(height * 0.48, 460);
  const SIDE_SPACING = (width - CARD_WIDTH) / 2;
  const SNAP_INTERVAL = CARD_WIDTH + 14;

  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [streak, setStreak] = useState(0);
  const [daySliceCounts, setDaySliceCounts] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [daySliceMap, setDaySliceMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);

    try {
      try {
        const articlesRes = await apiClient.get("/api/articles/latest?limit=10");
        const rawData = extractApiData<any[]>(articlesRes.data);
        const rawList = Array.isArray(rawData) ? rawData : [];

        let articleList: ArticleSummary[] = rawList
          .map((a: any) => ({
            ...a,
            articleId: String(a.articleId ?? a.id ?? a.article_id ?? ""),
            servingDate: a.servingDate ?? a.serving_date ?? a.date,
          }))
          .filter((a: ArticleSummary) => Boolean(a.articleId));

        const today = toDateKey(new Date());
        const todayArticles = articleList.filter((a) => a.servingDate === today);
        articleList = todayArticles.length > 0 ? todayArticles.slice(0, 5) : articleList.slice(0, 5);

        const articlesWithImages = await Promise.all(
          articleList.map(async (article) => {
            try {
              const detailRes = await apiClient.get(`/api/articles/${encodeURIComponent(article.articleId)}`);
              const detailData = extractApiData<any>(detailRes.data);
              const imageUrl = extractImageFromContent(detailData?.content || []);
              const myQuizResults = Array.isArray(detailData?.myQuizResults) ? detailData.myQuizResults : [];
              const isSolved = myQuizResults.some((v: any) => v === true || v === false);
              return { ...article, thumbnailUrl: imageUrl || undefined, isSolved };
            } catch {
              return { ...article, isSolved: false };
            }
          })
        );

        setArticles(articlesWithImages);
      } catch {
        setArticles([]);
      }

      let profileStreakFallback = 0;

      try {
        const profileRes = await apiClient.get("/api/users/me");
        const profileData = extractApiData<any>(profileRes.data);

        const nicknameRaw = profileData.nickname ?? profileData.displayName ?? profileData.name ?? "";
        const nickname = String(nicknameRaw).trim() || "학습자님";

        const localPicture = await AsyncStorage.getItem("oba_local_profile_picture");
        const picture = localPicture || profileData.picture || "";

        setUserProfile({ nickname, profileImage: picture });

        const weeklySliceCounts =
          profileData.weeklySliceCounts ??
          profileData.daySliceCounts ??
          profileData.weeklySolvedCounts;

        const toCount = (value: unknown) => {
          const n = Number(value);
          if (Number.isFinite(n)) return Math.max(0, Math.min(5, Math.trunc(n)));
          return value ? 1 : 0;
        };

        if (Array.isArray(weeklySliceCounts)) {
          const normalized = weeklySliceCounts.slice(0, 7).map(toCount);
          while (normalized.length < 7) normalized.push(0);
          setDaySliceCounts(normalized);

          const todayMonFirstIndex = (new Date().getDay() + 6) % 7;
          let localStreak = 0;
          for (let offset = 0; offset < 7; offset += 1) {
            const idx = (todayMonFirstIndex - offset + 7) % 7;
            if ((normalized[idx] ?? 0) > 0) {
              localStreak += 1;
            } else {
              break;
            }
          }
          profileStreakFallback = localStreak;
        }

        setStreak(profileStreakFallback);

        await AsyncStorage.setItem(
          "oba_cached_profile",
          JSON.stringify({ nickname, picture })
        );
      } catch {
        try {
          const cached = await AsyncStorage.getItem("oba_cached_profile");
          const localPicture = await AsyncStorage.getItem("oba_local_profile_picture");
          if (cached) {
            const p = JSON.parse(cached);
            setUserProfile({
              nickname: String(p?.nickname ?? "").trim() || "학습자님",
              profileImage: localPicture || p.picture || "",
            });
          } else {
            setUserProfile({ nickname: "학습자님", profileImage: "" });
          }
        } catch {
          setUserProfile({ nickname: "학습자님", profileImage: "" });
        }
      }

      try {
        const dailyPayload = await fetchDailyStatsWithFallback();
        const dailyStats = Array.isArray(dailyPayload) ? dailyPayload : [];
        const freshMap = buildDailySliceMap(dailyStats);

        const mergedMap: Record<string, number> = { ...freshMap };
        try {
          await AsyncStorage.setItem(DAILY_SLICE_CACHE_KEY, JSON.stringify(mergedMap));
        } catch {}

        setDaySliceMap(mergedMap);
        setDaySliceCounts(buildRecentWeekSliceCounts(mergedMap));
        setStreak(computeConsecutiveLearningDays(mergedMap));
      } catch {
        try {
          const cachedRaw = await AsyncStorage.getItem(DAILY_SLICE_CACHE_KEY);
          const cachedMap = cachedRaw ? JSON.parse(cachedRaw) : {};
          if (cachedMap && typeof cachedMap === "object") {
            setDaySliceMap(cachedMap);
            setDaySliceCounts(buildRecentWeekSliceCounts(cachedMap));
            setStreak(computeConsecutiveLearningDays(cachedMap));
          } else {
            setStreak(profileStreakFallback);
          }
        } catch {
          setStreak(profileStreakFallback);
        }
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const showLoading = !hasLoadedOnce.current;
      fetchData(showLoading);
      hasLoadedOnce.current = true;
    }, [fetchData])
  );

  if (loading) {
    return (
      <View style={[s.loadingContainer, { paddingTop: insets.top }]}> 
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={s.loadingText}>기사를 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={[s.screen, { paddingTop: insets.top + 4 }]}> 
      {userProfile && (
        <HomeHeader
          user={userProfile}
          streak={streak}
          daySliceCounts={daySliceCounts}
          daySliceMap={daySliceMap}
        />
      )}

      <View style={{ flex: 1 }}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>오늘의 기사</Text>
          <Text style={s.sectionSub}>{`${articles.length}개의 기사를 확인하세요`}</Text>
        </View>

        {articles.length === 0 ? (
          <View style={s.emptyContainer}>
            <Image source={require("../../assets/knight/hand.png")} style={s.emptyImage} resizeMode="contain" />
            <Text style={s.emptyTitle}>오늘 제공된 기사가 없어요</Text>
            <Text style={s.emptyDate}>{`(${new Date().toLocaleDateString()} 기준)`}</Text>
          </View>
        ) : (
          <Animated.ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToOffsets={articles.map((_, i) => i * SNAP_INTERVAL)}
            snapToAlignment="start"
            decelerationRate="fast"
            disableIntervalMomentum
            scrollEventThrottle={16}
            contentContainerStyle={{ paddingHorizontal: SIDE_SPACING }}
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
              useNativeDriver: true,
            })}
          >
            {articles.map((item, i) => {
              const inputRange = [(i - 1) * SNAP_INTERVAL, i * SNAP_INTERVAL, (i + 1) * SNAP_INTERVAL];
              const scale = scrollX.interpolate({
                inputRange,
                outputRange: [0.93, 1, 0.93],
                extrapolate: "clamp",
              });
              const opacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.5, 1, 0.5],
                extrapolate: "clamp",
              });
              const summaryText =
                item.summaryBullets && item.summaryBullets.length > 0
                  ? item.summaryBullets
                      .slice(0, 3)
                      .map((b) => `• ${b}`)
                      .join("\n")
                  : "";

              return (
                <Link key={i} href={`/article/${encodeURIComponent(item.articleId)}`} asChild>
                  <Pressable>
                    <Animated.View
                      style={[
                        s.card,
                        {
                          width: CARD_WIDTH,
                          height: CARD_HEIGHT,
                          transform: [{ scale }],
                          opacity,
                        },
                      ]}
                    >
                      <View style={s.cardImageWrapper}>
                        <Image
                          source={
                            item.thumbnailUrl
                              ? { uri: item.thumbnailUrl }
                              : require("../../assets/knight/deliever.png")
                          }
                          style={s.cardImage}
                          resizeMode="cover"
                        />
                        <View style={s.cardBadge}>
                          <Text style={s.cardBadgeText}>
                            {i + 1} / {articles.length}
                          </Text>
                        </View>
                      </View>
                      <View style={s.cardContent}>
                        <Text style={s.cardTitle} numberOfLines={2}>
                          {item.title}
                        </Text>
                        {summaryText ? (
                          <Text style={s.cardSummary} numberOfLines={3}>
                            {summaryText}
                          </Text>
                        ) : null}
                        <View style={s.cardFooter}>
                          <Text style={s.cardReadBtn}>읽기 →</Text>
                        </View>
                      </View>
                      {item.isSolved ? <View pointerEvents="none" style={s.solvedDim} /> : null}
                      {item.isSolved ? (
                        <Image
                          source={require("../../assets/knight/toggle_2.png")}
                          style={s.solvedBadge}
                          resizeMode="contain"
                        />
                      ) : null}
                    </Animated.View>
                  </Pressable>
                </Link>
              );
            })}
          </Animated.ScrollView>
        )}
      </View>

      <PizzaMenu />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgPrimary },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.bgPrimary },
  loadingText: { marginTop: SPACING.md, ...TYPO.bodySm, color: COLORS.textTertiary },

  sectionHeader: { paddingHorizontal: SPACING.xxl, marginBottom: SPACING.lg },
  sectionTitle: { ...TYPO.h1, color: COLORS.textPrimary },
  sectionSub: { ...TYPO.caption, color: COLORS.textTertiary, marginTop: 2 },

  emptyContainer: { alignItems: "center", marginTop: 50, paddingHorizontal: 40 },
  emptyImage: { width: 100, height: 100, marginBottom: 10, opacity: 0.3 },
  emptyTitle: { ...TYPO.body, color: COLORS.textTertiary },
  emptyDate: { ...TYPO.caption, color: COLORS.textPlaceholder },

  card: {
    backgroundColor: COLORS.bgCardElevated,
    borderRadius: RADIUS.xxl,
    marginRight: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    ...SHADOWS.lg,
  },
  cardImageWrapper: { height: "45%", backgroundColor: COLORS.bgSecondary, position: "relative" },
  cardImage: { width: "100%", height: "100%" },
  cardBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(255,255,255,0.85)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  cardBadgeText: { ...TYPO.caption, color: COLORS.textPrimary, fontWeight: "600" },
  cardContent: { padding: SPACING.xl, flex: 1, justifyContent: "space-between" },
  cardTitle: { ...TYPO.h3, color: COLORS.textPrimary, lineHeight: 26 },
  cardSummary: { ...TYPO.bodySm, color: COLORS.textTertiary, lineHeight: 20, marginTop: SPACING.sm },
  cardFooter: { flexDirection: "row", justifyContent: "flex-end", marginTop: SPACING.sm },
  cardReadBtn: { ...TYPO.label, color: COLORS.primaryLight },
  solvedDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.16)",
  },
  solvedBadge: {
    position: "absolute",
    left: 14,
    bottom: 12,
    width: 60,
    height: 60,
  },
});






