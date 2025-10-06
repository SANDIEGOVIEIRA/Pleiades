import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import Card from "../components/Card";
import {
  addCheckin,
  toCSV as checkinsToCSV,
  getAllCheckins,
  type CheckInTag,
} from "../lib/checkin";
import {
  applyTrendAdjust,
  summarizeByHour,
  summarizeProbabilities,
  type ClimateSample,
  type Summary,
} from "../lib/climate";
import { profiles } from "../lib/profiles";
import {
  fetchClimateWindowHourly,
  fetchClimateWindowHourlyPeriod,
  fetchClimateWindowWithMeta,
  scanNextDays,
} from "../services/nasa";

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

type Props = { query: Query; onBack: () => void };

export default function Results({ query, onBack }: Props) {
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [probs, setProbs] = useState<Summary | null>(null);
  const [metaText, setMetaText] = useState("—");
  const [suggestions, setSuggestions] = useState<
    Array<{ dateISO: string; summary: Summary; score: number }>
  >([]);

  const [tags, setTags] = useState<CheckInTag[]>([]);
  const [notes, setNotes] = useState("");

  const thresholds = useMemo(
    () => profiles[query.profileKey] ?? profiles["praia"],
    [query.profileKey]
  );

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);

        const daily = await fetchClimateWindowWithMeta(
          query.lat,
          query.lon,
          query.dateISO
        );

        let final: Summary = summarizeProbabilities(daily.samples, thresholds);
        let tag = `Fonte: ${daily.meta.source} • Amostras(dia): ${daily.meta.nDaily} • Anos: ${rangeString(
          daily.meta.years
        )}`;

        if (query.period) {
          const hr = await fetchClimateWindowHourlyPeriod(
            query.lat,
            query.lon,
            query.dateISO,
            query.period
          );
          if (hr.samples.length > 0) {
            final = summarizeByHour(hr.samples, thresholds);
            const label =
              query.period === "morning"
                ? "manhã"
                : query.period === "afternoon"
                ? "tarde"
                : query.period === "night"
                ? "noite"
                : "madrugada";
            tag += ` • Período: ${label} • Amostras(hora): ${hr.meta.nHourly}`;
          } else {
            tag += ` • Período: sem dados horários (usando diário)`;
          }
        } else if (typeof query.hour === "number") {
          const hours = [
            Math.max(0, query.hour - 1),
            query.hour,
            Math.min(23, query.hour + 1),
          ];
          const hr = await fetchClimateWindowHourly(
            query.lat,
            query.lon,
            query.dateISO,
            hours
          );
          if (hr.samples.length > 0) {
            final = summarizeByHour(hr.samples, thresholds);
            tag += ` • Horário: ${query.hour}h (±1h) • Amostras(hora): ${hr.meta.nHourly}`;
          } else {
            tag += ` • Horário: sem dados horários (usando diário)`;
          }
        }

        if (query.trendOn) {
          const { baseSamples, recentSamples } = splitBaseRecent(daily.samples);
          if (baseSamples.length && recentSamples.length) {
            const baseProb = summarizeProbabilities(baseSamples, thresholds);
            const recentProb = summarizeProbabilities(recentSamples, thresholds);
            const adj = applyTrendAdjust(final, recentProb);
            final = adj.adjusted;

            const dHot = signed(adj.delta.veryHot);
            const dWet = signed(adj.delta.veryWet);
            tag += ` • Tendência aplicada (recentes vs base): quente ${dHot}pp, chuva ${dWet}pp`;
          } else {
            tag += ` • Tendência: dados insuficientes`;
          }
        }

        let recs: Array<{ dateISO: string; summary: Summary; score: number }> =
          [];
        if (query.recommend7d) {
          recs = await scanNextDays(query.lat, query.lon, query.dateISO, {
            profileKey: query.profileKey,
            hour: query.period ? undefined : query.hour,
            period: query.period,
            days: 7,
          });
        }

        if (!mounted) return;
        setProbs(final);
        setMetaText(tag);
        setSuggestions(recs.slice(0, 3));
      } catch {
        Alert.alert("Erro", "Falha ao calcular probabilidades.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [query, thresholds]);

  async function exportJSON() {
    if (!probs) return;
    const payload = {
      query,
      profileThresholds: thresholds,
      meta: metaText,
      probabilities: probs,
      suggestions,
    };
    const content = JSON.stringify(payload, null, 2);
    await saveAndShareFile(`shaula_export_${Date.now()}.json`, content);
  }
  async function exportCSV() {
    if (!probs) return;
    const rows = [
      "metric,percent",
      `veryHot,${probs.veryHot}`,
      `veryCold,${probs.veryCold}`,
      `veryWindy,${probs.veryWindy}`,
      `veryWet,${probs.veryWet}`,
      `veryUncomfortable,${probs.veryUncomfortable}`,
      `veryHighRad,${probs.veryHighRad}`,
    ];
    await saveAndShareFile(
      `shaula_export_${Date.now?.() ?? Date.now()}.csv`,
      rows.join("\n")
    );
  }
  async function saveAndShareFile(filename: string, content: string) {
    try {
      const FS: any = FileSystem as any;
      const baseDir: string =
        (FS.cacheDirectory as string) ?? (FS.documentDirectory as string) ?? "";
      const uri = `${baseDir}${filename}`;
      await FileSystem.writeAsStringAsync(uri, content);
      const canShare =
        Platform.OS !== "web" && (await Sharing.isAvailableAsync());
      if (canShare) await Sharing.shareAsync(uri, { mimeType: guessMime(filename) });
      else {
        await Share.share({ message: content });
        Alert.alert(
          "Export",
          "Arquivo gerado. Em navegador, o conteúdo foi compartilhado como texto."
        );
      }
    } catch {
      Alert.alert("Export", "Falha ao salvar/compartilhar o arquivo.");
    }
  }
  function guessMime(name: string) {
    if (name.endsWith(".json")) return "application/json";
    if (name.endsWith(".csv")) return "text/csv";
    return "text/plain";
  }

  const CHIP_OPTIONS: Array<{ k: CheckInTag; label: string }> = [
    { k: "muito_quente", label: "Muito quente" },
    { k: "muito_frio", label: "Muito frio" },
    { k: "choveu", label: "Choveu" },
    { k: "ventou", label: "Ventou" },
    { k: "desconforto", label: "Desconforto" },
    { k: "ceu_aberto", label: "Céu aberto" },
    { k: "nublado", label: "Nublado" },
  ];
  function toggleTag(k: CheckInTag) {
    setTags((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));
  }
  async function submitCheckin() {
    if (!probs) {
      Alert.alert("Check-in", "Calcule primeiro as probabilidades.");
      return;
    }
    await addCheckin({
      id: `${Date.now()}`,
      createdAt: new Date().toISOString(),
      lat: query.lat,
      lon: query.lon,
      dateISO: query.dateISO,
      label: query.label,
      profileKey: query.profileKey,
      probs: {
        veryHot: probs.veryHot,
        veryCold: probs.veryCold,
        veryWindy: probs.veryWindy,
        veryWet: probs.veryWet,
        veryUncomfortable: probs.veryUncomfortable,
        veryHighRad: probs.veryHighRad,
      },
      tags,
      notes: notes.trim() || undefined,
    });
    setTags([]);
    setNotes("");
    Alert.alert(
      "Check-in",
      "Obrigado! Seu relato ficou salvo no aparelho e pode ser exportado (JSON/CSV)."
    );
  }
  async function exportCheckinsJSON() {
    const all = await getAllCheckins();
    const content = JSON.stringify({ count: all.length, items: all }, null, 2);
    await saveAndShareFile(`pleiades_checkins_${Date.now()}.json`, content);
  }
  async function exportCheckinsCSV() {
    const all = await getAllCheckins();
    await saveAndShareFile(
      `pleiades_checkins_${Date.now()}.csv`,
      checkinsToCSV(all)
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff", paddingTop: insets.top }}>
      <View style={{ flex: 1, paddingHorizontal: 16 }}>
        <View style={styles.header}>
          <Text style={styles.h1}>Resultados</Text>
          <Button title="Voltar" onPress={onBack} />
        </View>

        <Text style={styles.sub}>
          {query.label} — {new Date(query.dateISO).toLocaleDateString()}
          {"\n"}Lat: {query.lat.toFixed(2)} • Lon: {query.lon.toFixed(2)} • Perfil:{" "}
          {query.profileKey}
          {query.period
            ? ` • Período: ${
                query.period === "morning"
                  ? "manhã"
                  : query.period === "afternoon"
                  ? "tarde"
                  : query.period === "night"
                  ? "noite"
                  : "madrugada"
              }`
            : typeof query.hour === "number"
            ? ` • Hora: ${query.hour}h (±1h)`
            : ""}
        </Text>

        <Text style={styles.meta}>{metaText}</Text>

        <View style={styles.rowBtns}>
          <TouchableOpacity style={styles.btn} onPress={exportJSON}>
            <Text style={styles.btnText}>Exportar JSON</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={exportCSV}>
            <Text style={styles.btnText}>Exportar CSV</Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.center}>
            <ActivityIndicator />
            <Text style={{ marginTop: 8, color: "#374151" }}>
              Calculando probabilidades…
            </Text>
          </View>
        )}

        {!loading && probs && (
          <ScrollView
            contentContainerStyle={{ paddingVertical: 12, paddingBottom: (insets.bottom || 0) + 24 }}
          >
            <Card title="Muito quente" percent={probs.veryHot} tip="Hidrate-se e evite sol no pico da tarde." />
            <Card title="Muito frio"   percent={probs.veryCold} tip="Use camadas e proteja extremidades." />
            <Card title="Muito ventoso" percent={probs.veryWindy} tip="Atenção a objetos soltos e sensação térmica." />
            <Card title="Muito úmido / chuva" percent={probs.veryWet} tip="Leve capa/guarda-chuva; terreno pode escorregar." />
            <Card title="Muito desconfortável (calor + umidade)" percent={probs.veryUncomfortable} tip="Procure sombra, pausas e hidratação." />
            <Card title="Radiação muito alta" percent={probs.veryHighRad} tip="Use protetor solar, óculos e evite exposição prolongada." />

            {suggestions.length > 0 && (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.h2}>Sugestões (próximos 7 dias)</Text>
                {suggestions.map((s) => (
                  <View key={s.dateISO} style={styles.suggestion}>
                    <Text style={styles.sugTitle}>
                      {new Date(s.dateISO).toLocaleDateString()} — Score {s.score}/100
                    </Text>
                    <Text style={styles.sugMeta}>
                      quente {s.summary.veryHot}% • chuva {s.summary.veryWet}% •
                      desconforto {s.summary.veryUncomfortable}% • rad {s.summary.veryHighRad}%
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Check-in */}
            <View style={{ marginTop: 16 }}>
              <Text style={styles.h2}>Check-in Climático (beta)</Text>
              <Text style={{ color: "#374151", marginBottom: 6 }}>
                Conte como foi na prática. Isso fica salvo no aparelho e pode ser
                exportado para formar um dataset comunitário.
              </Text>

              <View style={styles.chips}>
                {CHIP_OPTIONS.map((opt) => {
                  const active = tags.includes(opt.k);
                  return (
                    <TouchableOpacity
                      key={opt.k}
                      onPress={() => toggleTag(opt.k)}
                      style={[styles.chip, active && styles.chipActive]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TextInput
                placeholder="Observações (opcional)"
                value={notes}
                onChangeText={setNotes}
                style={styles.textArea}
                multiline
              />

              <View style={styles.rowBtns}>
                <TouchableOpacity style={styles.btn} onPress={submitCheckin}>
                  <Text style={styles.btnText}>Salvar check-in</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnOutline} onPress={exportCheckinsJSON}>
                  <Text style={styles.btnOutlineText}>Exportar Check-ins (JSON)</Text>
                </TouchableOpacity>
              </View>
              <View style={{ height: 8 }} />
              <TouchableOpacity style={styles.btnOutline} onPress={exportCheckinsCSV}>
                <Text style={styles.btnOutlineText}>Exportar Check-ins (CSV)</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

// utils
function splitBaseRecent(samples: ClimateSample[], fracRecent = 0.3) {
  const withYear = samples.filter((s) => typeof s.year === "number");
  if (!withYear.length)
    return { baseSamples: [] as ClimateSample[], recentSamples: [] as ClimateSample[] };
  const sorted = [...withYear].sort((a, b) => a.year! - b.year!);
  const cut = Math.max(1, Math.round(sorted.length * fracRecent));
  return {
    baseSamples: sorted.slice(0, sorted.length - cut),
    recentSamples: sorted.slice(-cut),
  };
}
function rangeString(years: number[]) {
  if (!years?.length) return "—";
  return `${Math.min(...years)}–${Math.max(...years)}`;
}
function signed(n: number) {
  return (n >= 0 ? "+" : "") + Math.round(n).toString();
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  h1: { fontSize: 22, fontWeight: "800", color: "#111827" },
  h2: { fontSize: 18, fontWeight: "800", color: "#111827", marginBottom: 6 },
  sub: { marginTop: 6, color: "#374151" },
  meta: { marginTop: 6, color: "#111827", fontWeight: "700" },
  rowBtns: { flexDirection: "row", gap: 8, marginTop: 8, flexWrap: "wrap" },
  btn: { backgroundColor: "#111827", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  btnText: { color: "#fff", fontWeight: "700" },
  btnOutline: { borderWidth: 1, borderColor: "#111827", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  btnOutlineText: { color: "#111827", fontWeight: "700" },
  center: { marginTop: 24, alignItems: "center" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: "#F3F4F6", borderWidth: 1, borderColor: "#E5E7EB" },
  chipActive: { backgroundColor: "#111827", borderColor: "#111827" },
  chipText: { color: "#111827", fontWeight: "700" },
  chipTextActive: { color: "#fff", fontWeight: "700" },
  textArea: { marginTop: 8, minHeight: 80, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, padding: 10, textAlignVertical: "top" },
  suggestion: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, padding: 12, marginBottom: 8 },
  sugTitle: { fontWeight: "800", color: "#111827" },
  sugMeta: { color: "#374151", marginTop: 2 },
});
