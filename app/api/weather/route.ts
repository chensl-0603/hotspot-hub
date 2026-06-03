import { NextRequest } from "next/server";
import { fetchWeatherByCoordinates } from "@/lib/weather";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const lat = Number(request.nextUrl.searchParams.get("lat"));
  const lon = Number(request.nextUrl.searchParams.get("lon"));

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return Response.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  const weather = await fetchWeatherByCoordinates({
    latitude: lat,
    longitude: lon,
  });

  return Response.json(weather, {
    headers: {
      "Cache-Control": "private, max-age=300",
    },
  });
}
