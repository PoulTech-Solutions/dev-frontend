import { useState } from "react";
import { Text, View } from "react-native";
import Svg, { Circle, Line, Path } from "react-native-svg";
import { useAppTheme } from "../../hooks/useAppTheme";

export interface ChartPoint {
  label: string;
  value: number;
}

interface RateChartProps {
  points: ChartPoint[];
  height: number;
  color: string;
  formatValue: (value: number) => string;
}

const PAD = 8;

function place(points: ChartPoint[], width: number, height: number) {
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const span = Math.max(points.length - 1, 1);
  return points.map((point, index) => ({
    x: PAD + (index / span) * (width - PAD * 2),
    y: height - PAD - ((point.value - min) / range) * (height - PAD * 2),
  }));
}

export function RateChart({ points, height, color, formatValue }: RateChartProps) {
  const { colors } = useAppTheme();
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);
  if (points.length < 1) return null;

  const spots = width > 8 ? place(points, width, height) : [];
  const line = spots.map((spot, index) => `${index === 0 ? "M" : "L"}${spot.x},${spot.y}`).join(" ");
  const first = spots[0];
  const last = spots[spots.length - 1];
  const area = first && last ? `${line} L${last.x},${height - 1} L${first.x},${height - 1} Z` : "";
  const spot = active != null ? spots[active] : undefined;
  const point = active != null ? points[active] : undefined;
  const tipWidth = 112;
  const tipLeft = spot ? Math.min(Math.max(4, spot.x - tipWidth / 2), Math.max(4, width - tipWidth - 4)) : 0;
  const tipTop = spot ? (spot.y < 46 ? spot.y + 10 : Math.max(4, spot.y - 46)) : 0;

  const select = (x: number) => {
    if (width < 8) return;
    const ratio = Math.min(1, Math.max(0, (x - PAD) / (width - PAD * 2)));
    setActive(Math.round(ratio * (points.length - 1)));
  };

  return (
    <View
      accessibilityLabel="Rate trend. Move across the line to read a date and price."
      className="cursor-crosshair"
      onLayout={(event) => {
        const next = Math.floor(event.nativeEvent.layout.width);
        if (next > 0 && next !== width) setWidth(next);
      }}
      onPointerLeave={() => setActive(null)}
      onPointerMove={(event) => {
        const native = event.nativeEvent as { locationX?: number; offsetX?: number };
        select(native.locationX ?? native.offsetX ?? 0);
      }}
      style={{ width: "100%", height, overflow: "hidden" }}
    >
      {width > 8 && first && last ? (
        <Svg height={height} viewBox={`0 0 ${width} ${height}`} width={width}>
          <Path d={area} fill={color} fillOpacity={0.14} />
          <Path d={line} fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} />
          {spot ? <Line stroke={color} strokeOpacity={0.45} strokeWidth={1} x1={spot.x} x2={spot.x} y1={PAD} y2={height - PAD} /> : null}
          <Circle cx={(spot ?? last).x} cy={(spot ?? last).y} fill={color} r={4} />
        </Svg>
      ) : null}
      {point && spot ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: tipLeft,
            top: tipTop,
            width: tipWidth,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.line,
            backgroundColor: colors.card,
            paddingHorizontal: 8,
            paddingVertical: 5,
          }}
        >
          <Text style={{ color: colors.muted, fontFamily: "Poppins_500Medium", fontSize: 11 }}>{point.label}</Text>
          <Text style={{ color: colors.ink, fontFamily: "Poppins_700Bold", fontSize: 13 }}>₹{formatValue(point.value)}</Text>
        </View>
      ) : null}
    </View>
  );
}
