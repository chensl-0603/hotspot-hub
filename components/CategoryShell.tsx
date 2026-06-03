import Link from "next/link";
import CategoryClient from "@/components/CategoryClient";
import { CATEGORIES, CATEGORY_ORDER } from "@/lib/categories";
import { fetchCategory } from "@/lib/cache";
import { timeAgo } from "@/lib/format";
import type { Category } from "@/lib/types";

export default async function CategoryShell({ category }: { category: Category }) {
  const data = await fetchCategory(category);
  const renderedAt = new Date(data.updatedAt).getTime();
  const config = CATEGORIES[category];
  const updated = data.updatedAt ? timeAgo(data.updatedAt, renderedAt) : "—";
  const siblings = CATEGORY_ORDER.filter((c) => c !== category).map((c) => CATEGORIES[c]);

  return (
    <div className="relative z-10 min-h-screen">
      <nav className="px-6 md:px-12 pt-8 max-w-[1280px] w-full mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[11px] font-mono tracking-widest uppercase text-white/40 hover:text-white/80 transition-colors"
        >
          <span className="text-base leading-none">←</span> Index
        </Link>
      </nav>

      <header className="px-6 md:px-12 pt-8 pb-12 max-w-[1280px] w-full mx-auto">
        <div
          className="grid md:grid-cols-[1fr_auto] gap-y-6 gap-x-12 items-end"
          style={{ viewTransitionName: "card-" + category }}
        >
          <div>
            <div className="flex items-baseline gap-4 mb-5">
              <span
                className="font-mono text-[11px] tracking-[0.25em] uppercase"
                style={{ color: config.accent }}
              >
                {config.number} · {config.caption}
              </span>
              <span className="h-px flex-1 max-w-[120px]" style={{ background: config.accent, opacity: 0.4 }} />
            </div>
            <h1
              className="text-[40px] md:text-[56px] leading-[0.95] font-semibold tracking-[-0.02em] text-white"
              style={{ viewTransitionName: "title-" + category }}
            >
              {config.label}
            </h1>
            <p className="mt-4 text-sm text-white/40 font-mono tracking-wider">
              {data.available
                ? `${data.items.length} items · updated ${updated}`
                : `unavailable · ${data.error || "源请求超时"}`}
            </p>
          </div>

          <div className="flex md:flex-col gap-2 md:items-end text-[11px] font-mono uppercase tracking-widest">
            {siblings.map((s) => (
              <Link
                key={s.category}
                href={s.href}
                className="text-white/30 hover:text-white/80 transition-colors"
              >
                {s.shortLabel}
              </Link>
            ))}
          </div>
        </div>
      </header>

      <CategoryClient items={data.items} accent={config.accent} available={data.available} renderedAt={renderedAt} />

      <footer className="px-6 md:px-12 py-10 max-w-[1280px] w-full mx-auto border-t border-white/[0.05] mt-12">
        <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono tracking-wider text-white/30">
          <Link href="/" className="hover:text-white/70 transition-colors">
            ← 返回首页
          </Link>
          <span>Hotspot Hub · {config.label}</span>
        </div>
      </footer>
    </div>
  );
}
