// src/components/Card.tsx
import { FontAwesome5 } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { riskColor, theme } from "../constants/theme";
import ProgressDonut from "./ProgressDonut";

type Props = {
  title: string;
  percent: number;   // 0..100
  tip?: string;
};

export default function Card({ title, percent, tip }: Props) {
  const color = riskColor(percent);
  const subtitle = percent >= 51 ? "Provável"
    : percent >= 26 ? "Possível"
    : "Pouco provável";

  const icon = pickIcon(title);

  return (
    <View style={[styles.card, theme.shadow.card]}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <FontAwesome5 name={icon} size={18} color={theme.text} />
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.row}>
        <ProgressDonut percent={percent} color={color} />
        <View style={styles.info}>
          <Text style={[styles.subtitle, { color }]}>{subtitle}</Text>
          {tip ? <Text style={styles.tip}>{tip}</Text> : null}
        </View>
      </View>
    </View>
  );
}

// mapeia ícones pelo título (simples e efetivo)
function pickIcon(title: string): any {
  const t = title.toLowerCase();
  if (t.includes("quente")) return "thermometer-full";
  if (t.includes("frio")) return "snowflake";
  if (t.includes("vento")) return "wind";
  if (t.includes("úmido") || t.includes("chuva")) return "cloud-showers-heavy";
  if (t.includes("desconfort")) return "tired";
  if (t.includes("radia")) return "sun";
  return "info-circle";
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: theme.radius.xl,
    padding: 14,
    marginBottom: 12,
  },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  iconWrap: {
    backgroundColor: theme.cardSoft,
    width: 32, height: 32,
    borderRadius: theme.radius.pill,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    borderWidth: 1, borderColor: theme.border,
  },
  title: { color: theme.text, fontWeight: "800", fontSize: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  info: { flex: 1 },
  subtitle: { fontWeight: "800", fontSize: 16, marginBottom: 6 },
  tip: { color: theme.textSoft, lineHeight: 20 },
});
