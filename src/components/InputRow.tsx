import React from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  label: string;
  children: React.ReactNode;
};

export default function InputRow({ label, children }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.field}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { marginBottom: 12 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 6, color: "#111827" },
  field: {},
});
