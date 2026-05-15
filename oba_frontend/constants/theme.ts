export const COLORS = {
  // Backgrounds (sky)
  bgPrimary: "#F5FAFF",
  bgSecondary: "#EEF5FF",
  bgCard: "#FFFFFF",
  bgCardElevated: "#FFFFFF",

  // Primary (blue)
  primary: "#4A8CFF",
  primaryLight: "#6AA3FF",
  primaryDark: "#2F6FDB",
  primarySurface: "rgba(74, 140, 255, 0.12)",

  // Secondary (sky)
  secondary: "#87CEEB",
  secondaryLight: "#A6DBF2",
  secondarySurface: "rgba(135, 206, 235, 0.18)",

  // Accent
  accent: "#E74C3C",
  accentLight: "#FF6B6B",
  accentSurface: "rgba(231, 76, 60, 0.08)",

  // Neutrals
  textPrimary: "#191F28",
  textSecondary: "#4E5968",
  textTertiary: "#8B95A1",
  textPlaceholder: "#B0B8C1",

  border: "rgba(74, 140, 255, 0.18)",
  borderLight: "rgba(74, 140, 255, 0.1)",
  divider: "rgba(74, 140, 255, 0.12)",

  // Semantic
  success: "#27AE60",
  successLight: "#6FCF97",
  successSurface: "rgba(39, 174, 96, 0.08)",
  error: "#E74C3C",
  errorLight: "#FF6B6B",
  errorSurface: "rgba(231, 76, 60, 0.08)",

  // Overlay
  overlay: "rgba(25, 31, 40, 0.55)",
  overlayLight: "rgba(25, 31, 40, 0.2)",

  // Glass effect (cool tint)
  glass: "rgba(74, 140, 255, 0.06)",
  glassBorder: "rgba(74, 140, 255, 0.16)",
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 100,
  card: 20,
  button: 14,
};

export const TYPO = {
  display: { fontSize: 32, fontWeight: "800" as const, letterSpacing: -0.5 },
  h1: { fontSize: 24, fontWeight: "800" as const, letterSpacing: -0.3 },
  h2: { fontSize: 20, fontWeight: "700" as const, letterSpacing: -0.2 },
  h3: { fontSize: 18, fontWeight: "700" as const },
  body: { fontSize: 16, fontWeight: "400" as const, lineHeight: 26 },
  bodySm: { fontSize: 14, fontWeight: "400" as const, lineHeight: 22 },
  caption: { fontSize: 12, fontWeight: "500" as const },
  label: { fontSize: 14, fontWeight: "600" as const },
  button: { fontSize: 16, fontWeight: "700" as const },
};

export const SHADOWS = {
  sm: {
    shadowColor: "#3E6FB8",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: "#3E6FB8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  lg: {
    shadowColor: "#3E6FB8",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  glow: {
    shadowColor: "#4A8CFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
};
