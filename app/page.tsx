import HotspotSection from "@/components/HotspotSection";
import FluidBackground from "@/components/ui/FluidBackground";
import HomeMarquee from "@/components/HomeMarquee";
import WeatherBadgeClient from "@/components/WeatherBadgeClient";
import AuthStatus from "@/components/AuthStatus";
import { fetchAllCategories } from "@/lib/cache";
import { CATEGORY_ORDER } from "@/lib/categories";
import { fetchShanghaiWeather } from "@/lib/weather";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, weather] = await Promise.all([
    fetchAllCategories(),
    fetchShanghaiWeather(),
  ]);
  const sorted = CATEGORY_ORDER
    .map((c) => categories.find((d) => d.category === c))
    .filter((d): d is NonNullable<typeof d> => Boolean(d));

  const headlines = sorted
    .flatMap((c) => c.items.slice(0, 2).map((i) => ({ ...i, _cat: c.category })))
    .slice(0, 12);

  const lastUpdated = sorted
    .map((c) => c.updatedAt)
    .filter(Boolean)
    .sort()
    .pop();
  const renderedAt = lastUpdated ? new Date(lastUpdated).getTime() : 0;
  const renderedDate = lastUpdated ? new Date(lastUpdated) : new Date(0);

  return (
    <>
      <FluidBackground />
      <main className="relative z-10 min-h-screen flex flex-col">
        <header className="px-6 md:px-12 pt-10 pb-6 max-w-[1320px] w-full mx-auto">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex items-baseline gap-4">
              <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-white/40">
                Hotspot Hub
              </span>
              <span className="h-px w-12 bg-white/15" />
              <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-white/30">
                {renderedDate.toLocaleDateString("zh-CN", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                })}
              </span>
            </div>
            <div className="flex items-center gap-3 flex-wrap justify-end">
              {lastUpdated && (
                <span className="font-mono text-[10px] tracking-wider text-white/30 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.82_0.14_165)] animate-ticker" />
                  Live · 每 10 分钟刷新
                </span>
              )}
              <WeatherBadgeClient initialWeather={weather} />
              <AuthStatus />
            </div>
          </div>

          <h1 className="mt-10 text-[44px] md:text-[64px] leading-[0.95] font-semibold tracking-[-0.02em] text-white max-w-3xl">
            一眼读完
            <br />
            <span className="text-white/45">今天的全球热点。</span>
          </h1>
          <p className="mt-5 text-white/45 text-sm md:text-base max-w-xl leading-relaxed">
            GitHub 趋势、技术前沿、资本市场、地缘要闻。四个频道、一个视野，过滤噪音，留下信号。
          </p>
        </header>

        <HomeMarquee items={headlines} />

        <section className="px-6 md:px-12 pb-16 max-w-[1320px] w-full mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:auto-rows-[minmax(220px,auto)]">
            {sorted.map((cat) => (
              <HotspotSection key={cat.category} data={cat} renderedAt={renderedAt} />
            ))}
          </div>
        </section>

        <footer className="mt-auto px-6 md:px-12 py-8 max-w-[1320px] w-full mx-auto border-t border-white/[0.05]">
          <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono tracking-wider text-white/30">
            <span>GitHub · Hacker News · Yahoo Finance · BBC / NYT</span>
            <span>&copy; {renderedDate.getFullYear()} Hotspot Hub</span>
          </div>
        </footer>
      </main>
    </>
  );
}
