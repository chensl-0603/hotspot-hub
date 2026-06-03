import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const sectionSource = readFileSync(
  new URL("../components/HotspotSection.tsx", import.meta.url),
  "utf8"
);
const techSource = readFileSync(new URL("../lib/sources/tech.ts", import.meta.url), "utf8");
const categoryShellSource = readFileSync(new URL("../components/CategoryShell.tsx", import.meta.url), "utf8");
const categoryClientSource = readFileSync(new URL("../components/CategoryClient.tsx", import.meta.url), "utf8");
const formatSource = readFileSync(new URL("../lib/format.ts", import.meta.url), "utf8");
const weatherClientSource = readFileSync(
  new URL("../components/WeatherBadgeClient.tsx", import.meta.url),
  "utf8"
);
const weatherRouteSource = readFileSync(new URL("../app/api/weather/route.ts", import.meta.url), "utf8");
const weatherSource = readFileSync(new URL("../lib/weather.ts", import.meta.url), "utf8");

test("home header renders a compact weather display", () => {
  assert.match(pageSource, /WeatherBadgeClient/);
  assert.match(weatherSource, /fetchShanghaiWeather/);
  assert.match(weatherClientSource, /上海/);
  assert.match(weatherClientSource, /天气/);
});

test("weather badge can update from browser geolocation while keeping Shanghai fallback", () => {
  assert.match(weatherClientSource, /navigator\.geolocation\.getCurrentPosition/);
  assert.match(weatherClientSource, /\/api\/weather/);
  assert.match(weatherClientSource, /initialWeather/);
  assert.match(weatherRouteSource, /searchParams\.get\("lat"\)/);
  assert.match(weatherRouteSource, /fetchWeatherByCoordinates/);
  assert.match(weatherSource, /fetchWeatherByCoordinates/);
  assert.match(weatherSource, /reverse-geocode-client/);
  assert.match(weatherSource, /resolveBigDataCloudLocationName/);
});

test("tech feature card includes a secondary news list below the lead story", () => {
  assert.match(sectionSource, /Secondary signals/);
  assert.match(sectionSource, /compactNumber\(item\.popularity\)/);
  assert.match(sectionSource, /rest\.slice\(0, 6\)/);
});

test("tech source falls back instead of returning an empty module", () => {
  assert.match(techSource, /getTechFallback/);
  assert.match(techSource, /top8\.length === 0/);
  assert.match(techSource, /items\.length === 0/);
});

test("github list card renders repository descriptions from summaries", () => {
  assert.match(sectionSource, /item\.summary/);
  assert.match(sectionSource, /line-clamp-2/);
  assert.match(sectionSource, /暂无描述/);
});

test("category list relative times use a server snapshot to avoid hydration drift", () => {
  assert.match(formatSource, /timeAgo\(dateStr: string, now = Date\.now\(\)\)/);
  assert.match(categoryShellSource, /const renderedAt = new Date\(data\.updatedAt\)\.getTime\(\)/);
  assert.match(categoryShellSource, /renderedAt=\{renderedAt\}/);
  assert.match(categoryClientSource, /renderedAt: number/);
  assert.match(categoryClientSource, /timeAgo\(item\.publishedAt, renderedAt\)/);
});
