import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SHADOWS, TYPO, SPACING } from "../../../constants/theme";

type Props = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  goHome: () => void;
};

const TAB_ARTICLE = String.fromCodePoint(0xae30, 0xc0ac);
const TAB_SUMMARY = String.fromCodePoint(0xc694, 0xc57d);
const TAB_KEYWORD = String.fromCodePoint(0xd0a4, 0xc6cc, 0xb4dc);
const TAB_QUIZ = String.fromCodePoint(0xd034, 0xc988);

export default function TabBar({ activeTab, setActiveTab, goHome }: Props) {
  const tabs = [TAB_ARTICLE, TAB_SUMMARY, TAB_KEYWORD, TAB_QUIZ];

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.innerContainer}>
          <TouchableOpacity onPress={goHome} style={styles.backBtn} activeOpacity={0.6}>
            <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <View style={styles.tabGroup}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={[styles.tabBtn, isActive && styles.tabBtnActive]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.dummySpace} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { zIndex: 10, backgroundColor: "transparent", borderBottomWidth: 1, borderColor: COLORS.border },
  safeArea: { backgroundColor: "transparent" },
  innerContainer: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
  },
  backBtn: { width: 40, height: 40, justifyContent: "center", alignItems: "flex-start" },
  tabGroup: {
    flexDirection: "row",
    gap: 4,
    backgroundColor: COLORS.bgSecondary,
    padding: 4,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabBtn: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20 },
  tabBtnActive: { backgroundColor: COLORS.primary, ...SHADOWS.sm },
  tabText: { ...TYPO.label, color: COLORS.textTertiary },
  tabTextActive: { color: "#FFFFFF", fontWeight: "700" },
  dummySpace: { width: 40 },
});
