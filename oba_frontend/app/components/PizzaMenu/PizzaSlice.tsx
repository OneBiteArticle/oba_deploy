import React from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  View,
  ImageSourcePropType,
  Text,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { COLORS } from "../../../constants/theme";

type Props = {
  source: ImageSourcePropType;
  translateX: Animated.AnimatedInterpolation<number>;
  translateY: Animated.AnimatedInterpolation<number>;
  scale: Animated.AnimatedInterpolation<number>;
  onPressRoute: string;
  isOpen: boolean;
  onToggle: () => void;
  factor: number;
  anim?: Animated.Value;
  label?: string;
  labelOffsetX?: number;
  labelOffsetY?: number;
  labelIconSource?: ImageSourcePropType;
  labelMinWidth?: number;
  labelPaddingX?: number;
  labelPaddingY?: number;
  sliceWidth: number;
  sliceHeight: number;
  sliceOpacity?: Animated.AnimatedInterpolation<number>;
  debugTouch?: boolean;
};

export default function PizzaSlice({
  source,
  translateX,
  translateY,
  scale,
  onPressRoute,
  isOpen,
  onToggle,
  factor,
  anim,
  label,
  labelOffsetX,
  labelOffsetY,
  labelIconSource,
  labelMinWidth,
  labelPaddingX,
  labelPaddingY,
  sliceWidth,
  sliceHeight,
  sliceOpacity,
  debugTouch,
}: Props) {
  const router = useRouter();

  const labelOpacity = anim
    ? anim.interpolate({ inputRange: [0, 0.58, 1], outputRange: [0, 0, 1] })
    : 1;

  const labelScale = anim
    ? anim.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] })
    : 1;

  const w = sliceWidth * factor;
  const h = sliceHeight * factor;

  const finalOffsetX = (labelOffsetX ?? 0) * factor;
  const finalOffsetY = (labelOffsetY ?? 0) * factor;

  // Keep label offset numeric to avoid creating Animated.Value on every render.
  const labelTranslateX = anim
    ? anim.interpolate({
        inputRange: [0, 1],
        outputRange: [finalOffsetX + 12 * factor, finalOffsetX],
      })
    : finalOffsetX;

  const bubbleMinWidth = (labelMinWidth ?? 68) * factor;
  const bubblePaddingX = (labelPaddingX ?? 12) * factor;
  const bubblePaddingY = (labelPaddingY ?? 5) * factor;

  const openHitSlop = Math.max(8, Math.round(10 * factor));

  const handlePress = () => {
    if (!isOpen) {
      onToggle();
      return;
    }

    try {
      router.push(onPressRoute as never);
    } catch (e) {
      console.warn("Navigation error:", e);
    }

    onToggle();
  };

  return (
    <Animated.View
      style={[
        styles.sliceContainer,
        {
          opacity: sliceOpacity ?? 1,
          transform: [{ translateX }, { translateY }],
        },
      ]}
      pointerEvents="box-none"
    >
      <Pressable
        onPress={handlePress}
        hitSlop={isOpen ? { top: openHitSlop, right: openHitSlop, bottom: openHitSlop, left: openHitSlop } : 0}
        style={{ width: w, height: h, justifyContent: "center", alignItems: "center" }}
      >
        <Animated.Image
          source={source}
          style={{ width: w, height: h, transform: [{ scale }] }}
          resizeMode="contain"
          pointerEvents="none"
        />

        {debugTouch && (
          <>
            <View
              pointerEvents="none"
              style={[
                styles.debugTouchBox,
                {
                  borderRadius: 6 * factor,
                },
              ]}
            />
            {isOpen && (
              <View
                pointerEvents="none"
                style={[
                  styles.debugTouchHitSlop,
                  {
                    top: -openHitSlop,
                    left: -openHitSlop,
                    right: -openHitSlop,
                    bottom: -openHitSlop,
                    borderRadius: 8 * factor,
                  },
                ]}
              />
            )}
          </>
        )}

        {label && (
          <Animated.View
            style={[
              styles.labelWrapper,
              {
                opacity: labelOpacity,
                transform: [{ translateX: labelTranslateX }, { translateY: finalOffsetY }, { scale: labelScale }],
              },
            ]}
          >
            <View
              style={[
                styles.labelBubble,
                {
                  borderRadius: 8 * factor,
                  minWidth: bubbleMinWidth,
                  maxWidth: 120 * factor,
                  paddingHorizontal: bubblePaddingX,
                  paddingVertical: bubblePaddingY,
                },
              ]}
            >
              <View style={styles.labelInner}>
                {labelIconSource && (
                  <Image
                    source={labelIconSource}
                    style={{ width: 10 * factor, height: 10 * factor, marginRight: 4 * factor }}
                  />
                )}
                <Text style={[styles.labelText, { fontSize: 13 * factor }]} numberOfLines={1}>
                  {label}
                </Text>
              </View>
            </View>
          </Animated.View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sliceContainer: { position: "absolute" },
  labelWrapper: { position: "absolute" },
  labelBubble: {
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    shadowColor: "#8B6F47",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  labelInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  labelText: {
    color: "#2D2016",
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.2,
  },
  debugTouchBox: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 255, 0, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(0, 128, 0, 0.9)",
  },
  debugTouchHitSlop: {
    position: "absolute",
    backgroundColor: "rgba(60, 200, 120, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(40, 160, 80, 0.9)",
  },
});


