import { useState } from "react";
import { View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

interface RateSparklineProps {
  values: number[];
  height: number;
  color: string;
  width?: number;
}

function chartPaths(values: number[], width: number, height: number) {
  const padding = 4;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values.map((value, index) => ({
    x: padding + (index / (values.length - 1)) * (width - padding * 2),
    y: height - padding - ((value - min) / range) * (height - padding * 2),
  }));
  const line = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  const area = `${line} L${lastPoint.x},${height - 1} L${firstPoint.x},${height - 1} Z`;
  return { line, area, lastPoint };
}

function SparklineSvg({ values, width, height, color }: Required<RateSparklineProps>) {
  const { line, area, lastPoint } = chartPaths(values, width, height);
  const rising = values[values.length - 1] >= values[0];

  return (
    <Svg
      accessibilityLabel={`Rate moved from ${values[0]} to ${values[values.length - 1]}`}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
    >
      <Path d={area} fill={color} fillOpacity={rising ? 0.16 : 0.12} />
      <Path d={line} fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} />
      <Circle cx={lastPoint.x} cy={lastPoint.y} fill={color} r={3.5} />
    </Svg>
  );
}

export function RateSparkline({ values, height, color, width }: RateSparklineProps) {
  const [measured, setMeasured] = useState(0);
  if (values.length < 2) return null;

  if (width && width > 8) {
    return <SparklineSvg color={color} height={height} values={values} width={width} />;
  }

  return (
    <View
      onLayout={(event) => {
        const next = Math.floor(event.nativeEvent.layout.width);
        if (next > 0 && next !== measured) setMeasured(next);
      }}
      style={{ width: "100%", height, overflow: "hidden" }}
    >
      {measured > 8 ? <SparklineSvg color={color} height={height} values={values} width={measured} /> : null}
    </View>
  );
}
