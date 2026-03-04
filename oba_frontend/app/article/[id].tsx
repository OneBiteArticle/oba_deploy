// oba_fronted/app/article/[id].tsx
import { useState, useEffect } from "react";
import { View, Text, ActivityIndicator, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import TabBar from "./components/TabBar";
import ArticleTab from "./components/ArticleTab";
import SummaryTab from "./components/SummaryTab";
import KeywordTab from "./components/KeywordTab";
import QuizTab from "./components/QuizTab";
import { apiClient } from "../../src/api/apiClient";

export default function ArticleDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState("기사");
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  // 퀴즈 상태
  const [selected, setSelected] = useState({});
  const [isGraded, setIsGraded] = useState([]);
  const [isOpen, setIsOpen] = useState({});

  useEffect(() => {
    if (!id) return;

    const fetchArticle = async () => {
      try {
        const res = await apiClient.get(`/articles/${id}`);
        setArticle(res.data);
        // 퀴즈가 있다면 초기화
        if (res.data.quizzes) {
          setIsGraded(new Array(res.data.quizzes.length).fill(false));
        }
      } catch (err) {
        console.error("기사 상세 로딩 실패:", err);
        Alert.alert("오류", "기사를 불러올 수 없습니다.");
        router.back();
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [id]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "transparent" }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!article) return null;

  // 퀴즈 핸들러
  const handleSelect = (q, o) => setSelected(prev => ({ ...prev, [q]: o }));
  const handleGrade = (qIndex) => {
    setIsGraded(prev => { 
      const updated = [...prev]; 
      updated[qIndex] = true; 
      return updated; 
    });
    setIsOpen(prev => ({ ...prev, [qIndex]: true }));
  };
  const toggleOpen = (qIndex) => setIsOpen(prev => ({ ...prev, [qIndex]: !prev[qIndex] }));

  return (
    <View style={{ flex: 1, backgroundColor: "transparent", paddingTop: 10 }}>
      <TabBar activeTab={activeTab} setActiveTab={setActiveTab} goHome={() => router.push("/")} />
      
      {activeTab === "기사" && (
        <ArticleTab 
          article={article} 
          onMoveToQuiz={() => setActiveTab("퀴즈")} 
        />
      )}
      
      {activeTab === "요약" && <SummaryTab summary={article.summary} />}
      
      {activeTab === "키워드" && <KeywordTab keywords={article.keywords} />}
      
      {activeTab === "퀴즈" && (
        <QuizTab 
          quizList={article.quizzes} 
          selected={selected} 
          isGraded={isGraded} 
          isOpen={isOpen}
          handleSelect={handleSelect} 
          handleGrade={handleGrade} 
          toggleOpen={toggleOpen} 
        />
      )}
    </View>
  );
}