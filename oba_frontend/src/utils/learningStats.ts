export type DailyStatLike = {
  date?: string;
  attemptedQuizzes?: number;
  correctQuizzes?: number;
  solvedCount?: number;
  solvedArticles?: number;
  articleCount?: number;
};

const KST_OFFSET_HOURS = 9;
const KST_OFFSET_MS = KST_OFFSET_HOURS * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export function extractApiData<T = any>(payload: any): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return payload.data as T;
  }
  return payload as T;
}

export function clampSliceCount(value: unknown): number {
  const n = Number(value);
  if (Number.isFinite(n)) return Math.max(0, Math.min(5, Math.trunc(n)));
  return 0;
}

export function toDateKey(date: Date): string {
  // Always use Korea Standard Time (UTC+9).
  const kst = new Date(date.getTime() + KST_OFFSET_MS);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const d = String(kst.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toLocalDateKey(raw?: string): string | null {
  if (!raw) return null;
  const source = String(raw).trim();
  if (!source) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(source)) {
    return source;
  }

  if (/^\d{4}\.\d{2}\.\d{2}$/.test(source)) {
    return source.replace(/\./g, "-");
  }

  if (/^\d{4}\/\d{2}\/\d{2}$/.test(source)) {
    return source.replace(/\//g, "-");
  }

  const parsed = new Date(source);
  if (!Number.isNaN(parsed.getTime())) {
    return toDateKey(parsed);
  }

  const fallback = source.slice(0, 10).replace(/\./g, "-").replace(/\//g, "-");
  return /^\d{4}-\d{2}-\d{2}$/.test(fallback) ? fallback : null;
}

function firstFiniteNumber(...values: unknown[]): number | null {
  for (const value of values) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

export function countFromDailyStat(stat: DailyStatLike): number {
  // Product rule: pizza slice count == solved quiz count.
  // Use only explicit quiz-correct fields from daily-stats.
  // IMPORTANT: do not read generic `solvedCount` here (it may represent other aggregates).
  const attemptedQuizzes = firstFiniteNumber(
    stat.attemptedQuizzes,
    (stat as any).attemptedQuizCount,
    (stat as any).attemptedCount,
    (stat as any).solvedQuizAttemptedCount,
  );

  const quizSolved = firstFiniteNumber(
    stat.correctQuizzes,
    (stat as any).correctQuizCount,
    (stat as any).correctCount,
    (stat as any).solvedQuizCount,
    (stat as any).quizSolvedCount,
    (stat as any).solvedProblemCount,
  );

  if (quizSolved != null) {
    const bounded = attemptedQuizzes != null ? Math.min(quizSolved, attemptedQuizzes) : quizSolved;
    return clampSliceCount(bounded);
  }

  if (attemptedQuizzes != null) return clampSliceCount(attemptedQuizzes);

  return 0;
}

export function buildDailySliceMap(stats: DailyStatLike[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const stat of stats ?? []) {
    const key = toLocalDateKey(stat?.date);
    if (!key) continue;

    const next = countFromDailyStat(stat);
    map[key] = clampSliceCount(Math.max(map[key] ?? 0, next));
  }
  return map;
}

export function computeConsecutiveLearningDays(
  dailySliceMap: Record<string, number>,
  fromDate: Date = new Date()
): number {
  const pivotKstStart = Math.floor((fromDate.getTime() + KST_OFFSET_MS) / DAY_MS) * DAY_MS;

  let streak = 0;
  let cursor = pivotKstStart;

  for (;;) {
    const key = toDateKey(new Date(cursor - KST_OFFSET_MS));
    const count = clampSliceCount(dailySliceMap[key] ?? 0);
    if (count <= 0) break;
    streak += 1;
    cursor -= DAY_MS;
  }

  return streak;
}

export function buildRecentWeekSliceCounts(
  dailySliceMap: Record<string, number>,
  today: Date = new Date()
): number[] {
  const mondayFirst: number[] = new Array(7).fill(0);
  let cursor = Math.floor((today.getTime() + KST_OFFSET_MS) / DAY_MS) * DAY_MS;

  for (let i = 0; i < 7; i += 1) {
    const dateInKst = new Date(cursor - KST_OFFSET_MS);
    const key = toDateKey(dateInKst);
    const weekdayMonFirst = (dateInKst.getDay() + 6) % 7;
    mondayFirst[weekdayMonFirst] = clampSliceCount(dailySliceMap[key] ?? 0);
    cursor -= DAY_MS;
  }

  return mondayFirst;
}
