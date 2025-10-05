// Tipos-base usados nos cálculos
export type ClimateSample = {
  tmax: number;  // °C (diário)
  tmin: number;  // °C (diário)
  rh: number;    // % (diário)
  prcp: number;  // mm/dia
  ws: number;    // m/s
  rad?: number;  // MJ/m^2/dia (POWER daily) ~ ou W/m^2*h em hourly agregado -> normalizamos
  year?: number;
};

export type ClimateHourlySample = {
  t: number;     // °C (horário)
  rh: number;    // % (horário)
  ws: number;    // m/s (horário)
  prcp: number;  // mm/h
  rad?: number;  // W/m^2 (horário)
  hour: number;  // 0–23
  year?: number;
};

// Probabilidades finais (% inteiros)
export type Summary = {
  veryHot: number;
  veryCold: number;
  veryWindy: number;
  veryWet: number;
  veryUncomfortable: number;
  veryHighRad: number; // NOVO
};

export type Thresholds = {
  veryHotC: number;
  veryColdC: number;
  veryWindyMs: number;
  veryWetMm: number;
  veryUncomfortableHI: number;
  veryHighRad: number; // NOVO (ex.: >= 18 MJ/m²/dia ou >= 700 W/m² horário)
};

// ---------- Helpers ----------
function clampPct(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

// Heat Index (simplificado – entrada em °C e RH%)
export function heatIndexC(tC: number, rh: number) {
  // fórm. aproximada para climas tropicais (lei de Steadman adaptada)
  const tF = tC * 9/5 + 32;
  const HI_F =
    -42.379 +
    2.04901523 * tF +
    10.14333127 * rh -
    0.22475541 * tF * rh -
    6.83783e-3 * tF * tF -
    5.481717e-2 * rh * rh +
    1.22874e-3 * tF * tF * rh +
    8.5282e-4 * tF * rh * rh -
    1.99e-6 * tF * tF * rh * rh;
  return (HI_F - 32) * 5/9;
}

// ---------- Resumo diário ----------
export function summarizeProbabilities(
  samples: ClimateSample[],
  th: Thresholds
): Summary {
  if (!samples.length) {
    return {
      veryHot: 0, veryCold: 0, veryWindy: 0, veryWet: 0, veryUncomfortable: 0, veryHighRad: 0
    };
  }
  let hot=0, cold=0, wind=0, wet=0, uncf=0, rad=0;

  for (const s of samples) {
    const hi = heatIndexC((s.tmax + s.tmin)/2, s.rh);
    if (s.tmax >= th.veryHotC) hot++;
    if (s.tmin <= th.veryColdC) cold++;
    if (s.ws   >= th.veryWindyMs) wind++;
    if (s.prcp >= th.veryWetMm)   wet++;
    if (hi     >= th.veryUncomfortableHI) uncf++;
    // rad diário em MJ/m²/d – limiar em MJ/m²/d
    if (s.rad !== undefined && s.rad >= th.veryHighRad) rad++;
  }

  const n = samples.length;
  return {
    veryHot: clampPct(100 * hot/n),
    veryCold: clampPct(100 * cold/n),
    veryWindy: clampPct(100 * wind/n),
    veryWet: clampPct(100 * wet/n),
    veryUncomfortable: clampPct(100 * uncf/n),
    veryHighRad: clampPct(100 * rad/n),
  };
}

// ---------- Resumo horário/período ----------
export function summarizeByHour(
  samples: ClimateHourlySample[],
  th: Thresholds
): Summary {
  if (!samples.length) {
    return {
      veryHot: 0, veryCold: 0, veryWindy: 0, veryWet: 0, veryUncomfortable: 0, veryHighRad: 0
    };
  }
  let hot=0, cold=0, wind=0, wet=0, uncf=0, rad=0;

  for (const s of samples) {
    const hi = heatIndexC(s.t, s.rh);
    if (s.t >= th.veryHotC) hot++;
    // Para frio horário, usamos t (não tmin)
    if (s.t <= th.veryColdC) cold++;
    if (s.ws >= th.veryWindyMs) wind++;
    // chuva horária: usar fração do limiar diário (ex.: 1/6 do daily)
    if (s.prcp >= Math.max(0.2, th.veryWetMm / 6)) wet++;
    // desconforto por HI horário
    if (hi >= th.veryUncomfortableHI) uncf++;
    // rad horário em W/m² – limiar ~700 W/m² (se th.veryHighRad>=200, assumimos já em W/m²)
    if (s.rad !== undefined) {
      const radOk =
        th.veryHighRad > 200   // interpretado como W/m²
          ? s.rad >= th.veryHighRad
          : (s.rad/1000) >= (th.veryHighRad/24); // fallback
      if (radOk) rad++;
    }
  }

  const n = samples.length;
  return {
    veryHot: clampPct(100 * hot/n),
    veryCold: clampPct(100 * cold/n),
    veryWindy: clampPct(100 * wind/n),
    veryWet: clampPct(100 * wet/n),
    veryUncomfortable: clampPct(100 * uncf/n),
    veryHighRad: clampPct(100 * rad/n),
  };
}

// ---------- Tendência (mistura simples com delta) ----------
export function applyTrendAdjust(current: Summary, recent: Summary) {
  const mix = (a:number,b:number,w=0.3)=> Math.round(a*(1-w)+b*w);
  const adjusted: Summary = {
    veryHot: mix(current.veryHot, recent.veryHot),
    veryCold: mix(current.veryCold, recent.veryCold),
    veryWindy: mix(current.veryWindy, recent.veryWindy),
    veryWet: mix(current.veryWet, recent.veryWet),
    veryUncomfortable: mix(current.veryUncomfortable, recent.veryUncomfortable),
    veryHighRad: mix(current.veryHighRad, recent.veryHighRad),
  };
  const delta = {
    veryHot: adjusted.veryHot - current.veryHot,
    veryCold: adjusted.veryCold - current.veryCold,
    veryWindy: adjusted.veryWindy - current.veryWindy,
    veryWet: adjusted.veryWet - current.veryWet,
    veryUncomfortable: adjusted.veryUncomfortable - current.veryUncomfortable,
    veryHighRad: adjusted.veryHighRad - current.veryHighRad,
  };
  return { adjusted, delta };
}

// ---------- Score de adequação (para "janela ótima") ----------
export type Weights = {
  hot: number; cold: number; wind: number; wet: number; uncf: number; rad: number;
};

export function suitabilityScore(sum: Summary, w: Weights) {
  // Quanto MENOR o risco, MAIOR o score
  // Score base 100 – penalidades ponderadas
  const penalty =
    sum.veryHot * w.hot +
    sum.veryCold * w.cold +
    sum.veryWindy * w.wind +
    sum.veryWet * w.wet +
    sum.veryUncomfortable * w.uncf +
    sum.veryHighRad * w.rad;
  // normaliza para 0–100 aproximadamente
  const scale = (w.hot+w.cold+w.wind+w.wet+w.uncf+w.rad) || 1;
  let s = 100 - penalty/scale;
  if (!Number.isFinite(s)) s = 0;
  return Math.max(0, Math.min(100, Math.round(s)));
}
