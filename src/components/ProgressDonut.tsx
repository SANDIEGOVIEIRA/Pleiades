// src/components/ProgressDonut.tsx
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

type Props = {
  size?: number;        // px
  stroke?: number;      // espessura
  percent: number;      // 0..100
  color: string;        // cor do arco
  label?: string;       // texto central opcional
};

export default function ProgressDonut({
  size = 72,
  stroke = 10,
  percent,
  color,
  label,
}: Props) {
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (clamped / 100) * circ;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#1F2937"
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation="-90"
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={styles.val}>{Math.round(clamped)}%</Text>
        {label ? <Text style={styles.label}>{label}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  val: { color: "#E5E7EB", fontWeight: "800" },
  label: { color: "#94A3B8", fontSize: 10, marginTop: 2 },
});
