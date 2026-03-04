import { View, Text, TouchableOpacity, Image, StyleSheet, useWindowDimensions } from "react-native";

export default function Login() {
  const { width, height } = useWindowDimensions();
  return (
    <View style={styles.container}>
      {/* 로고 / 캐릭터 */}
      <Image
        source={require("../../assets/knight/hand.png")}
        style={[{ width: width * 0.55, height: height * 0.23, marginBottom: 16 }]}
        resizeMode="contain"
      />

      {/* 타이틀 */}
      <Text style={styles.title}>한입기사</Text>
      <Text style={styles.subtitle}>One Bite Article</Text>

      {/* 소셜 로그인 버튼 영역 */}
      <View style={styles.btnWrap}>
        <TouchableOpacity style={[styles.btn, styles.google]}>
          <Image source={require("../../assets/icons/google.png")} style={styles.icon} />
          <Text style={styles.btnText}>구글로 로그인</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, styles.kakao]}>
          <Image source={require("../../assets/icons/kakao-talk.png")} style={styles.icon} />
          <Text style={[styles.btnText, { color: "#3B1E1E" }]}>카카오로 로그인</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, styles.naver]}>
          <Image source={require("../../assets/icons/naver.png")} style={styles.icon} />
          <Text style={styles.btnText}>네이버로 로그인</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  title: { fontSize: 32, fontWeight: "800", color: "#333" },
  subtitle: { fontSize: 16, color: "#666", marginTop: 4, marginBottom: 42 },
  btnWrap: { width: "85%", gap: 14, alignItems: "center" },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
    justifyContent: "center",
    width: "100%",
  },
  icon: { width: 20, height: 20, resizeMode: "contain" },
  google: { backgroundColor: "#FFF", borderWidth: 1, borderColor: "#DDD" },
  kakao: { backgroundColor: "#FEE500" },
  naver: { backgroundColor: "#03C75A" },
  btnText: { fontSize: 16, fontWeight: "600", color: "#222" },
});