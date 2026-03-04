import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import axios from "axios";

// =============================================================================
// 📌 [Types & Interfaces]
// =============================================================================

/**
 * 📍 API 명세: /BACKEND_API_SPEC.md - "4️⃣ 카테고리별 정답률 조회"
 * 엔드포인트: GET /api/report/category-progress
 * 응답 배열의 각 항목 구조
 */
export interface CategoryData {
  categoryId?: number;  // 카테고리 ID
  category: string;     // 카테고리명 (예: Tech)
  progress: number;     // 정답률 (0~100)
  totalQuizzes?: number;    // 풀이한 총 문제 수
  correctQuizzes?: number;  // 정답 문제 수
  color?: string;       // 그래프 색상 (백엔드 또는 프론트엔드에서 제공)
}

// 백엔드 응답 형태 정의
interface ApiResponse {
  data: CategoryData[];
  message?: string;
}

// =============================================================================
// 🚀 Component
// =============================================================================

export default function CategoryProgress() {
  // 1. 상태 관리
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  // 2. 데이터 페칭 (Axios)
  useEffect(() => {
    const fetchCategoryStats = async () => {
      try {
        setLoading(true);        // ✅ 중요: user_id는 JWT 토큰에서 자동으로 추출됨 (Query Parameter 불필요)
        //         // � 백엔드 연동 시 (주석 해제):
        //    import { apiClient } from "../../../../src/api/apiClient";
        //    const response = await apiClient.get("/api/report/category-progress");
        //    setCategories(response.data);
        
        // --- [테스트용 더미 데이터 로직] ---
        await new Promise((resolve) => setTimeout(resolve, 800)); 
        const mockData: CategoryData[] = [
          { category: "Tech", progress: 72, color: "#87CEEB" },
          { category: "AI", progress: 80, color: "#D4845C" },
          { category: "Health", progress: 70, color: "#D4C9AA" },
          { category: "Social", progress: 94, color: "#A9A9A9" },
          { category: "Pizza", progress: 60, color: "#7FCD7F" },
        ];
        setCategories(mockData);
        // -------------------------------

        // setCategories(response.data.data);

      } catch (err) {
        console.error("Failed to fetch category stats:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryStats();
  }, []);

  // 3. 로딩 상태
  if (loading) {
    return (
      <View style={[styles.cardContainer, styles.centerContent]}>
        <ActivityIndicator size="large" color="#87CEEB" />
      </View>
    );
  }

  // 4. 에러 상태
  if (error) {
    return (
      <View style={[styles.cardContainer, styles.centerContent]}>
        <Text style={{ color: "#888" }}>데이터를 불러오지 못했습니다.</Text>
      </View>
    );
  }

  return (
    <View style={styles.cardContainer}>
      {/* 타이틀 */}
      <Text style={styles.title}>카테고리별 정답률</Text>

      {/* 카테고리 리스트 */}
      <View style={styles.listContainer}>
        {categories.map((item, index) => (
          <View key={index} style={styles.categoryRow}>
            
            {/* 1. 카테고리명 (고정 너비) */}
            <Text style={styles.categoryName} numberOfLines={1}>
              {item.category}
            </Text>

            {/* 2. 진행 바 트랙 */}
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.min(item.progress, 100)}%`,
                    backgroundColor: item.color || "#87CEEB",
                  },
                ]}
              />
            </View>

            {/* 3. 퍼센트 텍스트 */}
            <Text style={styles.progressPercent}>{item.progress}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// =============================================================================
// 🎨 Styles (DailyChart와 동일한 여백/스타일 적용)
// =============================================================================

const styles = StyleSheet.create({
  // 📌 DailyChart와 동일한 카드 컨테이너 스타일
  cardContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,      // 모서리 둥글기 통일
    padding: 24,           // 내부 여백 통일
    marginHorizontal: 20,  // 화면 좌우 여백 통일
    marginVertical: 12,    // 카드 간 상하 간격 통일
    
    // 그림자 (Shadow) 통일
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    minHeight: 200, 
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },

  // 타이틀 스타일 통일
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 24, // 리스트와의 간격 확보
  },

  // 리스트 영역
  listContainer: {
    gap: 16, // 아이템 간 간격 (React Native 0.71+)
  },
  
  // 개별 행 (Row)
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  // 1. 카테고리 이름
  categoryName: {
    width: 60, // 이름 영역 고정 너비
    fontSize: 13,
    fontWeight: "600",
    color: "#444",
  },

  // 2. 프로그레스 바 배경 (Track)
  progressBarTrack: {
    flex: 1, // 남은 공간 모두 차지
    height: 10,
    backgroundColor: "#F0F0F0", // DailyChart 그리드 라인 색상과 톤 매칭
    borderRadius: 5,
    marginHorizontal: 12, // 텍스트와 바 사이 간격
    overflow: "hidden",
  },

  // 프로그레스 바 채움 (Fill)
  progressBarFill: {
    height: "100%",
    borderRadius: 5,
  },

  // 3. 퍼센트 텍스트
  progressPercent: {
    width: 36, // 숫자 영역 고정 너비 (우측 정렬용)
    fontSize: 12,
    fontWeight: "bold",
    color: "#666",
    textAlign: "right",
  },
});