import { useState, useEffect, useRef } from "react";
import { View, ActivityIndicator, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import TabBar from "./components/TabBar";
import ArticleTab from "./components/ArticleTab";
import SummaryTab from "./components/SummaryTab";
import KeywordTab from "./components/KeywordTab";
import QuizTab from "./components/QuizTab";
import { apiClient } from "../../src/api/apiClient";
import { COLORS } from "../../constants/theme";

const TAB_ARTICLE = String.fromCodePoint(0xae30, 0xc0ac);
const TAB_SUMMARY = String.fromCodePoint(0xc694, 0xc57d);
const TAB_KEYWORD = String.fromCodePoint(0xd0a4, 0xc6cc, 0xb4dc);
const TAB_QUIZ = String.fromCodePoint(0xd034, 0xc988);

export default function ArticleDetail() {
  const router = useRouter();
  const { id, retry } = useLocalSearchParams();
  const normalizedId = Array.isArray(id) ? id[0] : id;
  const articleId = typeof normalizedId === "string" ? normalizedId.trim() : "";
  const [activeTab, setActiveTab] = useState(TAB_ARTICLE);
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState<Record<number, number>>({});
  const [isGraded, setIsGraded] = useState<boolean[]>([]);
  const [isOpen, setIsOpen] = useState<Record<number, boolean>>({});
  const hasSubmitted = useRef(false);

  useEffect(() => {
    if (!articleId || articleId === "undefined" || articleId === "null") {
      setLoading(false);
      Alert.alert("Error", "Invalid article ID.");
      router.back();
      return;
    }

    const fetchArticle = async () => {
      try {
        const res = await apiClient.get(`/api/articles/${encodeURIComponent(articleId)}`);
        const data = res.data;
        setArticle(data);

        const quizzes = data.quizzes || [];
        const prevResults: boolean[] | null = data.myQuizResults;
        const isRetry = retry === "true";

        if (!isRetry && prevResults && prevResults.length === quizzes.length && prevResults.length > 0) {
          const restoredSelected: Record<number, number> = {};
          const restoredGraded: boolean[] = [];
          const restoredOpen: Record<number, boolean> = {};

          quizzes.forEach((quiz: any, i: number) => {
            restoredGraded.push(true);
            restoredOpen[i] = true;

            if (prevResults[i]) {
              restoredSelected[i] = quiz.answerIndex;
            } else {
              for (let j = 0; j < quiz.options.length; j++) {
                if (j !== quiz.answerIndex) {
                  restoredSelected[i] = j;
                  break;
                }
              }
            }
          });

          setSelected(restoredSelected);
          setIsGraded(restoredGraded);
          setIsOpen(restoredOpen);
          hasSubmitted.current = true;
        } else {
          setIsGraded(new Array(quizzes.length).fill(false));
        }
      } catch (err) {
        console.error("기사 불러오기 실패:", err);
        Alert.alert("오류", "기사를 불러오는데 실패했습니다.");
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [articleId, retry, router]);

  useEffect(() => {
    if (!article || hasSubmitted.current) return;

    const quizzes = article.quizzes || [];
    if (quizzes.length === 0) return;

    const allGraded = isGraded.length === quizzes.length && isGraded.every(Boolean);
    if (!allGraded) return;

    const results = quizzes.map((quiz: any, i: number) => selected[i] === quiz.answerIndex);

    hasSubmitted.current = true;
    apiClient
      .post("/api/quiz/result", { articleId, results })
      .then(() => {
        console.log("퀴즈 결과 전송 완료");
      })
      .catch((err: any) => {
        console.error("퀴즈 결과 전송 실패:", err);
      });
  }, [article, articleId, isGraded, selected]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "transparent" }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!article) return null;

  const handleSelect = (q: number, o: number) => setSelected((prev) => ({ ...prev, [q]: o }));

  const handleGrade = (qIndex: number) => {
    setIsGraded((prev) => {
      const updated = [...prev];
      updated[qIndex] = true;
      return updated;
    });
    setIsOpen((prev) => ({ ...prev, [qIndex]: true }));
  };

  const toggleOpen = (qIndex: number) => {
    setIsOpen((prev) => ({ ...prev, [qIndex]: !prev[qIndex] }));
  };

  return (
    <View style={{ flex: 1, backgroundColor: "transparent", paddingTop: 10 }}>
      <TabBar activeTab={activeTab} setActiveTab={setActiveTab} goHome={() => router.back()} />

      {activeTab === TAB_ARTICLE && <ArticleTab article={article} onMoveToQuiz={() => setActiveTab(TAB_QUIZ)} />}
      {activeTab === TAB_SUMMARY && (
        <SummaryTab summary={article.summary ?? null} summaryBullets={article.summaryBullets ?? null} />
      )}
      {activeTab === TAB_KEYWORD && <KeywordTab keywords={article.keywords ?? []} />}
      {activeTab === TAB_QUIZ && (
        <QuizTab
          quizList={article.quizzes ?? []}
          selected={selected}
          isGraded={isGraded}
          isOpen={isOpen}
          handleSelect={hasSubmitted.current ? () => {} : handleSelect}
          handleGrade={hasSubmitted.current ? () => {} : handleGrade}
          toggleOpen={toggleOpen}
          alreadySubmitted={hasSubmitted.current}
        />
      )}
    </View>
  );
}
