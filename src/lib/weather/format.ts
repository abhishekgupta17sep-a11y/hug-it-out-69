import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudMoon, CloudRain, CloudSnow, CloudSun, Moon, Sun, type LucideIcon } from "lucide-react";
import type { CurrentWeather, DailyPoint, SkyTheme, Unit } from "./types";

type Kind = "clear" | "partly" | "cloudy" | "fog" | "drizzle" | "rain" | "snow" | "storm";

const CODES: Record<number, [string, Kind]> = {
  0: ["Clear sky", "clear"], 1: ["Mainly clear", "clear"], 2: ["Partly cloudy", "partly"], 3: ["Overcast", "cloudy"],
  45: ["Fog", "fog"], 48: ["Rime fog", "fog"],
  51: ["Light drizzle", "drizzle"], 53: ["Drizzle", "drizzle"], 55: ["Heavy drizzle", "drizzle"],
  56: ["Freezing drizzle", "drizzle"], 57: ["Freezing drizzle", "drizzle"],
  61: ["Light rain", "rain"], 63: ["Rain", "rain"], 65: ["Heavy rain", "rain"], 66: ["Freezing rain", "rain"], 67: ["Freezing rain", "rain"],
  71: ["Light snow", "snow"], 73: ["Snow", "snow"], 75: ["Heavy snow", "snow"], 77: ["Snow grains", "snow"],
  80: ["Rain showers", "rain"], 81: ["Rain showers", "rain"], 82: ["Violent showers", "rain"],
  85: ["Snow showers", "snow"], 86: ["Heavy snow showers", "snow"],
  95: ["Thunderstorm", "storm"], 96: ["Thunderstorm with hail", "storm"], 99: ["Severe thunderstorm", "storm"],
};

export const describe = (code: number) => CODES[code]?.[0] ?? "Unknown";
const kind = (code: number): Kind => CODES[code]?.[1] ?? "cloudy";

export function weatherIcon(code: number, isDay = true): LucideIcon {
  switch (kind(code)) {
    case "clear": return isDay ? Sun : Moon;
    case "partly": return isDay ? CloudSun : CloudMoon;
    case "fog": return CloudFog;
    case "drizzle": return CloudDrizzle;
    case "rain": return CloudRain;
    case "snow": return CloudSnow;
    case "storm": return CloudLightning;
    default: return Cloud;
  }
}

export function skyTheme(c: CurrentWeather | undefined): SkyTheme {
  if (!c) return "idle";
  const k = kind(c.code);
  if (k === "storm") return "storm";
  if (k === "rain" || k === "drizzle") return "rain";
  if (k === "snow") return "snow";
  if (!c.isDay) return "night";
  if (k === "fog") return "fog";
  if (k === "cloudy") return "cloudy";
  return "clear-day";
}

export const toUnit = (c: number, u: Unit) => (u === "C" ? c : (c * 9) / 5 + 32);
export const fmtTemp = (c: number | null, u: Unit, withUnit = false) =>
  c == null ? "N/A" : `${Math.round(toUnit(c, u))}°${withUnit ? u : ""}`;

const DIRS = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
export const compass = (deg: number | null) => (deg == null ? "N/A" : DIRS[Math.round(deg / 22.5) % 16]);

/** Open-Meteo returns local wall-clock strings; treat them as UTC for display so no timezone shift happens. */
const wall = (iso: string) => new Date(iso.length <= 10 ? `${iso}T00:00:00Z` : `${iso}:00Z`.replace(/:00:00Z$/, ":00Z").replace(/(T\d\d:\d\d):00Z$/, "$1:00Z"));
const asDate = (iso: string) => {
  const s = iso.length <= 10 ? `${iso}T00:00` : iso.slice(0, 16);
  return new Date(`${s}:00Z`);
};
void wall;

export const fmtHour = (iso: string) =>
  asDate(iso).toLocaleTimeString("en-US", { hour: "numeric", timeZone: "UTC" });
export const fmtClock = (iso: string | null) =>
  iso ? asDate(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" }) : "N/A";
export const fmtWeekday = (iso: string) => asDate(iso).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
export const fmtShortDate = (iso: string) =>
  asDate(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

export function localNow(offsetSeconds: number) {
  const d = new Date(Date.now() + offsetSeconds * 1000);
  return {
    date: d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" }),
    time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" }),
  };
}

export function dayLength(sunrise: string | null, sunset: string | null) {
  if (!sunrise || !sunset) return "N/A";
  const mins = Math.round((asDate(sunset).getTime() - asDate(sunrise).getTime()) / 60000);
  if (mins <= 0) return "N/A";
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export function humidityLabel(h: number | null) {
  if (h == null) return "";
  if (h < 30) return "Dry";
  if (h <= 60) return "Comfortable";
  return "Humid";
}
export function uvLabel(uv: number | null) {
  if (uv == null) return "";
  if (uv < 3) return "Low";
  if (uv < 6) return "Moderate";
  if (uv < 8) return "High";
  if (uv < 11) return "Very high";
  return "Extreme";
}
export function windLabel(kmh: number | null) {
  if (kmh == null) return "";
  if (kmh < 6) return "Calm";
  if (kmh < 20) return "Light breeze";
  if (kmh < 39) return "Moderate";
  if (kmh < 62) return "Strong";
  return "Gale";
}

/** Plain-language summary built only from the numbers we actually have. */
export function buildSummary(c: CurrentWeather, today: DailyPoint | undefined, u: Unit): string {
  const parts: string[] = [];
  parts.push(`${describe(c.code)} right now at ${fmtTemp(c.temp, u, true)}`);
  if (c.feelsLike != null && c.temp != null && Math.abs(c.feelsLike - c.temp) >= 2)
    parts[0] += `, though it feels like ${fmtTemp(c.feelsLike, u, true)}`;
  parts[0] += ".";
  if (today && today.max != null && today.min != null)
    parts.push(`Today ranges from ${fmtTemp(today.min, u, true)} to ${fmtTemp(today.max, u, true)}, with ${describe(today.code).toLowerCase()} expected.`);
  if (today?.rainChance != null)
    parts.push(
      today.rainChance >= 60
        ? `Rain is likely (${today.rainChance}% chance) — keep an umbrella handy.`
        : today.rainChance >= 25
          ? `There's a ${today.rainChance}% chance of rain.`
          : `Rain is unlikely (${today.rainChance}%).`,
    );
  if (c.windSpeed != null) parts.push(`Winds are ${windLabel(c.windSpeed).toLowerCase()} at ${Math.round(c.windSpeed)} km/h from the ${compass(c.windDir)}.`);
  if (today?.uvMax != null && today.uvMax >= 6) parts.push(`UV peaks at ${Math.round(today.uvMax)} (${uvLabel(today.uvMax).toLowerCase()}), so sun protection is a good idea.`);
  return parts.join(" ");
}
