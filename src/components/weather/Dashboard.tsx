import { useEffect, useState, type ReactNode } from "react";
import {
  Cloud, Compass, Droplets, Eye, Gauge, Navigation, Sparkles, Star, Sun, Sunrise, Sunset, Thermometer, Wind, Umbrella,
  type LucideIcon,
} from "lucide-react";
import type { Unit, WeatherBundle } from "@/lib/weather/types";
import {
  buildSummary, compass, dayLength, describe, fmtClock, fmtHour, fmtShortDate, fmtTemp, fmtWeekday,
  humidityLabel, localNow, uvLabel, weatherIcon, windLabel,
} from "@/lib/weather/format";
import { Section } from "./Panels";

const na = (v: number | null, f: (n: number) => string) => (v == null ? "N/A" : f(v));

function useTick(ms = 30000) {
  const [, set] = useState(0);
  useEffect(() => { const t = setInterval(() => set((n) => n + 1), ms); return () => clearInterval(t); }, [ms]);
}

export function CurrentWeather({ data, unit, isFavorite, onToggleFavorite }: { data: WeatherBundle; unit: Unit; isFavorite: boolean; onToggleFavorite: () => void }) {
  useTick();
  const { current: c, place } = data;
  const Icon = weatherIcon(c.code, c.isDay);
  const now = localNow(data.utcOffsetSeconds);
  const mins = Math.floor((Date.now() - data.fetchedAt) / 60000);
  return (
    <article className="glass relative overflow-hidden rounded-3xl p-6 sm:p-8 animate-rise lg:col-span-2">
      <div className="absolute -right-10 -top-10 h-56 w-56 rounded-full bg-accent/30 blur-3xl" aria-hidden />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {place.name}{place.country && <span className="text-muted-foreground">, {place.country}</span>}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{now.date} · {now.time} local</p>
        </div>
        <button onClick={onToggleFavorite} aria-pressed={isFavorite} aria-label={isFavorite ? `Remove ${place.name} from favorites` : `Add ${place.name} to favorites`} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted transition hover:scale-105">
          <Star className={`h-5 w-5 ${isFavorite ? "fill-accent text-accent" : ""}`} />
        </button>
      </div>
      <div className="relative mt-6 flex flex-wrap items-center gap-x-8 gap-y-4">
        <Icon className="h-28 w-28 text-primary drop-shadow-lg animate-float sm:h-36 sm:w-36" strokeWidth={1.3} aria-hidden />
        <div>
          <p className="font-display text-7xl font-bold leading-none tracking-tighter sm:text-8xl" aria-label={`Temperature ${fmtTemp(c.temp, unit, true)}`}>
            {fmtTemp(c.temp, unit)}<span className="align-top text-3xl font-semibold text-muted-foreground">{unit}</span>
          </p>
          <p className="mt-2 text-xl font-semibold">{describe(c.code)}</p>
          <p className="text-sm text-muted-foreground">Feels like {fmtTemp(c.feelsLike, unit, true)} · Updated {mins < 1 ? "just now" : `${mins} min ago`}</p>
        </div>
      </div>
    </article>
  );
}

export function SunInfo({ data }: { data: WeatherBundle }) {
  const t = data.daily[0];
  const rows: [LucideIcon, string, string][] = [
    [Sunrise, "Sunrise", fmtClock(t?.sunrise ?? null)],
    [Sunset, "Sunset", fmtClock(t?.sunset ?? null)],
    [Sun, "Day length", dayLength(t?.sunrise ?? null, t?.sunset ?? null)],
  ];
  return (
    <article className="glass flex flex-col justify-between gap-4 rounded-3xl p-6 animate-rise" aria-label="Sunrise and sunset">
      <h2 className="font-display text-lg font-semibold">Sun</h2>
      {rows.map(([I, l, v]) => (
        <div key={l} className="flex items-center gap-4">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent/25"><I className="h-5 w-5 text-accent-foreground" aria-hidden /></span>
          <div><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{l}</p><p className="font-display text-xl font-semibold">{v}</p></div>
        </div>
      ))}
    </article>
  );
}

function StatCard({ icon: I, label, value, note, extra }: { icon: LucideIcon; label: string; value: string; note?: string; extra?: ReactNode }) {
  return (
    <div className="glass rounded-3xl p-5 transition hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><I className="h-4 w-4" aria-hidden />{label}</p>
        {extra}
      </div>
      <p className="mt-3 font-display text-2xl font-semibold sm:text-3xl">{value}</p>
      {note && <p className="mt-0.5 text-sm text-muted-foreground">{note}</p>}
    </div>
  );
}

export function WeatherStats({ data, unit }: { data: WeatherBundle; unit: Unit }) {
  const c = data.current;
  return (
    <Section id="details" title="Details">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        <StatCard icon={Droplets} label="Humidity" value={na(c.humidity, (n) => `${Math.round(n)}%`)} note={humidityLabel(c.humidity)} />
        <StatCard icon={Wind} label="Wind" value={na(c.windSpeed, (n) => `${Math.round(n)} km/h`)} note={windLabel(c.windSpeed)} />
        <StatCard icon={Gauge} label="Pressure" value={na(c.pressure, (n) => `${Math.round(n)} hPa`)} note={c.pressure == null ? "" : c.pressure < 1009 ? "Low" : c.pressure > 1022 ? "High" : "Normal"} />
        <StatCard icon={Eye} label="Visibility" value={na(c.visibility, (n) => `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)} km`)} note={c.visibility == null ? "" : c.visibility >= 10000 ? "Clear view" : c.visibility >= 4000 ? "Moderate" : "Poor"} />
        <StatCard icon={Cloud} label="Cloudiness" value={na(c.cloudCover, (n) => `${Math.round(n)}%`)} />
        <StatCard icon={Sun} label="UV Index" value={na(c.uv, (n) => n.toFixed(1))} note={uvLabel(c.uv)} />
        <StatCard icon={Thermometer} label="Dew Point" value={fmtTemp(c.dewPoint, unit, true)} />
        <StatCard
          icon={Compass}
          label="Wind Direction"
          value={compass(c.windDir)}
          note={na(c.windDir, (n) => `${Math.round(n)}°`)}
          extra={c.windDir != null ? <Navigation className="h-5 w-5 text-primary" style={{ transform: `rotate(${c.windDir + 180}deg)` }} aria-hidden /> : null}
        />
      </div>
    </Section>
  );
}

export function HourlyForecast({ data, unit }: { data: WeatherBundle; unit: Unit }) {
  return (
    <Section id="forecast" title="Next 24 hours">
      <div className="glass rounded-3xl p-3 sm:p-4">
        <ol className="no-scrollbar flex gap-2 overflow-x-auto" aria-label="Hourly forecast">
          {data.hourly.map((h, i) => {
            const I = weatherIcon(h.code, h.isDay);
            return (
              <li key={h.time} className={`flex w-20 shrink-0 flex-col items-center gap-2 rounded-2xl px-2 py-4 transition hover:bg-muted ${i === 0 ? "bg-primary text-primary-foreground hover:bg-primary" : ""}`}>
                <span className="text-sm font-semibold">{i === 0 ? "Now" : fmtHour(h.time)}</span>
                <I className="h-7 w-7" aria-label={describe(h.code)} />
                <span className="font-display text-lg font-semibold">{fmtTemp(h.temp, unit)}</span>
                <span className={`flex items-center gap-0.5 text-xs ${i === 0 ? "" : "text-muted-foreground"}`}>
                  <Umbrella className="h-3 w-3" aria-hidden />{na(h.rainChance, (n) => `${n}%`)}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </Section>
  );
}

export function DailyForecast({ data, unit }: { data: WeatherBundle; unit: Unit }) {
  return (
    <Section title="7-day forecast">
      <ol className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-1 lg:grid lg:grid-cols-7 lg:overflow-visible" aria-label="Daily forecast">
        {data.daily.map((d, i) => {
          const I = weatherIcon(d.code, true);
          return (
            <li key={d.date} className={`glass flex w-32 shrink-0 flex-col items-center gap-1.5 rounded-3xl p-4 text-center lg:w-auto ${i === 0 ? "ring-2 ring-primary" : ""}`}>
              <span className="text-sm font-bold uppercase tracking-wider">{i === 0 ? "Today" : fmtWeekday(d.date)}</span>
              <span className="text-xs text-muted-foreground">{fmtShortDate(d.date)}</span>
              <I className="my-1 h-9 w-9 text-primary" aria-hidden />
              <span className="line-clamp-1 text-xs font-medium">{describe(d.code)}</span>
              <span className="font-display text-lg font-semibold">
                {fmtTemp(d.max, unit)} <span className="text-muted-foreground">{fmtTemp(d.min, unit)}</span>
              </span>
              <span className="flex items-center gap-0.5 text-xs text-muted-foreground"><Umbrella className="h-3 w-3" aria-hidden />{na(d.rainChance, (n) => `${n}%`)}</span>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}

export function WeatherSummary({ data, unit }: { data: WeatherBundle; unit: Unit }) {
  return (
    <article className="glass flex gap-4 rounded-3xl p-6 animate-rise" aria-label="Weather summary">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground"><Sparkles className="h-5 w-5" aria-hidden /></span>
      <div>
        <h2 className="font-display text-lg font-semibold">Today at a glance</h2>
        <p className="mt-1 leading-relaxed text-muted-foreground">{buildSummary(data.current, data.daily[0], unit)}</p>
      </div>
    </article>
  );
}
