import dayjs from "dayjs";
import * as Location from "expo-location";
import React, { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import InputRow from "../components/InputRow";
import { theme } from "../constants/theme";
import { profiles } from "../lib/profiles";

export type Query = {
  lat: number;
  lon: number;
  dateISO: string;
  label: string;
  profileKey: string;
  hour?: number;
  period?: "morning" | "afternoon" | "night" | "dawn";
  trendOn?: boolean;
  recommend7d?: boolean;
};

type Props = { onSubmit: (q: Query) => void };

export default function Home({ onSubmit }: Props) {
  const insets = useSafeAreaInsets();

  const firstProfile = Object.keys(profiles)[0] || "praia";

  const [label, setLabel] = useState("");
  const [lat, setLat] = useState<number>(0);
  const [lon, setLon] = useState<number>(0);
  const [dateISO, setDateISO] = useState(dayjs().format("YYYY-MM-DD"));

  const [profileKey, setProfileKey] = useState(firstProfile);

  const [useHour, setUseHour] = useState(false);
  const [hour, setHour] = useState(14);
  const [period, setPeriod] = useState<Query["period"]>(undefined);

  const [trendOn, setTrendOn] = useState(true);
  const [recommend7d, setRecommend7d] = useState(false);

  const canSubmit = useMemo(
    () =>
      Number.isFinite(lat) &&
      Number.isFinite(lon) &&
      Math.abs(lat) <= 90 &&
      Math.abs(lon) <= 180 &&
      !!dateISO,
    [lat, lon, dateISO]
  );

  async function handleUseMyLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permissão", "Precisamos da sua permissão para acessar a localização.");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      setLat(Number(pos.coords.latitude.toFixed(4)));
      setLon(Number(pos.coords.longitude.toFixed(4)));
      if (!label) setLabel("Minha localização");
    } catch (e) {
      Alert.alert("Erro", "Não foi possível obter sua localização.");
    }
  }

  function submit() {
    if (!canSubmit) {
      Alert.alert("Campos", "Preencha localização e data válidas.");
      return;
    }
    onSubmit({
      lat: Number(lat),
      lon: Number(lon),
      dateISO,
      label: label || "Consulta",
      profileKey,
      hour: useHour && !period ? hour : undefined,
      period,
      trendOn,
      recommend7d,
    });
  }

  const Chip = ({
    active,
    children,
    onPress,
  }: {
    active?: boolean;
    children: React.ReactNode;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{children}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.container,
            {
              paddingTop: insets.top + 4,        // afasta do topo/status bar
              paddingBottom: (insets.bottom || 0) + 24, // evita sobrepor a Tab Bar
            },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.h1}>Plêiades</Text>
          <Text style={styles.subtitle}>
            Consulte probabilidades históricas por atividade, período do dia e local.
          </Text>

          {/* ONDE & QUANDO */}
          <Text style={styles.section}>ONDE & QUANDO</Text>

          <InputRow label="Rótulo (opcional)">
            <TextInput
              value={label}
              onChangeText={setLabel}
              placeholder="Ex.: Praia com amigos"
              placeholderTextColor={theme.textSoft}
              style={styles.input}
            />
          </InputRow>

          <View style={styles.row2}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <InputRow label="Latitude">
                <TextInput
                  keyboardType="numeric"
                  value={String(lat)}
                  onChangeText={(t) => setLat(Number(t.replace(",", ".")) || 0)}
                  placeholder="-9.5656"
                  placeholderTextColor={theme.textSoft}
                  style={styles.input}
                />
              </InputRow>
            </View>
            <View style={{ flex: 1 }}>
              <InputRow label="Longitude">
                <TextInput
                  keyboardType="numeric"
                  value={String(lon)}
                  onChangeText={(t) => setLon(Number(t.replace(",", ".")) || 0)}
                  placeholder="-35.7512"
                  placeholderTextColor={theme.textSoft}
                  style={styles.input}
                />
              </InputRow>
            </View>
          </View>

          <View style={styles.row2}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <InputRow label="Data (YYYY-MM-DD)">
                <TextInput
                  value={dateISO}
                  onChangeText={setDateISO}
                  placeholder={dayjs().format("YYYY-MM-DD")}
                  placeholderTextColor={theme.textSoft}
                  style={styles.input}
                />
              </InputRow>
            </View>

            <TouchableOpacity style={styles.locBtn} onPress={handleUseMyLocation}>
              <Text style={styles.locBtnText}>Usar minha localização</Text>
            </TouchableOpacity>
          </View>

          {/* PERSONALIZE */}
          <Text style={styles.section}>PERSONALIZE A CONSULTA</Text>

          <Text style={styles.labelSmall}>Perfil de atividade</Text>
          <View style={styles.chipsWrap}>
            {Object.keys(profiles).map((k) => (
              <Chip key={k} active={k === profileKey} onPress={() => setProfileKey(k)}>
                {k}
              </Chip>
            ))}
          </View>

          <Text style={[styles.labelSmall, { marginTop: 10 }]}>Período do dia (opcional)</Text>
          <View style={styles.chipsWrap}>
            <Chip active={!period} onPress={() => setPeriod(undefined)}>
              nenhum
            </Chip>
            <Chip active={period === "morning"} onPress={() => setPeriod("morning")}>
              manhã
            </Chip>
            <Chip active={period === "afternoon"} onPress={() => setPeriod("afternoon")}>
              tarde
            </Chip>
            <Chip active={period === "night"} onPress={() => setPeriod("night")}>
              noite
            </Chip>
            <Chip active={period === "dawn"} onPress={() => setPeriod("dawn")}>
              madrugada
            </Chip>
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Filtrar por horário específico</Text>
            <Switch
              value={useHour}
              onValueChange={(v) => {
                setUseHour(v);
                if (v) setPeriod(undefined);
              }}
              thumbColor={useHour ? theme.primary : "#fff"}
              trackColor={{ true: theme.primaryDark, false: "#475569" }}
            />
          </View>

          {useHour && (
            <>
              <Text style={styles.labelSmall}>Hora do dia</Text>
              <View style={styles.chipsWrap}>
                {[8, 10, 12, 14, 16, 18, 20].map((h) => (
                  <Chip key={h} active={hour === h} onPress={() => setHour(h)}>
                    {h}h
                  </Chip>
                ))}
              </View>
            </>
          )}

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Aplicar tendência (recentes vs base)</Text>
            <Switch
              value={trendOn}
              onValueChange={setTrendOn}
              thumbColor={trendOn ? theme.primary : "#fff"}
              trackColor={{ true: theme.primaryDark, false: "#475569" }}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Sugerir melhores dias (próximos 7)</Text>
            <Switch
              value={recommend7d}
              onValueChange={setRecommend7d}
              thumbColor={recommend7d ? theme.primary : "#fff"}
              trackColor={{ true: theme.primaryDark, false: "#475569" }}
            />
          </View>

          <TouchableOpacity
            onPress={submit}
            disabled={!canSubmit}
            style={[styles.cta, !canSubmit && { opacity: 0.5 }]}
          >
            <Text style={styles.ctaText}>CONSULTAR</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    backgroundColor: theme.bg,
  },
  h1: { color: theme.text, fontWeight: "900", fontSize: 26 },
  subtitle: { color: theme.textSoft, marginTop: 4, marginBottom: 12 },

  section: {
    color: theme.textSoft,
    fontWeight: "800",
    marginTop: 14,
    marginBottom: 8,
    letterSpacing: 0.3,
  },

  row2: { flexDirection: "row", alignItems: "flex-end", marginBottom: 8 },

  input: {
    backgroundColor: theme.card,
    color: theme.text,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  locBtn: {
    height: 44,
    justifyContent: "center",
    paddingHorizontal: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.card,
  },
  locBtnText: { color: theme.text, fontWeight: "700" },

  labelSmall: { color: theme.textSoft, fontWeight: "700", marginBottom: 6 },

  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },

  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.card,
  },
  chipActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  chipText: { color: theme.text, fontWeight: "700" },
  chipTextActive: { color: "#fff", fontWeight: "800" },

  switchRow: {
    marginTop: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switchLabel: { color: theme.text, fontWeight: "700" },

  cta: {
    marginTop: 16,
    backgroundColor: theme.primary,
    borderRadius: theme.radius.xl,
    alignItems: "center",
    paddingVertical: 14,
    ...theme.shadow.card,
  },
  ctaText: { color: "#fff", fontWeight: "900", letterSpacing: 0.4 },
});
