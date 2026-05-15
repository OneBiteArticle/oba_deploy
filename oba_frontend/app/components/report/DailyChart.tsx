import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, LayoutChangeEvent } from "react-native";
import Svg, { Path, Circle, Line } from "react-native-svg";
import { apiClient } from "../../../src/api/apiClient";
import { COLORS, RADIUS, SHADOWS, TYPO, SPACING } from "../../../constants/theme";
import { extractApiData } from "../../../src/utils/learningStats";

export interface DailyData {
  date?: string;
  day: string;
  accuracy: number;
  attemptedQuizzes?: number;
  correctQuizzes?: number;
}

export default function DailyChart() {
  const [chartData, setChartData] = useState<DailyData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [chartWidth, setChartWidth] = useState<number>(0);

  const CHART_HEIGHT = 180;
  const PADDING_HORIZONTAL = 20;
  const GRAPH_COLOR = COLORS.primaryLight;
  const TOP_PADDING = 15;

  useEffect(() => {
    const fetchDailyStats = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get("/api/report/daily-stats?days=7");
        const payload = extractApiData<DailyData[]>(response.data);
        setChartData(Array.isArray(payload) ? payload : []);
      } catch {
        setChartData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDailyStats();
  }, []);

  const getCoordinates = (index: number, value: number) => {
    if (chartData.length === 0 || chartWidth === 0) return { x: 0, y: 0 };

    const availableWidth = chartWidth - PADDING_HORIZONTAL * 2;
    const x = (index / Math.max(chartData.length - 1, 1)) * availableWidth + PADDING_HORIZONTAL;
    const drawingHeight = CHART_HEIGHT - TOP_PADDING;
    const y = TOP_PADDING + (1 - value / 100) * drawingHeight;

    return { x, y };
  };

  const createPath = () => {
    if (chartData.length === 0) return "";

    return chartData
      .map((item, index) => {
        const { x, y } = getCoordinates(index, item.accuracy);
        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  };

  const onLayout = (event: LayoutChangeEvent) => {
    setChartWidth(event.nativeEvent.layout.width);
  };

  if (loading) {
    return (
      <View style={[styles.card, styles.centerContent]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{"\uC77C\uC8FC\uC77C \uC815\uB2F5\uB960"}</Text>
          <Text style={styles.subtitle}>{"\uCD5C\uADFC 7\uC77C\uAC04\uC758 \uD480\uC774 \uD750\uB984"}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: GRAPH_COLOR }]} />
          <Text style={styles.legendText}>{"\uC815\uB2F5\uB960(%)"}</Text>
        </View>
      </View>

      <View style={styles.chartBody}>
        <View style={styles.yAxisColumn}>
          {["100", "75", "50", "25", "0"].map((label) => (
            <Text key={label} style={styles.axisText}>
              {label}
            </Text>
          ))}
        </View>

        <View style={styles.graphContainer} onLayout={onLayout}>
          {chartWidth > 0 && (
            <>
              <Svg height={CHART_HEIGHT + 10} width={chartWidth}>
                {[0, 25, 50, 75, 100].map((v) => {
                  const drawingHeight = CHART_HEIGHT - TOP_PADDING;
                  const y = TOP_PADDING + (1 - v / 100) * drawingHeight;
                  return (
                    <Line
                      key={v}
                      x1="0"
                      y1={y}
                      x2={chartWidth}
                      y2={y}
                      stroke={COLORS.glassBorder}
                      strokeWidth="1"
                    />
                  );
                })}

                <Path d={createPath()} fill="none" stroke={GRAPH_COLOR} strokeWidth="3" />

                {chartData.map((item, index) => {
                  const { x, y } = getCoordinates(index, item.accuracy);
                  return (
                    <Circle
                      key={`point-${index}`}
                      cx={x}
                      cy={y}
                      r="4"
                      fill={COLORS.bgPrimary}
                      stroke={GRAPH_COLOR}
                      strokeWidth="2"
                    />
                  );
                })}
              </Svg>

              <View style={styles.xAxisContainer}>
                {chartData.map((item, index) => {
                  const availableWidth = chartWidth - PADDING_HORIZONTAL * 2;
                  const x = (index / Math.max(chartData.length - 1, 1)) * availableWidth + PADDING_HORIZONTAL;
                  return (
                    <Text key={`${item.day}-${index}`} style={[styles.dayText, { left: x - 15 }]}>
                      {item.day}
                    </Text>
                  );
                })}
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCardElevated,
    borderRadius: RADIUS.card,
    padding: SPACING.xxl,
    marginHorizontal: SPACING.xl,
    marginVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    ...SHADOWS.md,
    minHeight: 300,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 30,
  },
  title: {
    ...TYPO.h3,
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    ...TYPO.caption,
    color: COLORS.textTertiary,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    ...TYPO.caption,
    color: COLORS.textTertiary,
  },
  chartBody: {
    flexDirection: "row",
    height: 230,
  },
  yAxisColumn: {
    width: 30,
    justifyContent: "space-between",
    paddingBottom: 30,
    alignItems: "flex-end",
    paddingRight: 10,
    height: 194,
    paddingTop: 15,
  },
  axisText: {
    fontSize: 11,
    color: COLORS.textPlaceholder,
    height: 14,
    lineHeight: 14,
  },
  graphContainer: {
    flex: 1,
    height: 230,
    position: "relative",
  },
  xAxisContainer: {
    position: "absolute",
    top: 190,
    width: "100%",
    height: 30,
  },
  dayText: {
    position: "absolute",
    width: 30,
    textAlign: "center",
    fontSize: 11,
    color: COLORS.textTertiary,
  },
});
