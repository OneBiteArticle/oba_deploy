import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiClient } from "../../../src/api/apiClient";
import { COLORS, RADIUS, SHADOWS, TYPO, SPACING } from "../../../constants/theme";
import { extractApiData, toDateKey } from "../../../src/utils/learningStats";

type HistoryItem = {
  articleId: string;
  title: string;
  summary: string;
  imageUrl: string;
  category: string;
  wrongAtRaw: string;
  wrongAtLabel: string;
  wrongAtTs: number;
};

const TXT_DATE_EMPTY = "\uB0A0\uC9DC \uC815\uBCF4 \uC5C6\uC74C";
const TXT_NO_TITLE = "\uC81C\uBAA9 \uC5C6\uC74C";
const TXT_ETC = "\uAE30\uD0C0";
const TXT_ERROR = "\uC624\uB958";
const TXT_FETCH_FAIL = "\uD2C0\uB9B0\uBB38\uC81C \uAE30\uB85D\uC744 \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.";
const TXT_PAGE_TITLE = "\uD2C0\uB9B0\uBB38\uC81C \uB2E4\uC2DC\uBCF4\uAE30";
const TXT_PAGE_SUBTITLE = "\uCD5C\uADFC\uC5D0 \uD2C0\uB9B0 \uBB38\uC81C\uB97C \uB2E4\uC2DC \uD559\uC2B5\uD574\uBCF4\uC138\uC694";
const TXT_SORT_NEW = "\uCD5C\uC2E0\uC21C";
const TXT_SORT_OLD = "\uC624\uB798\uB41C\uC21C";
const TXT_LOADING = "\uD2C0\uB9B0\uBB38\uC81C\uB97C \uBD88\uB7EC\uC624\uB294 \uC911...";
const TXT_EMPTY = "\uD2C0\uB9B0\uBB38\uC81C\uAC00 \uC544\uC9C1 \uC5C6\uC5B4\uC694";

function toTimestamp(value: unknown): number {
  if (!value) return 0;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return 0;
    return value > 1e12 ? value : value * 1000;
  }

  const raw = String(value).trim();
  if (!raw) return 0;

  if (/^\d{10,13}$/.test(raw)) {
    const num = Number(raw);
    if (Number.isFinite(num)) return raw.length === 13 ? num : num * 1000;
  }

  if (/^\d{4}\.\d{2}\.\d{2}$/.test(raw)) {
    const normalized = raw.replace(/\./g, "-");
    const ts = new Date(`${normalized}T00:00:00+09:00`).getTime();
    return Number.isFinite(ts) ? ts : 0;
  }

  const n = new Date(raw).getTime();
  if (Number.isFinite(n)) return n;

  const fallback = raw.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(fallback)) {
    const ts = new Date(`${fallback}T00:00:00+09:00`).getTime();
    return Number.isFinite(ts) ? ts : 0;
  }

  return 0;
}

function formatWrongDate(value: unknown): string {
  const ts = toTimestamp(value);
  if (!ts) return TXT_DATE_EMPTY;
  const key = toDateKey(new Date(ts));
  const [y, m, d] = key.split("-");
  return `${y}.${m}.${d}`;
}

function pickWrongDate(item: any): string {
  const firstLevel =
    item?.wrongAt ??
    item?.wrongDate ??
    item?.incorrectAt ??
    item?.incorrectedAt ??
    item?.submittedAt ??
    item?.submitted_at ??
    item?.wrong_at ??
    item?.solvedAt ??
    item?.solved_at ??
    item?.createdAt ??
    item?.created_at ??
    item?.servingDate ??
    item?.date ??
    "";

  if (firstLevel) return String(firstLevel);

  const nestedKeys = [
    "wrongQuizzes",
    "wrongQuizList",
    "incorrectQuizzes",
    "incorrectQuizList",
    "wrongAnswers",
    "quizResults",
  ];

  for (const key of nestedKeys) {
    const arr = item?.[key];
    if (!Array.isArray(arr) || arr.length === 0) continue;

    const nestedDates = arr
      .map(
        (entry: any) =>
          entry?.wrongAt ??
          entry?.wrongDate ??
          entry?.incorrectAt ??
          entry?.submittedAt ??
          entry?.submitted_at ??
          entry?.createdAt ??
          entry?.created_at ??
          entry?.wrong_at ??
          entry?.wrongDateTime ??
          entry?.solvedAt ??
          entry?.date ??
          ""
      )
      .filter(Boolean)
      .map((v: any) => String(v));

    if (nestedDates.length > 0) {
      nestedDates.sort((a, b) => toTimestamp(b) - toTimestamp(a));
      return nestedDates[0];
    }
  }

  const fallback = item?.createdAt ?? item?.created_at ?? "";
  return String(fallback || "");
}

export default function WrongArticlesPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const fetchHistory = async () => {
    try {
      const res = await apiClient.get("/api/my/wrong");
      const payload = extractApiData<any[]>(res.data);
      const list = Array.isArray(payload) ? payload : [];

      const normalized: HistoryItem[] = list.map((item: any, idx: number) => {
        const articleId = String(item.articleId ?? item.id ?? item.article_id ?? `unknown-${idx}`);
        const wrongAtRaw = pickWrongDate(item);

        return {
          articleId,
          title: String(item.title ?? item.articleTitle ?? TXT_NO_TITLE),
          summary: String(item.summary ?? ""),
          imageUrl: String(item.imageUrl ?? item.thumbnailUrl ?? ""),
          category: String(item.category ?? item.categoryName ?? item.domain ?? TXT_ETC),
          wrongAtRaw,
          wrongAtLabel: formatWrongDate(wrongAtRaw),
          wrongAtTs: toTimestamp(wrongAtRaw),
        };
      });

      setHistoryData(normalized);

      const uniqueCategories = Array.from(
        new Set(normalized.map((h) => h.category).filter((c) => Boolean(c && c.trim())))
      );
      setCategories(["All", ...uniqueCategories]);
    } catch (e) {
      console.error("\uD2C0\uB9B0\uBB38\uC81C \uAE30\uB85D \uC870\uD68C \uC2E4\uD328:", e);
      Alert.alert(TXT_ERROR, TXT_FETCH_FAIL);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const filteredData = historyData
    .filter((h) => selectedCategory === "All" || h.category === selectedCategory)
    .sort((a, b) => {
      const at = a.wrongAtTs || 0;
      const bt = b.wrongAtTs || 0;
      return sortOrder === "newest" ? bt - at : at - bt;
    });

  const renderHeader = () => (
    <View style={[s.headerSection, { paddingTop: insets.top }]}>
      <TouchableOpacity onPress={() => router.back()} style={s.backRow}>
        <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
      </TouchableOpacity>

      <View style={s.titleBlock}>
        <Text style={s.pageTitle}>{TXT_PAGE_TITLE}</Text>
        <Text style={s.pageSubtitle}>{TXT_PAGE_SUBTITLE}</Text>
      </View>

      <View style={s.filterBar}>
        <FlatList
          data={categories}
          horizontal
          keyExtractor={(c, idx) => `${c}-${idx}`}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[s.chip, selectedCategory === item && s.chipActive]}
              onPress={() => setSelectedCategory(item)}
            >
              <Text style={[s.chipText, selectedCategory === item && s.chipTextActive]}>{item}</Text>
            </TouchableOpacity>
          )}
        />

        <TouchableOpacity style={s.sortBtn} onPress={() => setSortOrder((o) => (o === "newest" ? "oldest" : "newest"))}>
          <Ionicons name={sortOrder === "newest" ? "arrow-down" : "arrow-up"} size={18} color={COLORS.primaryLight} />
          <Text style={s.sortText}>{sortOrder === "newest" ? TXT_SORT_NEW : TXT_SORT_OLD}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderItem = ({ item }: { item: HistoryItem }) => (
    <View style={s.timelineItem}>
      <View style={s.timelineLeft}>
        <View style={s.line} />
        <View style={s.dot} />
      </View>
      <View style={s.timelineRight}>
        <Text style={s.dateText}>{item.wrongAtLabel}</Text>
        <TouchableOpacity style={s.articleCard} onPress={() => router.push(`/article/${encodeURIComponent(item.articleId)}?retry=true`)}>
          <Text style={s.articleTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={s.articleCategory}>{item.category}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[s.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={s.loadingText}>{TXT_LOADING}</Text>
      </View>
    );
  }

  return (
    <View style={s.screen}>
      <FlatList
        data={filteredData}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.articleId}-${item.wrongAtRaw || "none"}-${index}`}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />}
        ListEmptyComponent={
          <View style={s.emptyContainer}>
            <Text style={s.emptyText}>{TXT_EMPTY}</Text>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgPrimary },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: SPACING.md, ...TYPO.bodySm, color: COLORS.textTertiary },
  listContent: { paddingBottom: 40 },
  headerSection: { paddingHorizontal: SPACING.xl, paddingBottom: SPACING.xxl },
  backRow: { width: 28, alignItems: "flex-start", marginBottom: SPACING.lg },
  titleBlock: { marginBottom: SPACING.lg },
  pageTitle: { ...TYPO.h1, color: COLORS.textPrimary, marginBottom: 4 },
  pageSubtitle: { ...TYPO.bodySm, color: COLORS.textTertiary },
  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: SPACING.sm,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: COLORS.glass,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginRight: SPACING.sm,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { ...TYPO.caption, color: COLORS.textSecondary },
  chipTextActive: { ...TYPO.caption, color: "#FFFFFF", fontWeight: "700" },
  sortBtn: { flexDirection: "row", alignItems: "center", padding: SPACING.sm, marginLeft: SPACING.sm },
  sortText: { marginLeft: 6, ...TYPO.caption, color: COLORS.primaryLight, fontWeight: "600" },
  timelineItem: { flexDirection: "row", paddingHorizontal: SPACING.xxl },
  timelineLeft: { width: 32, alignItems: "center", marginRight: SPACING.md },
  line: { position: "absolute", top: 0, bottom: 0, width: 2, backgroundColor: COLORS.glassBorder },
  dot: {
    marginTop: 24,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.primary,
    borderWidth: 3,
    borderColor: COLORS.bgPrimary,
    zIndex: 1,
  },
  timelineRight: { flex: 1, paddingBottom: 28 },
  dateText: { ...TYPO.label, color: COLORS.textTertiary, marginBottom: SPACING.sm },
  articleCard: {
    backgroundColor: COLORS.bgCardElevated,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    ...SHADOWS.sm,
  },
  articleTitle: { ...TYPO.label, color: COLORS.textPrimary, marginBottom: SPACING.sm, lineHeight: 22 },
  articleCategory: { ...TYPO.caption, fontWeight: "600", color: COLORS.primaryLight },
  emptyContainer: { alignItems: "center", marginTop: 60 },
  emptyText: { ...TYPO.body, color: COLORS.textTertiary },
});



