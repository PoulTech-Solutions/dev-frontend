import { themeColors, useThemeStore } from "../store/useThemeStore";

export function useAppTheme() {
  const appearance = useThemeStore((state) => state.appearance);
  return { appearance, colors: themeColors(appearance), isDark: appearance === "dark" };
}
