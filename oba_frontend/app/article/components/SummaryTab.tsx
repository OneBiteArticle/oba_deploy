// oba_fronted/app/article/components/SummaryTab.tsx

import { View, Text, StyleSheet } from "react-native";

export default function SummaryTab({ summary }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🤖 AI 요약</Text>
      <Text style={styles.content}>{summary}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },

  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 14,
    color: "#222",
  },

  content: {
    fontSize: 15,
    lineHeight: 22,
    color: "#333",
  },
});
