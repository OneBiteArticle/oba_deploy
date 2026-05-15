import { useRef, useState } from "react";
import { Animated, useWindowDimensions } from "react-native";

type SliceKey = "s1" | "s2" | "s3";
type Point = { x: number; y: number };

export default function usePizzaAnimation() {
  const anim = useRef(new Animated.Value(0)).current;
  const { width, height } = useWindowDimensions();
  const factor = Math.min(width, height) / 390;
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    Animated.spring(anim, {
      toValue: next ? 1 : 0,
      friction: 6,
      tension: 60,
      useNativeDriver: true,
    }).start();
  };

  // Base movement of half pizza image (closed -> open)
  const CLOSED_BASE: Point = { x: -20, y: -20 };
  const OPEN_BASE: Point = { x: -41, y: -39 };

  // Closed state anchor points:
  // - FAR: user-tuned old values (currently too far from center)
  // - NEAR: pre-restore values (too close to center)
  // Blend with near bias to get the requested middle point.
  const CLOSED_RAW_FAR: Record<SliceKey, Point> = {
    s1: { x: -42.5, y: -66.2 },
    s2: { x: -68.6, y: -57.3 },
    s3: { x: -68.7, y: -10.3 },
  };

  const CLOSED_RAW_NEAR: Record<SliceKey, Point> = {
    s1: { x: 34.0, y: 8.1 },
    s2: { x: 19.2, y: 12.0 },
    s3: { x: 3.6, y: 15.0 },
  };

  // 0 = FAR, 1 = NEAR
  // Requested: middle, but slightly closer to NEAR.
  const CLOSED_NEAR_BIAS = 0.58;
  const blend = (far: number, near: number) => far + (near - far) * CLOSED_NEAR_BIAS;

  const CLOSED_RAW: Record<SliceKey, Point> = {
    s1: {
      x: blend(CLOSED_RAW_FAR.s1.x, CLOSED_RAW_NEAR.s1.x),
      y: blend(CLOSED_RAW_FAR.s1.y, CLOSED_RAW_NEAR.s1.y),
    },
    s2: {
      x: blend(CLOSED_RAW_FAR.s2.x, CLOSED_RAW_NEAR.s2.x),
      y: blend(CLOSED_RAW_FAR.s2.y, CLOSED_RAW_NEAR.s2.y),
    },
    s3: {
      x: blend(CLOSED_RAW_FAR.s3.x, CLOSED_RAW_NEAR.s3.x),
      y: blend(CLOSED_RAW_FAR.s3.y, CLOSED_RAW_NEAR.s3.y),
    },
  };

  const CLOSED_SLICE_TWEAK: Record<SliceKey, Point> = {
    s1: { x: -6.9, y: 3.1 },
    s2: { x: -4.9, y: 0.8 },
    s3: { x: 3.4, y: 2.1 },
  };

  // Open spread: increase this if slices should fly out more
  const OPEN_SPREAD_MULTIPLIER = 1.0;
  const OPEN_GLOBAL_SHIFT: Point = { x: -15, y: -15 };

  const OPEN_DELTA_RAW: Record<SliceKey, Point> = {
    s1: { x: -56, y: -96 },
    s2: { x: -95, y: -82 },
    s3: { x: -100, y: -26 },
  };

  const OPEN_DELTA: Record<SliceKey, Point> = {
    s1: {
      x: OPEN_DELTA_RAW.s1.x * OPEN_SPREAD_MULTIPLIER,
      y: OPEN_DELTA_RAW.s1.y * OPEN_SPREAD_MULTIPLIER,
    },
    s2: {
      x: OPEN_DELTA_RAW.s2.x * OPEN_SPREAD_MULTIPLIER,
      y: OPEN_DELTA_RAW.s2.y * OPEN_SPREAD_MULTIPLIER,
    },
    s3: {
      x: OPEN_DELTA_RAW.s3.x * OPEN_SPREAD_MULTIPLIER,
      y: OPEN_DELTA_RAW.s3.y * OPEN_SPREAD_MULTIPLIER,
    },
  };

  const OPEN_SLICE_TWEAK: Record<SliceKey, Point> = {
    s1: { x: 0, y: 0 },
    s2: { x: -4, y: 2 },
    s3: { x: -4, y: 1 },
  };

  const buildClosed = (k: SliceKey): Point => ({
    x: (CLOSED_RAW[k].x + CLOSED_SLICE_TWEAK[k].x) * factor,
    y: (CLOSED_RAW[k].y + CLOSED_SLICE_TWEAK[k].y) * factor,
  });

  const CLOSED = {
    s1: buildClosed("s1"),
    s2: buildClosed("s2"),
    s3: buildClosed("s3"),
  };

  const OPEN = {
    s1: {
      x:
        CLOSED.s1.x +
        (OPEN_DELTA.s1.x + OPEN_SLICE_TWEAK.s1.x + OPEN_GLOBAL_SHIFT.x) * factor,
      y:
        CLOSED.s1.y +
        (OPEN_DELTA.s1.y + OPEN_SLICE_TWEAK.s1.y + OPEN_GLOBAL_SHIFT.y) * factor,
    },
    s2: {
      x:
        CLOSED.s2.x +
        (OPEN_DELTA.s2.x + OPEN_SLICE_TWEAK.s2.x + OPEN_GLOBAL_SHIFT.x) * factor,
      y:
        CLOSED.s2.y +
        (OPEN_DELTA.s2.y + OPEN_SLICE_TWEAK.s2.y + OPEN_GLOBAL_SHIFT.y) * factor,
    },
    s3: {
      x:
        CLOSED.s3.x +
        (OPEN_DELTA.s3.x + OPEN_SLICE_TWEAK.s3.x + OPEN_GLOBAL_SHIFT.x) * factor,
      y:
        CLOSED.s3.y +
        (OPEN_DELTA.s3.y + OPEN_SLICE_TWEAK.s3.y + OPEN_GLOBAL_SHIFT.y) * factor,
    },
  };

  const baseX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [CLOSED_BASE.x * factor, OPEN_BASE.x * factor],
  });

  const baseY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [CLOSED_BASE.y * factor, OPEN_BASE.y * factor],
  });

  const slice1X = anim.interpolate({ inputRange: [0, 1], outputRange: [CLOSED.s1.x, OPEN.s1.x] });
  const slice1Y = anim.interpolate({ inputRange: [0, 1], outputRange: [CLOSED.s1.y, OPEN.s1.y] });
  const slice2X = anim.interpolate({ inputRange: [0, 1], outputRange: [CLOSED.s2.x, OPEN.s2.x] });
  const slice2Y = anim.interpolate({ inputRange: [0, 1], outputRange: [CLOSED.s2.y, OPEN.s2.y] });
  const slice3X = anim.interpolate({ inputRange: [0, 1], outputRange: [CLOSED.s3.x, OPEN.s3.x] });
  const slice3Y = anim.interpolate({ inputRange: [0, 1], outputRange: [CLOSED.s3.y, OPEN.s3.y] });

  const halfScale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.72] });
  const sliceScale = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.9, 1.79] });
  const sliceOpacity = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1] });

  return {
    toggle,
    isOpen,
    factor,
    anim,
    baseX,
    baseY,
    halfScale,
    sliceScale,
    sliceOpacity,
    slice1X,
    slice1Y,
    slice2X,
    slice2Y,
    slice3X,
    slice3Y,
  };
}




