export interface WeatherSnapshot {
  city: string;
  temperature: number | null;
  condition: string;
  windSpeed: number | null;
  observedAt: string | null;
  available: boolean;
}

interface OpenMeteoCurrent {
  temperature_2m?: number;
  apparent_temperature?: number;
  weather_code?: number;
  wind_speed_10m?: number;
  time?: string;
}

interface OpenMeteoResponse {
  current?: OpenMeteoCurrent;
}

interface OpenMeteoGeocodingResponse {
  results?: {
    name?: string;
    admin1?: string;
    country?: string;
  }[];
}

interface BigDataCloudReverseResponse {
  city?: string;
  locality?: string;
  principalSubdivision?: string;
  countryName?: string;
}

const WEATHER_CODE_LABELS: Record<number, string> = {
  0: "晴",
  1: "多云",
  2: "多云",
  3: "阴",
  45: "雾",
  48: "雾凇",
  51: "小雨",
  53: "小雨",
  55: "中雨",
  61: "小雨",
  63: "中雨",
  65: "大雨",
  71: "小雪",
  73: "中雪",
  75: "大雪",
  80: "阵雨",
  81: "阵雨",
  82: "强阵雨",
  95: "雷雨",
  96: "雷雨",
  99: "强雷雨",
};

const FALLBACK_WEATHER: WeatherSnapshot = {
  city: "上海",
  temperature: null,
  condition: "天气暂不可用",
  windSpeed: null,
  observedAt: null,
  available: false,
};

export async function fetchShanghaiWeather(): Promise<WeatherSnapshot> {
  return fetchWeatherByCoordinates({
    latitude: 31.2304,
    longitude: 121.4737,
    city: "上海",
    timezone: "Asia/Shanghai",
  });
}

export async function fetchWeatherByCoordinates({
  latitude,
  longitude,
  city,
  timezone = "auto",
}: {
  latitude: number;
  longitude: number;
  city?: string;
  timezone?: string;
}): Promise<WeatherSnapshot> {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return FALLBACK_WEATHER;

  try {
    const params = new URLSearchParams({
      latitude: latitude.toFixed(4),
      longitude: longitude.toFixed(4),
      current: "temperature_2m,apparent_temperature,weather_code,wind_speed_10m",
      timezone,
    });

    const res = await fetch("https://api.open-meteo.com/v1/forecast?" + params, {
      next: { revalidate: 600 },
    });

    if (!res.ok) return FALLBACK_WEATHER;

    const data = (await res.json()) as OpenMeteoResponse;
    const current = data.current;
    if (!current || typeof current.temperature_2m !== "number") {
      return FALLBACK_WEATHER;
    }

    return {
      city: city || (await resolveLocationName(latitude, longitude)) || coordinateLabel(latitude, longitude),
      temperature: Math.round(current.temperature_2m),
      condition:
        typeof current.weather_code === "number"
          ? WEATHER_CODE_LABELS[current.weather_code] || "天气更新"
          : "天气更新",
      windSpeed:
        typeof current.wind_speed_10m === "number" ? Math.round(current.wind_speed_10m) : null,
      observedAt: current.time || null,
      available: true,
    };
  } catch {
    return FALLBACK_WEATHER;
  }
}

async function resolveLocationName(latitude: number, longitude: number): Promise<string | null> {
  return (
    (await resolveBigDataCloudLocationName(latitude, longitude)) ||
    (await resolveOpenMeteoLocationName(latitude, longitude))
  );
}

async function resolveBigDataCloudLocationName(latitude: number, longitude: number): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      latitude: latitude.toFixed(4),
      longitude: longitude.toFixed(4),
      localityLanguage: "zh",
    });
    const res = await fetch("https://api.bigdatacloud.net/data/reverse-geocode-client?" + params, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;

    const data = (await res.json()) as BigDataCloudReverseResponse;
    return data.city || data.locality || data.principalSubdivision || data.countryName || null;
  } catch {
    return null;
  }
}

async function resolveOpenMeteoLocationName(latitude: number, longitude: number): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      latitude: latitude.toFixed(4),
      longitude: longitude.toFixed(4),
      count: "1",
      language: "zh",
      format: "json",
    });
    const res = await fetch("https://geocoding-api.open-meteo.com/v1/reverse?" + params, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;

    const data = (await res.json()) as OpenMeteoGeocodingResponse;
    const location = data.results?.[0];
    return location?.name || location?.admin1 || location?.country || null;
  } catch {
    return null;
  }
}

function coordinateLabel(latitude: number, longitude: number): string {
  const lat = Math.abs(latitude).toFixed(1) + (latitude >= 0 ? "N" : "S");
  const lon = Math.abs(longitude).toFixed(1) + (longitude >= 0 ? "E" : "W");
  return lat + " " + lon;
}
