import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Text, View } from "react-native";
import { useLanguage } from "../../utils/i18n";

export interface TickerItem {
  label: string;
  value: string;
  change: number;
}

function TickerRow({ items }: { items: TickerItem[] }) {
  const { t, n } = useLanguage();
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {items.map((item, index) => {
        const up = item.change > 0;
        const down = item.change < 0;
        const tone = up ? "#86EFAC" : down ? "#FCA5A5" : "#CBD5E1";
        return (
          <View key={`${item.label}-${index}`} style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 18 }}>
            <Text style={{ color: "#E2E8F0", fontFamily: "Poppins_600SemiBold", fontSize: 13 }}>{t(item.label)}</Text>
            <Text style={{ marginLeft: 8, color: "#FFFFFF", fontFamily: "Poppins_700Bold", fontSize: 13 }}>₹{n(item.value)}</Text>
            <Text style={{ marginLeft: 6, color: tone, fontFamily: "Poppins_600SemiBold", fontSize: 12 }}>
              {item.change > 0 ? "+" : ""}
              {n(item.change)}
            </Text>
            <Text style={{ marginLeft: 16, color: "#64748B", fontFamily: "Poppins_400Regular", fontSize: 12 }}>|</Text>
          </View>
        );
      })}
    </View>
  );
}

export function RateTicker({ items }: { items: TickerItem[] }) {
  const { t } = useLanguage();
  const offset = useRef(new Animated.Value(0)).current;
  const [segmentWidth, setSegmentWidth] = useState(0);
  const running = useRef(true);
  const stableItems = useMemo(() => items, [items]);

  useEffect(() => {
    running.current = true;
    if (segmentWidth < 8) return;

    const duration = Math.max(22000, stableItems.length * 2800);
    const run = () => {
      if (!running.current) return;
      offset.setValue(0);
      Animated.timing(offset, {
        toValue: -segmentWidth,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && running.current) run();
      });
    };

    run();
    return () => {
      running.current = false;
      offset.stopAnimation();
    };
  }, [offset, segmentWidth, stableItems.length]);

  if (!items.length) return null;

  return (
    <View
      accessibilityLabel={t("Live market rates")}
      style={{
        overflow: "hidden",
        borderTopWidth: 1,
        borderTopColor: "#1E3A5F",
        backgroundColor: "#0B2A5B",
        paddingVertical: 10,
      }}
    >
      <Animated.View style={{ flexDirection: "row", alignItems: "center", transform: [{ translateX: offset }] }}>
        <View
          onLayout={(event) => {
            const next = Math.floor(event.nativeEvent.layout.width);
            if (next > 0 && next !== segmentWidth) setSegmentWidth(next);
          }}
        >
          <TickerRow items={stableItems} />
        </View>
        <TickerRow items={stableItems} />
      </Animated.View>
    </View>
  );
}
