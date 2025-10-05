// Helpers estatísticos e Heat Index

export function probabilityOver(values: number[], threshold: number) {
  const n = values.length || 1;
  const hits = values.filter((v) => v > threshold).length;
  return Math.round((hits / n) * 100);
}

export function probabilityUnder(values: number[], threshold: number) {
  const n = values.length || 1;
  const hits = values.filter((v) => v < threshold).length;
  return Math.round((hits / n) * 100);
}

// Heat Index (NOAA) aproximado: entrada em °C + %UR; saída em °C
export function heatIndexC(tC: number, rh: number) {
  const tF = (tC * 9) / 5 + 32;
  const HI_F =
    -42.379 +
    2.04901523 * tF +
    10.14333127 * rh -
    0.22475541 * tF * rh -
    0.00683783 * tF * tF -
    0.05481717 * rh * rh +
    0.00122874 * tF * tF * rh +
    0.00085282 * tF * rh * rh -
    0.00000199 * tF * tF * rh * rh;

  return ((HI_F - 32) * 5) / 9;
}
