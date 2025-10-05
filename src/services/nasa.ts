import dayjs from "dayjs";
import type { ClimateHourlySample, ClimateSample, Summary } from "../lib/climate";
import { summarizeByHour, summarizeProbabilities } from "../lib/climate";
import { profiles, profileWeights } from "../lib/profiles";

const USE_MOCK = false;
const YEARS_BACK = 10;
const WINDOW_DAYS = 7;

export type MetaInfo = {
  source: "POWER" | "MOCK";
  years: number[];
  nDaily: number;
  nHourly?: number;
};

export type ClimateDailyWithMeta = {
  samples: ClimateSample[];
  meta: MetaInfo;
};

export async function fetchClimateWindowWithMeta(
  lat: number,
  lon: number,
  dateISO: string,
  yearsBack = YEARS_BACK,
  windowDays = WINDOW_DAYS
): Promise<ClimateDailyWithMeta> {
  if (USE_MOCK) {
    const { samples, years } = mockDaily(lat, lon, dateISO);
    return { samples, meta: { source: "MOCK", years, nDaily: samples.length } };
  }
  return await fetchPOWERDaily(lat, lon, dateISO, yearsBack, windowDays);
}

export async function fetchClimateWindowHourly(
  lat: number,
  lon: number,
  dateISO: string,
  hours: number[] = [12, 13, 14],
  yearsBack = YEARS_BACK,
  windowDays = WINDOW_DAYS
): Promise<{ samples: ClimateHourlySample[]; meta: MetaInfo }> {
  if (USE_MOCK) {
    const { samples, years } = mockHourly(lat, lon, dateISO, hours);
    return { samples, meta: { source: "MOCK", years, nDaily: 0, nHourly: samples.length } };
  }
  return await fetchPOWERHourly(lat, lon, dateISO, hours, yearsBack, windowDays);
}

// Períodos
export function hoursForPeriod(period: "morning" | "afternoon" | "night" | "dawn"): number[] {
  switch (period) {
    case "morning":   return [6,7,8,9,10,11];
    case "afternoon": return [12,13,14,15,16,17];
    case "night":     return [18,19,20,21,22,23];
    case "dawn":      return [0,1,2,3,4,5];
  }
}
export async function fetchClimateWindowHourlyPeriod(
  lat: number, lon: number, dateISO: string,
  period: "morning"|"afternoon"|"night"|"dawn"
) {
  return fetchClimateWindowHourly(lat, lon, dateISO, hoursForPeriod(period));
}

// ---------- POWER DAILY ----------
async function fetchPOWERDaily(
  lat: number,
  lon: number,
  dateISO: string,
  yearsBack: number,
  windowDays: number
): Promise<ClimateDailyWithMeta> {
  const center = dayjs(dateISO);
  const doy = Number(center.format("DDD"));
  const years: number[] = [];
  const samples: ClimateSample[] = [];

  for (let i = 1; i <= yearsBack; i++) {
    const y = center.year() - i;
    years.push(y);

    const start = dayjs(`${y}-01-01`).add(doy - windowDays - 1, "day");
    const end   = dayjs(`${y}-01-01`).add(doy + windowDays - 1, "day");

    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      community: "ag",
      parameters: [
        "T2M_MAX", "T2M_MIN", "RH2M", "PRECTOTCORR", "WS10M",
        "ALLSKY_SFC_SW_DWN" // RADIAÇÃO (diário, MJ/m^2/dia)
      ].join(","),
      start: start.format("YYYYMMDD"),
      end:   end.format("YYYYMMDD"),
      format: "JSON",
    });
    const url = `https://power.larc.nasa.gov/api/temporal/daily/point?${params.toString()}`;

    if (i === 1) console.log("[POWER DAILY] URL:", url);

    try {
      const res = await fetch(url);
      const json = await res.json();
      const P = json?.properties?.parameter;
      if (!P) continue;

      const dates: string[] = Object.keys(P.T2M_MAX ?? {});
      for (const d of dates) {
        const tmax = P.T2M_MAX?.[d];
        const tmin = P.T2M_MIN?.[d];
        const rh   = P.RH2M?.[d];
        const prcp = P.PRECTOTCORR?.[d];
        const ws   = P.WS10M?.[d];
        const rad  = P.ALLSKY_SFC_SW_DWN?.[d]; // MJ/m^2/dia
        if ([tmax,tmin,rh,prcp,ws].every(v => typeof v === "number" && Number.isFinite(v))) {
          samples.push({ tmax,tmin,rh,prcp,ws,rad,year:y });
        }
      }
    } catch {}
  }

  if (!samples.length) {
    const mk = mockDaily(lat, lon, dateISO);
    return { samples: mk.samples, meta: { source: "MOCK", years: mk.years, nDaily: mk.samples.length } };
  }
  return { samples, meta: { source: "POWER", years, nDaily: samples.length } };
}

// ---------- POWER HOURLY ----------
async function fetchPOWERHourly(
  lat: number,
  lon: number,
  dateISO: string,
  hours: number[],
  yearsBack: number,
  windowDays: number
): Promise<{ samples: ClimateHourlySample[]; meta: MetaInfo }> {
  const center = dayjs(dateISO);
  const doy = Number(center.format("DDD"));
  const years: number[] = [];
  const samples: ClimateHourlySample[] = [];

  for (let i = 1; i <= yearsBack; i++) {
    const y = center.year() - i;
    years.push(y);

    const start = dayjs(`${y}-01-01`).add(doy - windowDays - 1, "day");
    const end   = dayjs(`${y}-01-01`).add(doy + windowDays - 1, "day");

    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      community: "ag",
      parameters: ["T2M", "RH2M", "WS10M", "PRECTOTCORR", "ALLSKY_SFC_SW_DWN"].join(","), // RAD hora (W/m^2)
      start: start.format("YYYYMMDD"),
      end:   end.format("YYYYMMDD"),
      time:  "ALL",
      format: "JSON",
    });
    const url = `https://power.larc.nasa.gov/api/temporal/hourly/point?${params.toString()}`;

    if (i === 1) console.log("[POWER HOURLY] URL:", url, "hours:", hours);

    try {
      const res = await fetch(url);
      const json = await res.json();
      const P = json?.properties?.parameter;
      if (!P) continue;

      const keys: string[] = Object.keys(P.T2M ?? {}); // YYYYMMDDHH
      for (const k of keys) {
        const hour = Number(k.slice(8, 10));
        if (!hours.includes(hour)) continue;

        const t  = P.T2M?.[k];
        const rh = P.RH2M?.[k];
        const ws = P.WS10M?.[k];
        const pr = P.PRECTOTCORR?.[k];
        const rd = P.ALLSKY_SFC_SW_DWN?.[k]; // W/m^2
        if ([t,rh,ws,pr].every(v => typeof v === "number" && Number.isFinite(v))) {
          samples.push({ t, rh, ws, prcp: pr, rad: rd, hour, year: y });
        }
      }
    } catch {}
  }

  if (!samples.length) {
    const mk = mockHourly(lat, lon, dateISO, hours);
    return { samples: mk.samples, meta: { source: "MOCK", years: mk.years, nDaily: 0, nHourly: mk.samples.length } };
  }
  return { samples, meta: { source: "POWER", years, nDaily: 0, nHourly: samples.length } };
}

// ---------- Varredura 7 dias (janela ótima) ----------
export async function scanNextDays(
  lat: number, lon: number, startISO: string,
  opts: { profileKey: string; hour?: number; period?: "morning"|"afternoon"|"night"|"dawn"; days?: number }
): Promise<Array<{ dateISO: string; summary: Summary; score: number }>> {
  const days = opts.days ?? 7;
  const th = profiles[opts.profileKey] ?? profiles["urbano"];
  const w  = profileWeights[opts.profileKey] ?? profileWeights["urbano"];

  const out: Array<{ dateISO: string; summary: Summary; score: number }> = [];

  for (let d=0; d<days; d++) {
    const dateISO = dayjs(startISO).add(d, "day").format("YYYY-MM-DD");

    if (opts.period || typeof opts.hour === "number") {
      const hours = opts.period ? hoursForPeriod(opts.period) :
        [Math.max(0,(opts.hour as number)-1), (opts.hour as number), Math.min(23,(opts.hour as number)+1)];

      const hr = await fetchClimateWindowHourly(lat, lon, dateISO, hours);
      const sum = summarizeByHour(hr.samples, th);
      out.push({ dateISO, summary: sum, score: suitability(sum, w) });
    } else {
      const daily = await fetchClimateWindowWithMeta(lat, lon, dateISO);
      const sum = summarizeProbabilities(daily.samples, th);
      out.push({ dateISO, summary: sum, score: suitability(sum, w) });
    }
  }

  return out.sort((a,b)=> b.score - a.score);
}

function suitability(sum: Summary, w: {hot:number;cold:number;wind:number;wet:number;uncf:number;rad:number;}) {
  // Mesma lógica do climate.suitabilityScore – duplicada para evitar dependência circular
  const penalty =
    sum.veryHot * w.hot +
    sum.veryCold * w.cold +
    sum.veryWindy * w.wind +
    sum.veryWet * w.wet +
    sum.veryUncomfortable * w.uncf +
    sum.veryHighRad * w.rad;
  const scale = (w.hot+w.cold+w.wind+w.wet+w.uncf+w.rad) || 1;
  let s = 100 - penalty/scale;
  if (!Number.isFinite(s)) s = 0;
  return Math.max(0, Math.min(100, Math.round(s)));
}

// ---------- MOCKS ----------
function rnd(min:number,max:number){ return min + Math.random()*(max-min); }

function mockDaily(lat:number, lon:number, dateISO:string){
  const y0 = Number(dateISO.slice(0,4));
  const years:number[]=[]; const samples:ClimateSample[]=[];
  for(let i=1;i<=YEARS_BACK;i++){
    const y=y0-i; years.push(y);
    for(let d=0; d<WINDOW_DAYS*2+1; d++){
      const tmax=rnd(28,36), tmin=tmax-rnd(4,9), rh=rnd(55,95), pr=rnd(0,10), ws=rnd(1,12);
      const rad=rnd(12,22); // MJ/m^2/d
      samples.push({tmax,tmin,rh,prcp:pr,ws,rad,year:y});
    }
  }
  return { samples, years };
}

function mockHourly(lat:number, lon:number, dateISO:string, hours:number[]){
  const y0 = Number(dateISO.slice(0,4));
  const years:number[]=[]; const samples:ClimateHourlySample[]=[];
  for(let i=1;i<=YEARS_BACK;i++){
    const y=y0-i; years.push(y);
    for(let d=0; d<WINDOW_DAYS*2+1; d++){
      for(const h of hours){
        const t=rnd(20,35), rh=rnd(55,95), ws=rnd(1,12), pr=rnd(0,3);
        const rd=rnd(200,950); // W/m^2
        samples.push({t,rh,ws,prcp:pr,rad:rd,hour:h,year:y});
      }
    }
  }
  return { samples, years };
}
