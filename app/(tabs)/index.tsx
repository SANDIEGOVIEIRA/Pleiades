import { router } from "expo-router";
import Home from "../../src/screens/Home";

export default function Index() {
  return (
    <Home
      onSubmit={(q) =>
        router.push({
          pathname: "/results",
          params: {
            lat: String(q.lat),
            lon: String(q.lon),
            dateISO: q.dateISO,
            label: q.label,
            profileKey: q.profileKey,
            hour: q.hour !== undefined ? String(q.hour) : undefined,
            period: q.period,
            trendOn: q.trendOn ? "1" : "0",
          },
        })
      }
    />
  );
}
