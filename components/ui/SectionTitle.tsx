import { useState, type ReactNode } from "react";
import { Text, View, type LayoutChangeEvent } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useAppTheme } from "../../hooks/useAppTheme";
import { useLanguage } from "../../utils/i18n";

export type CardTone = "plain" | "green" | "blue" | "amber" | "navy" | "teal" | "rose";

export const CARD_TONES: Record<
  CardTone,
  { page: string; bg: string; border: string; brush: string; brushDark: string; bar: string }
> = {
  plain: { page: "#FAF7F0", bg: "#FFFFFF", border: "#E2E8F0", brush: "#86EFAC", brushDark: "#166534", bar: "#15803D" },
  green: { page: "#E7F6EC", bg: "#F0FDF4", border: "#BBF7D0", brush: "#86EFAC", brushDark: "#166534", bar: "#15803D" },
  blue: { page: "#E8F1FC", bg: "#EFF6FF", border: "#BFDBFE", brush: "#93C5FD", brushDark: "#1D4ED8", bar: "#2563EB" },
  amber: { page: "#FBF3DD", bg: "#FFFBEB", border: "#FDE68A", brush: "#FCD34D", brushDark: "#B45309", bar: "#D97706" },
  navy: { page: "#E6EAF8", bg: "#EEF2FF", border: "#C7D2FE", brush: "#A5B4FC", brushDark: "#3730A3", bar: "#0B2A5B" },
  teal: { page: "#E4F6F2", bg: "#F0FDFA", border: "#99F6E4", brush: "#5EEAD4", brushDark: "#0F766E", bar: "#0D9488" },
  rose: { page: "#FCEAED", bg: "#FFF1F2", border: "#FECDD3", brush: "#FDA4AF", brushDark: "#BE123C", bar: "#E11D48" },
};

/** Page canvas color that matches the title brush-stroke tone. */
export function pageToneColor(tone: CardTone, isDark: boolean, fallback: string) {
  if (isDark) return fallback;
  return CARD_TONES[tone].page;
}

/** Rectangular paint stroke with feathered ends — matches highlighter/brush references. */
function TitleBrushStroke({
  width,
  height,
  color,
  colorSoft,
}: {
  width: number;
  height: number;
  color: string;
  colorSoft: string;
}) {
  if (width < 8 || height < 8) return null;
  const w = width;
  const h = height;
  // Mostly rectangular body; rough bristle edges on left/right ends.
  const d = [
    `M ${w * 0.01} ${h * 0.3}`,
    `L ${w * 0.025} ${h * 0.14}`,
    `L ${w * 0.05} ${h * 0.2}`,
    `L ${w * 0.08} ${h * 0.12}`,
    `L ${w * 0.14} ${h * 0.16}`,
    `L ${w * 0.86} ${h * 0.14}`,
    `L ${w * 0.91} ${h * 0.1}`,
    `L ${w * 0.95} ${h * 0.18}`,
    `L ${w * 0.985} ${h * 0.12}`,
    `L ${w * 0.995} ${h * 0.34}`,
    `L ${w * 0.98} ${h * 0.7}`,
    `L ${w * 0.955} ${h * 0.86}`,
    `L ${w * 0.92} ${h * 0.78}`,
    `L ${w * 0.87} ${h * 0.86}`,
    `L ${w * 0.14} ${h * 0.84}`,
    `L ${w * 0.09} ${h * 0.9}`,
    `L ${w * 0.05} ${h * 0.8}`,
    `L ${w * 0.02} ${h * 0.88}`,
    `L ${w * 0.005} ${h * 0.66}`,
    "Z",
  ].join(" ");

  return (
    <Svg height={h} pointerEvents="none" style={{ position: "absolute", left: 0, top: 0 }} width={w}>
      <Path d={d} fill={color} opacity={0.92} />
      <Path d={d} fill={colorSoft} opacity={0.35} />
    </Svg>
  );
}

export function SectionTitle({
  title,
  subtitle,
  size = "md",
  tone = "green",
  trailing,
}: {
  title: string;
  subtitle?: string;
  size?: "sm" | "md";
  tone?: CardTone;
  trailing?: ReactNode;
}) {
  const { t } = useLanguage();
  const { colors, isDark } = useAppTheme();
  const palette = CARD_TONES[tone];
  const [brushSize, setBrushSize] = useState({ width: 0, height: 0 });
  const fontSize = size === "sm" ? 14 : 17;
  const barHeight = size === "sm" ? 18 : 22;

  const onTitleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width !== brushSize.width || height !== brushSize.height) {
      setBrushSize({ width, height });
    }
  };

  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{ flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center" }}>
          <View style={{ width: 4, height: barHeight, borderRadius: 4, backgroundColor: palette.bar, marginRight: 10 }} />
          <View onLayout={onTitleLayout} style={{ position: "relative", alignSelf: "flex-start", maxWidth: "100%", flexShrink: 1 }}>
            <TitleBrushStroke
              color={isDark ? palette.brushDark : palette.brush}
              colorSoft={isDark ? palette.brush : palette.brush}
              height={Math.max(brushSize.height + 8, 28)}
              width={Math.max(brushSize.width + 20, 72)}
            />
            <Text
              numberOfLines={2}
              style={{
                position: "relative",
                zIndex: 1,
                paddingHorizontal: 12,
                paddingVertical: size === "sm" ? 5 : 6,
                color: colors.primary,
                fontFamily: "Poppins_700Bold",
                fontSize,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              {t(title)}
            </Text>
          </View>
        </View>
        {trailing ? <View style={{ marginLeft: 10 }}>{trailing}</View> : null}
      </View>
      {subtitle ? (
        <View
          style={{
            marginTop: 10,
            borderRadius: 12,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: isDark ? colors.line : palette.border,
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}
        >
          <Text style={{ color: colors.promoText, fontFamily: "Poppins_600SemiBold", fontSize: 13, lineHeight: 19 }}>
            {t(subtitle)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
