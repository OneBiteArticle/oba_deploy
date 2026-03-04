// oba_fronted/app/(tabs)/index.tsx
// oba_fronted/app/(tabs)/index.tsx

import { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  Animated,
  useWindowDimensions,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { apiClient } from "../../src/api/apiClient";
import PizzaMenu from "../components/PizzaMenu";

// ✅ [수정 1] MongoDB ID는 문자열이므로 string으로 변경
interface ArticleSummary {
  articleId: string; 
  article_id?: string;
  title: string;
  summaryBullets?: string[];
  summary_bullets?: string[];
  servingDate?: string;
  serving_date?: string;
}

export default function Home() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  
  const scrollX = useRef(new Animated.Value(0)).current; 
  
  const CARD_WIDTH = width * 0.65;
  const CARD_HEIGHT = Math.min(height * 0.5, 500);
  const SIDE_SPACING = (width - CARD_WIDTH) / 2;
  const SNAP_INTERVAL = CARD_WIDTH + 10;

  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        console.log("📡 [Home] 기사 데이터 요청 시작...");
        
        // 1. 최신 기사 가져오기
        const res = await apiClient.get<ArticleSummary[]>("/articles/latest?limit=10");
        
        // ✅ [디버깅] 서버에서 실제로 어떤 데이터가 오는지 로그로 확인
        console.log("📥 [Home] 서버 응답 데이터:", JSON.stringify(res.data, null, 2));

        const data = res.data;

        // 2. 오늘 날짜 계산
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const today = `${year}-${month}-${day}`; 

        console.log(`📅 [Home] 앱 기준 오늘 날짜: ${today}`);

        // ✅ [수정 2] 필터링 로직 완화 (일단 모든 데이터를 보여주도록 수정)
        // 만약 서버 데이터가 없으면 빈 배열
        if (!data || !Array.isArray(data)) {
            console.log("⚠️ 데이터가 배열이 아닙니다.");
            setArticles([]);
            return;
        }

        const mappedArticles = data.map(item => ({
          // 컴포넌트에서 쓰기 편하게 통일
          // 서버 응답이 articleId 인지 _id 인지 확인 필요 (Mongo는 보통 _id)
          articleId: item.articleId || item.article_id || (item as any)._id || "", 
          title: item.title,
          summaryBullets: item.summaryBullets || item.summary_bullets || [],
          servingDate: item.servingDate || item.serving_date || "",
        }));

        // 🚀 필터링을 잠시 끄고 데이터를 전부 보여줍니다.
        // 나중에 servingDate 형식이 확인되면 다시 필터를 켜세요.
        console.log(`✅ [Home] 표시할 기사 개수: ${mappedArticles.length}개`);
        setArticles(mappedArticles);

      } catch (err) {
        console.error("❌ [Home] 기사 로딩 실패:", err);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10, color: "#666" }}>따끈한 피자 기사를 굽는 중... 🍕</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, paddingTop: insets.top + 20 }}>
      <View style={{ marginTop: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: "700", marginLeft: 24, marginBottom: 16, color: "#191F28" }}>
          오늘의 기사
        </Text>
        
        {articles.length === 0 ? (
          <View style={{ alignItems: "center", marginTop: 50, paddingHorizontal: 40 }}>
            <Image 
              source={require("../../assets/knight/hand.png")} 
              style={{ width: 100, height: 100, marginBottom: 10, opacity: 0.5 }} 
              resizeMode="contain"
            />
            <Text style={{ color: "#999", fontSize: 16, marginBottom: 5 }}>아직 도착한 기사가 없어요.</Text>
            <Text style={{ color: "#ccc", fontSize: 12 }}>({new Date().toLocaleDateString()} 기준)</Text>
          </View>
        ) : (
          <Animated.ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={SNAP_INTERVAL}
            decelerationRate="fast"
            scrollEventThrottle={16}
            contentContainerStyle={{ paddingHorizontal: SIDE_SPACING }}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: true }
            )}
          >
            {articles.map((item, i) => {
              const inputRange = [
                (i - 1) * SNAP_INTERVAL,
                i * SNAP_INTERVAL,
                (i + 1) * SNAP_INTERVAL,
              ];
              
              const scale = scrollX.interpolate({
                inputRange,
                outputRange: [0.9, 1, 0.9],
                extrapolate: "clamp",
              });

              const summaryText = item.summaryBullets && item.summaryBullets.length > 0 
                ? item.summaryBullets.map(s => `• ${s}`).join("\n")
                : "요약 내용이 없습니다.";

              return (
                <Link key={i} href={`/article/${item.articleId}`} asChild>
                  <Pressable>
                    <Animated.View
                      style={{
                        width: CARD_WIDTH,
                        height: CARD_HEIGHT,
                        backgroundColor: "#fff",
                        borderRadius: 18,
                        padding: 20,
                        marginRight: 10,
                        transform: [{ scale }],
                        shadowColor: "#000",
                        shadowOpacity: 0.1,
                        shadowRadius: 10,
                        elevation: 5,
                      }}
                    >
                      <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 10 }} numberOfLines={2}>
                        {item.title}
                      </Text>
                      
                      <View style={{ alignItems: "center", marginBottom: 15 }}>
                        <Image
                          source={require("../../assets/knight/deliever.png")}
                          style={{ height: 120, width: 120, resizeMode: "contain" }}
                        />
                      </View>
                      
                      <Text style={{ fontSize: 13, lineHeight: 20, color: "#555", flex: 1 }} numberOfLines={5}>
                        {summaryText}
                      </Text>
                      
                      <Text style={{ fontSize: 12, color: "#999", textAlign: "right", marginTop: 10 }}>
                        {item.servingDate}
                      </Text>
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