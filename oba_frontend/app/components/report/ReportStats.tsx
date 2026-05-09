import { View, Text, StyleSheet } from "react-native";

/**
 * 리포트 통계 카드 컴포넌트
 * - 연속 학습일 (consecutiveDays)
 * - 최고 연속일 (maxConsecutiveDays)
 * - 완벽 학습일 (perfectDays)
 */
interface ReportStatsProps {
  consecutiveDays: number;
  maxConsecutiveDays: number;
  perfectDays: number;
}

export default function ReportStats({
  consecutiveDays = 0,
  maxConsecutiveDays = 0,
  perfectDays = 0,
}: ReportStatsProps) {
  return (
    <View style={styles.container}>
      <StatCard label="연속 학습일" value={consecutiveDays} />
      <StatCard label="최고 연속일" value={maxConsecutiveDays} />
      <StatCard label="완벽 학습일" value={perfectDays} />
    </View>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  label: {
    fontSize: 12,
    color: "#888",
    fontWeight: "500",
    marginBottom: 8,
  },
  value: {
    fontSize: 28,
    fontWeight: "700",
    color: "#222",
  },
});
