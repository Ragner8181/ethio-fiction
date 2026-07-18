// Design tokens ported 1:1 from the approved Ethio Fiction mockup.
export const palette = {
  gold: "#C79A3E",
  goldSoft: "#E4C878",
  rust: "#9C3C2A",
  teal: "#1F5C52",
  tealSoft: "#2E7C6F",
  danger: "#C0463A",
  success: "#3C7A57",
};

export const darkTheme = {
  mode: "dark",
  bg: "#120D0A",
  surface: "#1D1611",
  surface2: "#241B15",
  border: "#38291D",
  text: "#F3E9D8",
  muted: "#B7A48C",
  ...palette,
};

export const lightTheme = {
  mode: "light",
  bg: "#F4EEE1",
  surface: "#FFFDF8",
  surface2: "#EFE6D3",
  border: "#DED0AF",
  text: "#26190F",
  muted: "#7A6852",
  ...palette,
};

export const fonts = {
  // Loaded via expo-font in App.js — see src/theme/useLoadedFonts.js
  serif: "Fraunces_600SemiBold",
  serifBold: "Fraunces_700Bold",
  body: "WorkSans_400Regular",
  bodyMedium: "WorkSans_500Medium",
  bodySemibold: "WorkSans_600SemiBold",
  mono: "IBMPlexMono_500Medium",
};
