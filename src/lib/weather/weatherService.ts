/**
 * Weather service layer. All network calls live here, so the provider can be swapped
 * without touching UI components. Currently powered by Open-Meteo (free, no API key
 * needed — so there is no secret to leak in the browser).
 */
import { WeatherError, type Place, type WeatherBundle } from "./types";

const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const REVERSE_URL = "https://api.bigdatacloud.net/data/reverse-geocode-client";

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, signal ? { signal } : {});
  } catch (e) {
    if ((e as Error).name === "AbortError") throw e;
    throw new WeatherError("network");
  }
  if (!res.ok) throw new WeatherError("api");
  return res.json() as Promise<T>;
}

interface GeoResult {
  id: number;
  name: string;
  country?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

export async function getCitySuggestions(query: string, signal?: AbortSignal): Promise<Place[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const data = await getJson<{ results?: GeoResult[] }>(
    `${GEO_URL}?name=${encodeURIComponent(q)}&count=6&language=en&format=json`,
    signal,
  );
  return (data.results ?? []).map((r) => ({
    id: String(r.id),
    name: r.name,
    country: r.country ?? "",
    ...(r.admin1 ? { region: r.admin1 } : {}),
    lat: r.latitude,
    lon: r.longitude,
  }));
}

export async function findCity(query: string): Promise<Place> {
  if (!query.trim()) throw new WeatherError("empty");
  const results = await getCitySuggestions(query);
  if (!results.length) throw new WeatherError("not-found");
  return results[0]!;
}

export async function reverseGeocode(lat: number, lon: number): Promise<Place> {
  try {
    const d = await getJson<{ city?: string; locality?: string; countryName?: string; principalSubdivision?: string }>(
      `${REVERSE_URL}?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
    );
    return {
      id: `${lat.toFixed(3)},${lon.toFixed(3)}`,
      name: d.city || d.locality || "Your location",
      country: d.countryName ?? "",
      ...(d.principalSubdivision ? { region: d.principalSubdivision } : {}),
      lat,
      lon,
    };
  } catch {
    return { id: `${lat.toFixed(3)},${lon.toFixed(3)}`, name: "Your location", country: "", lat, lon };
  }
}

type Arr = (number | null)[];
interface ForecastResponse {
  utc_offset_seconds: number;
  current: Record<string, number | string | null> & { time: string };
  hourly: { time: string[]; temperature_2m: Arr; weather_code: Arr; precipitation_probability: Arr; is_day: Arr; visibility: Arr };
  daily: {
    time: string[];
    weather_code: Arr;
    temperature_2m_max: Arr;
    temperature_2m_min: Arr;
    precipitation_probability_max: Arr;
    sunrise: string[];
    sunset: string[];
    uv_index_max: Arr;
  };
}

const num = (v: unknown) => (typeof v === "number" && !Number.isNaN(v) ? v : null);

/** Current + hourly + daily forecast for a place. Temperatures are always °C. */
export async function getWeatherByCoordinates(place: Place): Promise<WeatherBundle> {
  const params = new URLSearchParams({
    latitude: String(place.lat),
    longitude: String(place.lon),
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,dew_point_2m,uv_index,visibility",
    hourly: "temperature_2m,weather_code,precipitation_probability,is_day,visibility",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max",
    timezone: "auto",
    forecast_days: "7",
  });
  const d = await getJson<ForecastResponse>(`${FORECAST_URL}?${params}`);
  const c = d.current;

  const hourKey = c.time.slice(0, 13);
  let start = d.hourly.time.findIndex((t) => t.slice(0, 13) === hourKey);
  if (start < 0) start = 0;

  const hourly = d.hourly.time.slice(start, start + 24).map((time, i) => {
    const j = start + i;
    return {
      time,
      temp: num(d.hourly.temperature_2m[j]),
      code: num(d.hourly.weather_code[j]) ?? 0,
      isDay: d.hourly.is_day[j] === 1,
      rainChance: num(d.hourly.precipitation_probability[j]),
    };
  });

  return {
    place,
    utcOffsetSeconds: d.utc_offset_seconds,
    fetchedAt: Date.now(),
    current: {
      time: c.time,
      temp: num(c["temperature_2m"]),
      feelsLike: num(c["apparent_temperature"]),
      code: num(c["weather_code"]) ?? 0,
      isDay: c["is_day"] === 1,
      humidity: num(c["relative_humidity_2m"]),
      windSpeed: num(c["wind_speed_10m"]),
      windDir: num(c["wind_direction_10m"]),
      pressure: num(c["pressure_msl"]),
      visibility: num(c["visibility"]) ?? num(d.hourly.visibility[start]),
      cloudCover: num(c["cloud_cover"]),
      uv: num(c["uv_index"]),
      dewPoint: num(c["dew_point_2m"]),
    },
    hourly,
    daily: d.daily.time.map((date, i) => ({
      date,
      code: num(d.daily.weather_code[i]) ?? 0,
      max: num(d.daily.temperature_2m_max[i]),
      min: num(d.daily.temperature_2m_min[i]),
      rainChance: num(d.daily.precipitation_probability_max[i]),
      sunrise: d.daily.sunrise[i] ?? null,
      sunset: d.daily.sunset[i] ?? null,
      uvMax: num(d.daily.uv_index_max[i]),
    })),
  };
}

export async function getWeatherForCity(query: string) {
  return getWeatherByCoordinates(await findCity(query));
}

export function getBrowserPosition(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new WeatherError("location"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude }),
      () => reject(new WeatherError("location")),
      { timeout: 10000, maximumAge: 300000 },
    );
  });
}

export const ERROR_MESSAGES: Record<string, string> = {
  "not-found": "City not found. Please check the spelling and try again.",
  network: "Unable to connect to the weather service.",
  location: "Unable to determine your location. Please allow location access or search for a city.",
  api: "Weather service is temporarily unavailable.",
  empty: "Please enter a city name.",
};
