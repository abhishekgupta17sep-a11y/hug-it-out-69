export type Unit = "C" | "F";
export type SkyTheme = "clear-day" | "cloudy" | "rain" | "storm" | "snow" | "fog" | "night" | "idle";

export interface Place {
  id: string;
  name: string;
  country: string;
  region?: string;
  lat: number;
  lon: number;
}

export interface CurrentWeather {
  time: string; // local wall-clock ISO
  temp: number | null; // always °C
  feelsLike: number | null;
  code: number;
  isDay: boolean;
  humidity: number | null;
  windSpeed: number | null; // km/h
  windDir: number | null;
  pressure: number | null;
  visibility: number | null; // meters
  cloudCover: number | null;
  uv: number | null;
  dewPoint: number | null;
}

export interface HourlyPoint {
  time: string;
  temp: number | null;
  code: number;
  isDay: boolean;
  rainChance: number | null;
}

export interface DailyPoint {
  date: string;
  code: number;
  max: number | null;
  min: number | null;
  rainChance: number | null;
  sunrise: string | null;
  sunset: string | null;
  uvMax: number | null;
}

export interface WeatherBundle {
  place: Place;
  utcOffsetSeconds: number;
  current: CurrentWeather;
  hourly: HourlyPoint[];
  daily: DailyPoint[];
  fetchedAt: number;
}

export type WeatherErrorKind = "not-found" | "network" | "location" | "api" | "empty";

export class WeatherError extends Error {
  constructor(public kind: WeatherErrorKind) {
    super(kind);
  }
}
