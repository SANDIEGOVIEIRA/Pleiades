import type { Thresholds } from "./climate";

export const profiles: Record<string, Thresholds> = {
  praia: {
    veryHotC: 33,
    veryColdC: 18,
    veryWindyMs: 9,
    veryWetMm: 8,
    veryUncomfortableHI: 33,
    veryHighRad: 18, // MJ/m²/dia (≈ céu aberto tropical)
  },
  trilha: {
    veryHotC: 31,
    veryColdC: 10,
    veryWindyMs: 10,
    veryWetMm: 6,
    veryUncomfortableHI: 31,
    veryHighRad: 16,
  },
  pesca: {
    veryHotC: 32,
    veryColdC: 12,
    veryWindyMs: 8,
    veryWetMm: 5,
    veryUncomfortableHI: 32,
    veryHighRad: 17,
  },
  urbano: {
    veryHotC: 34,
    veryColdC: 10,
    veryWindyMs: 11,
    veryWetMm: 10,
    veryUncomfortableHI: 34,
    veryHighRad: 18,
  },
  fotografia: {
    veryHotC: 30,
    veryColdC: 8,
    veryWindyMs: 8,
    veryWetMm: 4,
    veryUncomfortableHI: 30,
    veryHighRad: 20, // mais seletivo; “golden hour” prefere rad moderada
  },
};

export const defaultProfileKey = "urbano";

// Pesos por perfil para o score de “janela ótima”
export const profileWeights: Record<string, { hot:number;cold:number;wind:number;wet:number;uncf:number;rad:number; }> = {
  praia:       { hot:1.0, cold:0.4, wind:0.7, wet:1.2, uncf:1.5, rad:0.8 },
  trilha:      { hot:1.0, cold:0.5, wind:0.9, wet:1.3, uncf:1.2, rad:0.6 },
  pesca:       { hot:0.9, cold:0.5, wind:1.1, wet:1.2, uncf:1.2, rad:0.7 },
  urbano:      { hot:1.1, cold:0.4, wind:0.8, wet:1.0, uncf:1.3, rad:0.7 },
  fotografia:  { hot:0.7, cold:0.3, wind:0.6, wet:0.9, uncf:0.8, rad:1.2 }, // penaliza sol forte
};
