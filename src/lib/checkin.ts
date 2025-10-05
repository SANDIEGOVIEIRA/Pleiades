// src/lib/checkin.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

export type CheckInTag =
  | "muito_quente" | "muito_frio" | "choveu" | "ventou"
  | "desconforto" | "ceu_aberto" | "nublado";

export type CheckIn = {
  id: string;                // timestamp
  createdAt: string;         // ISO
  lat: number;
  lon: number;
  dateISO: string;           // data consultada
  label: string;
  profileKey: string;
  // snapshot das probabilidades calculadas
  probs: {
    veryHot: number;
    veryCold: number;
    veryWindy: number;
    veryWet: number;
    veryUncomfortable: number;
    veryHighRad?: number;
  };
  // percepção do usuário
  tags: CheckInTag[];
  notes?: string;
};

const KEY = "pleiades.checkins.v1";

export async function getAllCheckins(): Promise<CheckIn[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CheckIn[];
  } catch {
    return [];
  }
}

export async function addCheckin(c: CheckIn) {
  const all = await getAllCheckins();
  all.unshift(c); // mais recente primeiro
  await AsyncStorage.setItem(KEY, JSON.stringify(all));
}

export async function clearCheckins() {
  await AsyncStorage.removeItem(KEY);
}

export function toCSV(items: CheckIn[]) {
  const head =
    "id,createdAt,lat,lon,dateISO,label,profileKey,veryHot,veryCold,veryWindy,veryWet,veryUncomfortable,veryHighRad,tags,notes";
  const rows = items.map((it) =>
    [
      it.id,
      it.createdAt,
      it.lat,
      it.lon,
      it.dateISO,
      q(it.label),
      it.profileKey,
      it.probs.veryHot,
      it.probs.veryCold,
      it.probs.veryWindy,
      it.probs.veryWet,
      it.probs.veryUncomfortable,
      it.probs.veryHighRad ?? "",
      it.tags.join("|"),
      q(it.notes ?? ""),
    ].join(",")
  );
  return [head, ...rows].join("\n");
}

function q(s: string) {
  return `"${(s ?? "").replace(/"/g, '""')}"`;
}
