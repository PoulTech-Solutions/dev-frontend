import { useWindowDimensions } from "react-native";

export const SIDEBAR_BREAKPOINT = 768;
export const SIDEBAR_WIDTH = 232;

export function useAppLayout() {
  const { width: viewportWidth } = useWindowDimensions();
  const sidebarVisible = viewportWidth >= SIDEBAR_BREAKPOINT;
  const sidebarWidth = sidebarVisible ? SIDEBAR_WIDTH : 0;

  return {
    viewportWidth,
    width: Math.max(0, viewportWidth - sidebarWidth),
    sidebarVisible,
    sidebarWidth,
  };
}
