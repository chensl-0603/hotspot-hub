"use client";

import { useEffect, useState } from "react";
import type { WeatherSnapshot } from "@/lib/weather";

export default function WeatherBadgeClient({ initialWeather }: { initialWeather: WeatherSnapshot }) {
  const [weather, setWeather] = useState(initialWeather);
  const [locating, setLocating] = useState(true);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      queueMicrotask(() => setLocating(false));
      return;
    }

    const controller = new AbortController();

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const params = new URLSearchParams({
            lat: position.coords.latitude.toString(),
            lon: position.coords.longitude.toString(),
          });
          const res = await fetch("/api/weather?" + params, {
            signal: controller.signal,
            headers: { Accept: "application/json" },
          });
          if (!res.ok) return;

          const nextWeather = (await res.json()) as WeatherSnapshot;
          if (!controller.signal.aborted && nextWeather.available) {
            setWeather(nextWeather);
          }
        } catch {
          // Keep the server-rendered Shanghai fallback.
        } finally {
          if (!controller.signal.aborted) setLocating(false);
        }
      },
      () => {
        if (!controller.signal.aborted) setLocating(false);
      },
      {
        enableHighAccuracy: false,
        maximumAge: 10 * 60 * 1000,
        timeout: 6000,
      }
    );

    return () => controller.abort();
  }, []);

  const city = weather.city || "上海";

  return (
    <div
      className={
        "rounded-full border border-white/[0.07] bg-white/[0.035] px-4 py-2 " +
        "backdrop-blur-2xl shadow-[0_12px_30px_oklch(0.05_0.02_175_/_0.24)] " +
        "flex items-center gap-3 text-white/70"
      }
      aria-label={city + "天气"}
      title={locating ? "正在获取当前位置天气" : city + "天气"}
    >
      <span
        className={
          "h-2 w-2 rounded-full bg-[oklch(0.84_0.13_95)] shadow-[0_0_18px_oklch(0.84_0.13_95_/_0.55)] " +
          (locating ? "animate-ticker" : "")
        }
      />
      <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-white/35">
        {city} 天气
      </span>
      <span className="text-[13px] font-medium text-white/85 tabular-nums">
        {weather.temperature === null ? "--" : weather.temperature + "°"}
      </span>
      <span className="text-[12px] text-white/50">{weather.condition}</span>
      {weather.windSpeed !== null && (
        <span className="hidden sm:inline text-[10.5px] font-mono text-white/30 tabular-nums">
          风 {weather.windSpeed} km/h
        </span>
      )}
    </div>
  );
}
