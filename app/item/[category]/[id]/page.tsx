import Link from "next/link";
import { notFound } from "next/navigation";
import FluidBackground from "@/components/ui/FluidBackground";
import InsightStream from "@/components/InsightStream";
import { CATEGORIES } from "@/lib/categories";
import { fetchCategory } from "@/lib/cache";
import { timeAgo, compactNumber } from "@/lib/format";
import { createInsightItemSnapshot } from "@/lib/insights";
import type { Category } from "@/lib/types";

export const dynamic = "force-dynamic";

const CATEGORY_SET = new Set<Category>(["github", "tech", "finance", "politics"]);

export default async function ItemInsightPage({
  params,
}: {
  params: Promise<{ category: string; id: string }>;
}) {
  const { category: rawCategory, id: rawId } = await params;
  const category = rawCategory as Category;
  if (!CATEGORY_SET.has(category)) notFound();

  const id = decodeURIComponent(rawId);
  const data = await fetchCategory(category);
  const item = data.items.find((entry) => entry.id === id);
  if (!item) notFound();

  const config = CATEGORIES[category];
  const snapshot = createInsightItemSnapshot(item);
  const renderedAt = new Date(data.updatedAt).getTime();

  return (
    <>
      <FluidBackground />
      <main className="relative z-10 min-h-screen">
        <nav className="px-6 md:px-12 pt-8 max-w-[1120px] w-full mx-auto flex items-center justify-between gap-4">
          <Link
            href={config.href}
            className="inline-flex items-center gap-2 text-[11px] font-mono tracking-widest uppercase text-white/40 hover:text-white/80 transition-colors"
          >
            <span className="text-base leading-none">←</span> {config.shortLabel}
          </Link>
          <Link
            href="/"
            className="text-[11px] font-mono tracking-widest uppercase text-white/30 hover:text-white/70 transition-colors"
          >
            Index
          </Link>
        </nav>

        <article className="px-6 md:px-12 pt-10 pb-16 max-w-[1120px] w-full mx-auto">
          <div className="grid lg:grid-cols-[1fr_280px] gap-8 lg:gap-12 items-start">
            <section>
              <div className="flex items-baseline gap-4 mb-5">
                <span
                  className="font-mono text-[11px] tracking-[0.24em] uppercase"
                  style={{ color: config.accent }}
                >
                  {config.caption} · {item.source}
                </span>
                <span className="h-px flex-1 max-w-[120px]" style={{ background: config.accent, opacity: 0.36 }} />
              </div>

              <h1 className="text-[34px] md:text-[52px] leading-[1.02] font-semibold tracking-[-0.02em] text-white max-w-4xl">
                {item.title}
              </h1>

              <p className="mt-5 text-[15px] leading-7 text-white/55 max-w-3xl">
                {item.summary}
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3 text-[11px] font-mono uppercase tracking-wider text-white/35">
                <span>{timeAgo(item.publishedAt, renderedAt)}</span>
                <span className="text-white/15">·</span>
                <span>{item.source}</span>
                {item.popularity !== undefined && (
                  <>
                    <span className="text-white/15">·</span>
                    <span>★ {compactNumber(item.popularity)}</span>
                  </>
                )}
              </div>

              <InsightStream category={category} id={item.id} accent={config.accent} snapshot={snapshot} />
            </section>

            <aside className="lg:sticky lg:top-8 rounded-2xl border border-white/[0.06] bg-white/[0.025] px-5 py-5">
              <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">
                Source
              </p>
              <p className="mt-3 text-sm text-white/70 leading-6">
                先读站内解读，再决定是否跳转原文。AI 内容仅作导读，事实以原文为准。
              </p>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex w-full items-center justify-center rounded-full px-4 py-2.5 text-[12px] font-mono uppercase tracking-wider text-[oklch(0.14_0.02_175)] transition-opacity hover:opacity-85"
                style={{ background: config.accent }}
              >
                阅读原文
              </a>
            </aside>
          </div>
        </article>
      </main>
    </>
  );
}
