// src/constants/theme.ts
export const theme = {
  // Azul “brand” (pode ajustar depois)
  primary: "#2563EB",
  primaryDark: "#1D4ED8",

  // Escala neutra
  bg: "#0B0F18",
  card: "#121826",
  cardSoft: "#0F1623",
  border: "#1E293B",
  text: "#E5E7EB",
  textSoft: "#94A3B8",

  // Cores por risco
  risk: {
    low: "#10B981",      // verde
    mid: "#F59E0B",      // amarelo
    high: "#EF4444",     // vermelho
    accent: "#38BDF8"    // azul-claro (opcional)
  },

  radius: {
    sm: 10,
    md: 14,
    xl: 20,
    pill: 999,
  },

  shadow: {
    card: {
      // sombra leve que funciona bem no RN
      shadowColor: "#000",
      shadowOpacity: 0.25,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    },
  },
};

// helper para cor por % (0–100)
export function riskColor(p: number) {
  if (p >= 51) return theme.risk.high;
  if (p >= 26) return theme.risk.mid;
  return theme.risk.low;
}
