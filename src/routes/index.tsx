import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Header } from "@/components/weather/Header";
import { SearchBar } from "@/components/weather/SearchBar";
import { CityChips, ErrorMessage, LoadingState, WelcomeScreen } from "@/components/weather/Panels";
import { CurrentWeather, DailyForecast, HourlyForecast, SunInfo, WeatherStats, WeatherSummary } from "@/components/weather/Dashboard";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { skyTheme } from "@/lib/weather/format";
import { WeatherError, type Place, type SkyTheme, type Unit, type WeatherBundle } from "@/lib/weather/types";
import {
  ERROR_MESSAGES, findCity, getBrowserPosition, getWeatherByCoordinates, reverseGeocode,
} from "@/lib/weather/weatherService";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WeatherNow — Your weather, beautifully simplified" },
      { name: "description", content: "Live weather, hourly and 7-day forecasts, UV, wind and sunrise times for any city in the world." },
      { property: "og:title", content: "WeatherNow — Your weather, beautifully simplified" },
      { property: "og:description", content: "Live weather, hourly and 7-day forecasts for any city." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const SKIES: SkyTheme[] = ["idle", "clear-day", "cloudy", "rain", "storm", "snow", "fog", "night"];
const MAX_RECENT = 8;
const MAX_FAV = 8;

type Pending = { type: "query"; q: string } | { type: "place"; p: Place } | { type: "locate" };

function Home() {
  const [unit, setUnit] = useLocalStorage<Unit>("wn-unit", "C");
  const [themePref, setThemePref, themeLoaded] = useLocalStorage<"light" | "dark" | null>("wn-theme", null);
  const [recent, setRecent] = useLocalStorage<Place[]>("wn-recent", []);
  const [favorites, setFavorites] = useLocalStorage<Place[]>("wn-favorites", []);
  const [data, setData] = useState<WeatherBundle | null>(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [last, setLast] = useState<Pending | null>(null);
  const [systemDark, setSystemDark] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(mq.matches);
    const on = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  const dark = themePref ? themePref === "dark" : systemDark;
  useEffect(() => {
    if (themeLoaded) document.documentElement.classList.toggle("dark", dark);
  }, [dark, themeLoaded]);

  const run = useCallback(async (job: Pending) => {
    if (loading) return;
    setLast(job);
    setError(null);
    setLoading(true);
    if (job.type === "locate") setLocating(true);
    try {
      let place: Place;
      if (job.type === "place") place = job.p;
      else if (job.type === "query") place = await findCity(job.q);
      else {
        const pos = await getBrowserPosition();
        place = await reverseGeocode(pos.lat, pos.lon);
      }
      const bundle = await getWeatherByCoordinates(place);
      setData(bundle);
      setRecent((r) => [place, ...r.filter((x) => x.id !== place.id)].slice(0, MAX_RECENT));
    } catch (e) {
      const kind = e instanceof WeatherError ? e.kind : "api";
      setError(ERROR_MESSAGES[kind]);
    } finally {
      setLoading(false);
      setLocating(false);
    }
  }, [loading, setRecent]);

  const isFav = !!data && favorites.some((f) => f.id === data.place.id);
  const toggleFav = () => {
    if (!data) return;
    const p = data.place;
    setFavorites((f) => (f.some((x) => x.id === p.id) ? f.filter((x) => x.id !== p.id) : [p, ...f].slice(0, MAX_FAV)));
  };

  const sky = skyTheme(data?.current);
  const pick = (p: Place) => run({ type: "place", p });
  const locate = () => run({ type: "locate" });

  return (
    <div className="relative min-h-screen overflow-x-hidden text-foreground">
      <div className="fixed inset-0 -z-10 bg-background" aria-hidden>
        {SKIES.map((s) => (
          <div key={s} className={`absolute inset-0 transition-opacity duration-1000 ${s === sky ? "opacity-100" : "opacity-0"}`} style={{ background: `var(--sky-${s})` }} />
        ))}
      </div>

      <Header
        unit={unit}
        onUnit={setUnit}
        dark={dark}
        onToggleTheme={() => setThemePref(dark ? "light" : "dark")}
        onLocate={locate}
        locating={locating}
      />

      <main id="home" className="mx-auto flex max-w-7xl scroll-mt-24 flex-col gap-6 px-3 py-6 sm:px-6 sm:py-8">
        {!data && !loading && !error && <WelcomeScreen />}

        <div className={`mx-auto flex w-full flex-col gap-3 ${data ? "" : "max-w-2xl"}`}>
          <SearchBar onSearch={(q) => run({ type: "query", q })} onSelect={pick} onLocate={locate} busy={loading} locating={locating} />
          <CityChips kind="favorites" cities={favorites} onPick={pick} onRemove={(p) => setFavorites((f) => f.filter((x) => x.id !== p.id))} />
          <CityChips kind="recent" cities={recent} onPick={pick} onClear={() => setRecent([])} />
        </div>

        {error && !loading && <ErrorMessage message={error} onRetry={last && last.type !== "query" ? () => run(last) : last ? () => run(last) : undefined} />}
        {loading && <LoadingState />}

        {data && !loading && (
          <div key={data.place.id + data.fetchedAt} className="grid gap-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <CurrentWeather data={data} unit={unit} isFavorite={isFav} onToggleFavorite={toggleFav} />
              <SunInfo data={data} />
            </div>
            <WeatherSummary data={data} unit={unit} />
            <HourlyForecast data={data} unit={unit} />
            <DailyForecast data={data} unit={unit} />
            <WeatherStats data={data} unit={unit} />
          </div>
        )}
      </main>

      <footer className="mx-auto max-w-7xl px-6 pb-8 pt-4 text-center text-sm text-muted-foreground">
        WeatherNow · Your weather, beautifully simplified. · Data from Open-Meteo
      </footer>
    </div>
  );
}
