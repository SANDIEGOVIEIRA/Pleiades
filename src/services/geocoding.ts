export type PlaceHit = {
  id: string;
  displayName: string;
  lat: number;
  lon: number;
};

const NOMINATIM = "https://nominatim.openstreetmap.org/search";

function buildUrl(q: string) {
  const p = new URLSearchParams({
    q,
    format: "jsonv2",
    addressdetails: "1",
    limit: "8",
    countrycodes: "br",
    "accept-language": "pt-BR",
  });
  return `${NOMINATIM}?${p.toString()}`;
}

// debounce leve sem dependências
export function debounce<T extends (...args: any[]) => any>(fn: T, ms = 400) {
  let t: any;
  return (...args: Parameters<T>) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export async function searchPlaces(query: string): Promise<PlaceHit[]> {
  if (!query || query.trim().length < 2) return [];
  const url = buildUrl(query.trim());

  const res = await fetch(url, {
    headers: {
      // Nominatim pede um user-agent identificável
      "User-Agent": "pleiades-app/1.0 (contato@example.com)",
      "Accept": "application/json",
    },
  });
  if (!res.ok) return [];

  const data = await res.json();
  return (data || []).map((it: any) => ({
    id: String(it.place_id),
    displayName: it.display_name as string,
    lat: parseFloat(it.lat),
    lon: parseFloat(it.lon),
  }));
}
