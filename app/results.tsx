import { router, useLocalSearchParams } from "expo-router";
import Results from "../src/screens/Results";

export default function ResultsRoute() {
  const p = useLocalSearchParams<{
    lat?: string; lon?: string; dateISO?: string; label?: string;
    profileKey?: string; hour?: string; period?: string; trendOn?: string;
  }>();
  return (
    <Results
      query={{
        lat: Number(p.lat ?? "0"),
        lon: Number(p.lon ?? "0"),
        dateISO: String(p.dateISO ?? new Date().toISOString().slice(0,10)),
        label: String(p.label ?? "Local"),
        profileKey: String(p.profileKey ?? "praia"),
        hour: p.hour !== undefined ? Number(p.hour) : undefined,
        period: p.period as any,
        trendOn: p.trendOn === "1",
      }}
      onBack={() => router.back()}
    />
  );
}
