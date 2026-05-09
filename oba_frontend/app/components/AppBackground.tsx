import { View, Image, StyleSheet, useWindowDimensions } from "react-native";
import { COLORS } from "../../constants/theme";

export default function AppBackground() {
  const { width, height } = useWindowDimensions();

  const pos = ({ top, left, right, bottom }: { top?: number; left?: number; right?: number; bottom?: number }) => ({
    top: top !== undefined ? (top / 844) * height : undefined,
    left: left !== undefined ? (left / 390) * width : undefined,
    right: right !== undefined ? (right / 390) * width : undefined,
    bottom: bottom !== undefined ? (bottom / 844) * height : undefined,
  });

  return (
    <View style={[StyleSheet.absoluteFill, styles.container]} pointerEvents="none">
      <Image source={require("../../assets/pizza/pep.png")} style={[styles.decoration, pos({ top: 100, left: 140 })]} />
      <Image
        source={require("../../assets/food/burger.png")}
        style={[styles.decoration, pos({ top: 180, right: 90 }), { transform: [{ rotate: "-12deg" }] }]}
      />
      <Image
        source={require("../../assets/food/potato.png")}
        style={[styles.decoration, pos({ top: 330, left: 60 }), { transform: [{ rotate: "-12deg" }] }]}
      />
      <Image
        source={require("../../assets/pizza/mar.png")}
        style={[styles.decoration, pos({ top: 460, right: 60 }), { transform: [{ rotate: "12deg" }] }]}
      />
      <Image
        source={require("../../assets/food/ckin.png")}
        style={[styles.decoration, pos({ top: 620, left: 180 }), { transform: [{ rotate: "16deg" }] }]}
      />
      <Image source={require("../../assets/food/chic.png")} style={[styles.decoration, pos({ top: 720, right: 50 })]} />
      <Image source={require("../../assets/pizza/hwaa.png")} style={[styles.decoration, pos({ left: 100, bottom: 150 })]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    backgroundColor: COLORS.bgPrimary,
  },
  decoration: {
    position: "absolute",
    width: 60,
    height: 60,
    opacity: 0.15,
  },
});
