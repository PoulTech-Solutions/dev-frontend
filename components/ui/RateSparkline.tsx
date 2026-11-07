import Svg, { Circle, Path } from "react-native-svg";

interface RateSparklineProps {
  values: number[];
  width: number;
  height: number;
  color: string;
}

export function RateSparkline({ values, width, height, color }: RateSparklineProps) {
  if (values.length < 2) return null;

  const padding = 3;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values.map((value, index) => ({
    x: padding + (index / (values.length - 1)) * (width - padding * 2),
    y: height - padding - ((value - min) / range) * (height - padding * 2),
  }));
  const line = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
    .join(" ");
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  const area = `${line} L${lastPoint.x},${height} L${firstPoint.x},${height} Z`;

  return (
    <Svg
      accessibilityLabel={`Sample rate trend from ${values[0]} to ${values[values.length - 1]}`}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
    >
      <Path d={area} fill={color} fillOpacity={0.1} />
      <Path
        d={line}
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
      <Circle cx={lastPoint.x} cy={lastPoint.y} fill={color} r={2.5} />
    </Svg>
  );
}
