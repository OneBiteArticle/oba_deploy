import { View, Pressable, Animated, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import usePizzaAnimation from "./usePizzaAnimation";
import PizzaSlice from "./PizzaSlice";

const LABEL_MY = String.fromCodePoint(0xb9c8, 0xc774);
const LABEL_REPORT = String.fromCodePoint(0xb9ac, 0xd3ec, 0xd2b8);
const LABEL_WRONG = String.fromCodePoint(0xd2c0, 0xb9b0, 0xbb38, 0xc81c);
const DEBUG_TOUCH = false;

export default function PizzaMenu() {
  const {
    toggle,
    halfScale,
    sliceScale,
    sliceOpacity,
    slice1X,
    slice1Y,
    slice2X,
    slice2Y,
    slice3X,
    slice3Y,
    isOpen,
    factor,
    anim,
    baseX,
    baseY,
  } = usePizzaAnimation();

  const insets = useSafeAreaInsets();
  const pizzaSize = 74 * factor;
  const closedTouchSize = pizzaSize * 1.04;

  return (
    <View
      style={[
        styles.container,
        { width: pizzaSize, height: pizzaSize, bottom: insets.bottom + 14 },
      ]}
    >
      <View pointerEvents={isOpen ? "auto" : "none"} style={StyleSheet.absoluteFill}>
        <PizzaSlice
          source={require("../../../assets/navi/navi_slice_1.png")}
          translateX={slice1X}
          translateY={slice1Y}
          scale={sliceScale}
          sliceOpacity={sliceOpacity}
          debugTouch={DEBUG_TOUCH}
          onPressRoute="/(tabs)/my"
          isOpen={isOpen}
          onToggle={toggle}
          factor={factor}
          anim={anim}
          label={LABEL_MY}
          sliceWidth={29.0}
          sliceHeight={39.9}
          labelOffsetX={-28}
          labelOffsetY={-52}
          labelMinWidth={66}
          labelPaddingX={12}
          labelPaddingY={5}
        />

        <PizzaSlice
          source={require("../../../assets/navi/navi_slice_2.png")}
          translateX={slice2X}
          translateY={slice2Y}
          scale={sliceScale}
          sliceOpacity={sliceOpacity}
          debugTouch={DEBUG_TOUCH}
          onPressRoute="/(tabs)/report"
          isOpen={isOpen}
          onToggle={toggle}
          factor={factor}
          anim={anim}
          label={LABEL_REPORT}
          sliceWidth={40.2}
          sliceHeight={36.9}
          labelOffsetX={-70}
          labelOffsetY={-24}
          labelMinWidth={72}
          labelPaddingX={12}
          labelPaddingY={5}
        />

        <PizzaSlice
          source={require("../../../assets/navi/navi_slice_3.png")}
          translateX={slice3X}
          translateY={slice3Y}
          scale={sliceScale}
          sliceOpacity={sliceOpacity}
          debugTouch={DEBUG_TOUCH}
          onPressRoute="/(tabs)/wrongArticles"
          isOpen={isOpen}
          onToggle={toggle}
          factor={factor}
          anim={anim}
          label={LABEL_WRONG}
          sliceWidth={41.1}
          sliceHeight={31.5}
          labelOffsetX={-86}
          labelOffsetY={10}
          labelMinWidth={88}
          labelPaddingX={12}
          labelPaddingY={5}
        />
      </View>

      {DEBUG_TOUCH && !isOpen && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            width: closedTouchSize,
            height: closedTouchSize,
            borderRadius: closedTouchSize / 2,
            backgroundColor: "rgba(0,255,0,0.18)",
            borderWidth: 1,
            borderColor: "rgba(0,128,0,0.9)",
            transform: [{ scale: halfScale }, { translateX: baseX }, { translateY: baseY }],
          }}
        />
      )}

      <Pressable onPress={toggle} style={StyleSheet.absoluteFill}>
        <Animated.Image
          source={require("../../../assets/navi/navi_half.png")}
          style={{
            width: pizzaSize,
            height: pizzaSize,
            transform: [{ scale: halfScale }, { translateX: baseX }, { translateY: baseY }],
          }}
          resizeMode="contain"
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 16,
  },
});
