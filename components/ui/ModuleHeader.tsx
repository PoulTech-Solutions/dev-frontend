import { useState, type ReactNode } from "react";
import { Text, View, type LayoutChangeEvent } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useAppTheme } from "../../hooks/useAppTheme";
import { useLanguage } from "../../utils/i18n";
import { CARD_TONES, type CardTone } from "./SectionTitle";

function PageBrushStroke({
  width,
  height,
  color,
}: {
  width: number;
  height: number;
  color: string;
}) {
  if (width < 8 || height < 8) return null;
  const w = width;
  const h = height;
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
      <Path d={d} fill={color} opacity={0.9} />
      <Path d={d} fill={color} opacity={0.28} />
    </Svg>
  );
}

interface ModuleHeaderProps {
  title: string;
  subtitle: string;
  tone?: CardTone;
  trailing?: ReactNode;
  leading?: ReactNode;
}

export function ModuleHeader({ title, subtitle, tone = "green", trailing, leading }: ModuleHeaderProps) {
  const { t } = useLanguage();
  const { colors, isDark } = useAppTheme();
  const palette = CARD_TONES[tone === "plain" ? "green" : tone];
  const [brushSize, setBrushSize] = useState({ width: 0, height: 0 });

  const onTitleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width !== brushSize.width || height !== brushSize.height) {
      setBrushSize({ width, height });
    }
  };

  return (
    <View style={{ marginBottom: 20 }}>
      {leading}
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ width: 5, height: 28, borderRadius: 4, backgroundColor: palette.bar, marginRight: 10 }} />
            <View onLayout={onTitleLayout} style={{ position: "relative", alignSelf: "flex-start", maxWidth: "100%", flexShrink: 1 }}>
              <PageBrushStroke
                color={isDark ? palette.brushDark : palette.brush}
                height={Math.max(brushSize.height + 10, 40)}
                width={Math.max(brushSize.width + 28, 100)}
              />
              <Text
                numberOfLines={2}
                style={{
                  position: "relative",
                  zIndex: 1,
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  color: colors.primary,
                  fontFamily: "Poppins_700Bold",
                  fontSize: 24,
                  lineHeight: 32,
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
                }}
              >
                {t(title)}
              </Text>
            </View>
          </View>
          <Text
            style={{
              marginTop: 8,
              marginLeft: 15,
              color: colors.muted,
              fontFamily: "Poppins_400Regular",
              fontSize: 13,
              lineHeight: 20,
            }}
          >
            {t(subtitle)}
          </Text>
        </View>
        {trailing ? <View style={{ paddingTop: 4 }}>{trailing}</View> : null}
      </View>
    </View>
  );
}
