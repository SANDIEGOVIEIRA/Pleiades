import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { theme } from "../constants/theme";

type Props = {
  label: string;
  children: React.ReactNode;
  labelColor?: string;
  right?: React.ReactNode;
  containerStyle?: ViewStyle;
};

export default function InputRow({
  label,
  children,
  labelColor,
  right,
  containerStyle,
}: Props) {
  return (
    <View style={[styles.row, containerStyle]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.label, labelColor ? { color: labelColor } : null]}>
          {label}
        </Text>
        {children}
      </View>
      {right ? <View style={{ marginLeft: 8 }}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  label: {
    color: theme.textSoft,
    fontWeight: "700",
    marginBottom: 6,
  },
});
