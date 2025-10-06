import dayjs from "dayjs";
import dayOfYear from "dayjs/plugin/dayOfYear";
import type { ClimateHourlySample, ClimateSample } from "../lib/climate";
dayjs.extend(dayOfYear);

// mock para testes
const USE_MOCK = false;

// janela de +/- N dias em torno do dia escolhido (para montar amostra histórica por DOY)
const WINDOW_DAYS = 7;

// Períodos pré-definidos (UTC) para filtragem por parte do dia
export type Period = "morning" | "afternoon" | "night" | "dawn";
const PERIOD_MAP: Record<Period, number[]> = {
  dawn: [0, 1, 2, 3, 4, 5],
  morning: [6, 7, 8, 9, 10, 11],
  afternoon: [12, 13, 14, 15, 16, 17],
  night: [18, 19, 20, 21, 22, 23],
};

export type MetaInfo = {
  source: "POWER" | "MOCK";
  years: number[];
  nDaily: number;
  nHourly?: number;
  trendBaseYears?: number[];
  trendRecentYears?: number[];
};

export type ClimateDailyWithMeta = {
  samples: ClimateSample[];
  meta: MetaInfo;
};

export type ClimateHourlyWithMeta = {
  samples: ClimateHourlySample[];
  meta: MetaInfo;
};

function signed(n: number): string {
  if (n > 0) return `+${n}`;
  if (n < 0) return `${n}`;
  return "0";
}

function range(a: number, b: number): number[] {
  const out: number[] = [];
  for (let i = a; i <= b; i++) out.push(i);
  return out;
}

// MOCKS (fiz para teste de demonstração)

function mockDaily(year: number): ClimateSample {
  // valores aleatórios plausíveis para demo
  const tmax = 28 + Math.random() * 8; // 28–36
  const tmin = 20 + Math.random() * 6; // 20–26
  const rh = 55 + Math.random() * 35;  // 55–90
  const prcp = Math.random() < 0.35 ? Math.random() * 30 : Math.random() * 3;
  const ws = 1 + Math.random() * 7;    // 1–8 m/s
  return { tmax, tmin, rh, prcp, ws, year };
}

function mockHourly(year: number, hour: number): ClimateHourlySample {
  const base = mockDaily(year);
  const t = base.tmin + (base.tmax - base.tmin) * 0.6; // aproximação
  const rh = base.rh;
  const prcp = Math.random() < 0.35 ? Math.random() * 5 : 0;
  const ws = base.ws;
  return { t, rh, prcp, ws, hour, year };
}

type PowerDailyJSON = {
  properties?: {
    parameter?: {
      T2M_MAX?: Record<string, number>;
      T2M_MIN?: Record<string, number>;
      RH2M?: Record<string, number>;
      PRECTOTCORR?: Record<string, number>;
      WS10M?: Record<string, number>;
    };
  };
};

type PowerHourlyJSON = {
  properties?: {
    parameter?: {
      T2M?: Record<string, number>;
      RH2M?: Record<string, number>;
      PRECTOTCORR?: Record<string, number>; // mm/h
      WS10M?: Record<string, number>;
      ALLSKY_SFC_SW_DWN?: Record<string, number>;
    };
  };
};

function parsePowerDaily(json: PowerDailyJSON, years: number[]): ClimateSample[] {
  const p = json?.properties?.parameter;
  if (!p) return [];

  const keys = Object.keys(p.T2M_MAX ?? {});
  const out: ClimateSample[] = [];

  for (const k of keys) {
    // k é "YYYYMMDD"
    const y = Number(k.slice(0, 4));
    const tmax = (p.T2M_MAX ?? {})[k];
    const tmin = (p.T2M_MIN ?? {})[k];
    const rh = (p.RH2M ?? {})[k];
    const prcp = (p.PRECTOTCORR ?? {})[k];
    const ws = (p.WS10M ?? {})[k];

    if (
      [tmax, tmin, rh, prcp, ws].every(
        (v) => typeof v === "number" && Number.isFinite(v)
      )
    ) {
      out.push({ tmax, tmin, rh, prcp, ws, year: y });
    }
  }
  return out;
}

/** Constrói amostras horárias em um único dia */
function parsePowerHourlyForDay(
  json: PowerHourlyJSON,
  year: number
): ClimateHourlySample[] {
  const p = json?.properties?.parameter;
  if (!p) return [];
  const keys = Object.keys(p.T2M ?? {});
  const out: ClimateHourlySample[] = [];

  for (const k of keys) {
    // k é "YYYYMMDDHH"
    const hour = Number(k.slice(8, 10));
    const t = (p.T2M ?? {})[k];
    const rh = (p.RH2M ?? {})[k];
    const prcp = (p.PRECTOTCORR ?? {})[k];
    const ws = (p.WS10M ?? {})[k];

    if ([t, rh, prcp, ws].every((v) => typeof v === "number")) {
      out.push({ t, rh, prcp, ws, hour, year });
    }
  }
  return out;
}

export async function fetchClimateWindowWithMeta(
  lat: number,
  lon: number,
  dateISO: string,
  yearsBack = 10
): Promise<ClimateDailyWithMeta> {
  if (USE_MOCK) {
    const center = dayjs(dateISO);
    const years: number[] = [];
    const samples: ClimateSample[] = [];

    for (let i = 1; i <= yearsBack; i++) {
      const y = center.year() - i;
      years.push(y);

      for (let d = -WINDOW_DAYS; d <= WINDOW_DAYS; d++) {
        samples.push(mockDaily(y));
      }
    }
    return {
      samples,
      meta: {
        source: "MOCK",
        years,
        nDaily: samples.length,
      },
    };
  }

  const center = dayjs(dateISO);
  const doy = center.dayOfYear(); // 1..366
  const years: number[] = [];
  const samples: ClimateSample[] = [];

  for (let i = 1; i <= yearsBack; i++) {
    const y = center.year() - i;
    years.push(y);

    const start = dayjs(`${y}-01-01`).add(doy - WINDOW_DAYS - 1, "day");
    const end = dayjs(`${y}-01-01`).add(doy + WINDOW_DAYS - 1, "day");

    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      community: "ag",
      parameters: ["T2M_MAX", "T2M_MIN", "RH2M", "PRECTOTCORR", "WS10M"].join(","),
      start: start.format("YYYYMMDD"),
      end: end.format("YYYYMMDD"),
      format: "JSON",
    });

    const url = `https://power.larc.nasa.gov/api/temporal/daily/point?${params.toString()}`;
    console.log("[POWER DAILY] URL:", url);

    try {
      const resp = await fetch(url);
      const json = (await resp.json()) as PowerDailyJSON;
      const chunk = parsePowerDaily(json, [y]);
      samples.push(...chunk);
    } catch (err) {
      console.warn("POWER fetch error (daily):", err);
    }
  }

  return {
    samples,
    meta: {
      source: "POWER",
      years,
      nDaily: samples.length,
    },
  };
}

export async function fetchClimateWindow(
  lat: number,
  lon: number,
  dateISO: string,
  yearsBack = 10
): Promise<ClimateSample[]> {
  const { samples } = await fetchClimateWindowWithMeta(lat, lon, dateISO, yearsBack);
  return samples;
}

export async function fetchClimateWindowHourly(
  lat: number,
  lon: number,
  dateISO: string,
  hours?: number[]
): Promise<ClimateHourlyWithMeta> {
  if (USE_MOCK) {
    const y = dayjs(dateISO).year() - 1;
    const hoursList = hours ?? range(0, 23);
    const samples = hoursList.map((h) => mockHourly(y, h));
    return {
      samples,
      meta: {
        source: "MOCK",
        years: [y],
        nDaily: 0,
        nHourly: samples.length,
      },
    };
  }

  const y = dayjs(dateISO).year() - 1;
  const start = dayjs(dateISO).format("YYYYMMDD");
  const end = start;

  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    community: "ag",
    parameters: ["T2M", "RH2M", "PRECTOTCORR", "WS10M", "ALLSKY_SFC_SW_DWN"].join(","),
    start,
    end,
    "time-standard": "UTC",
    format: "JSON",
  });

  const url = `https://power.larc.nasa.gov/api/temporal/hourly/point?${params.toString()}`;
  console.log("[POWER HOURLY] URL:", url);

  let all: ClimateHourlySample[] = [];
  try {
    const resp = await fetch(url);
    const json = (await resp.json()) as PowerHourlyJSON;
    all = parsePowerHourlyForDay(json, y);
  } catch (err) {
    console.warn("POWER fetch error (hourly):", err);
  }

  const filtered =
    !hours || hours.length === 0
      ? all
      : all.filter((s) => hours.includes(s.hour));

  return {
    samples: filtered,
    meta: {
      source: "POWER",
      years: [y],
      nDaily: 0,
      nHourly: filtered.length,
    },
  };
}

export async function fetchClimateWindowHourlyPeriod(
  lat: number,
  lon: number,
  dateISO: string,
  period: Period
): Promise<ClimateHourlyWithMeta> {
  const hours = PERIOD_MAP[period] ?? range(0, 23);
  return fetchClimateWindowHourly(lat, lon, dateISO, hours);
}

import { summarizeByHour, summarizeProbabilities, type Summary } from "../lib/climate";
import { profiles } from "../lib/profiles";

function scoreSummary(s: Summary): number {
  const badWet = s.veryWet;                 // peso alto
  const badUnc = s.veryUncomfortable;      // peso alto
  const badHot = s.veryHot;
  const badWind = s.veryWindy;

  const penalty = badWet * 0.45 + badUnc * 0.35 + badHot * 0.15 + badWind * 0.05;
  let score = 100 - Math.round(penalty);
  if (score < 0) score = 0;
  if (score > 100) score = 100;
  return score;
}
export async function scanNextDays(
  lat: number,
  lon: number,
  dateISO: string,
  opts: {
    profileKey: string;
    days?: number;
    hour?: number;
    period?: Period;
  }
): Promise<Array<{ dateISO: string; summary: Summary; score: number }>> {
  const out: Array<{ dateISO: string; summary: Summary; score: number }> = [];
  const days = opts.days ?? 7;
  const thresholds = profiles[opts.profileKey] ?? profiles["praia"];

  for (let i = 1; i <= days; i++) {
    const d = dayjs(dateISO).add(i, "day").format("YYYY-MM-DD");

    try {
      let summary: Summary | null = null;

      if (opts.period) {
        const hr = await fetchClimateWindowHourlyPeriod(lat, lon, d, opts.period);
        summary =
          hr.samples.length > 0
            ? summarizeByHour(hr.samples, thresholds)
            : null;
      } else if (typeof opts.hour === "number") {
        const hours = [
          Math.max(0, opts.hour - 1),
          opts.hour,
          Math.min(23, opts.hour + 1),
        ];
        const hr = await fetchClimateWindowHourly(lat, lon, d, hours);
        summary =
          hr.samples.length > 0
            ? summarizeByHour(hr.samples, thresholds)
            : null;
      } else {
        const daily = await fetchClimateWindowWithMeta(lat, lon, d);
        summary =
          daily.samples.length > 0
            ? summarizeProbabilities(daily.samples, thresholds)
            : null;
      }

      if (summary) {
        out.push({ dateISO: d, summary, score: scoreSummary(summary) });
      }
    } catch (err) {

      console.warn("[scanNextDays] erro no dia", i, err);
    }
  }

  return out.sort((a, b) => b.score - a.score);
}
