import type { ReactNode } from "react";
import { View } from "react-native";
import { useAppTheme } from "../../hooks/useAppTheme";
import { CARD_TONES, type CardTone } from "./SectionTitle";

export function MainCard({
  children,
  tone = "plain",
  padded = true,
  style,
}: {
  children: ReactNode;
  tone?: CardTone;
  padded?: boolean;
  style?: object;
}) {
  const { colors, isDark } = useAppTheme();
  const palette = CARD_TONES[tone];
  const useTint = !isDark && tone !== "plain";

  return (
    <View
      style={[
        {
          overflow: "hidden",
          borderWidth: 1,
          borderColor: isDark ? colors.line : palette.border,
          borderRadius: 18,
          backgroundColor: isDark ? colors.card : useTint ? palette.bg : colors.card,
          padding: padded ? 14 : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
