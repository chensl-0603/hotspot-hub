import Link from "next/link";
import { CategoryData } from "@/lib/types";
import { CATEGORIES } from "@/lib/categories";
import { timeAgo, compactNumber } from "@/lib/format";

interface Props {
  data: CategoryData;
  renderedAt: number;
}

export default function HotspotSection({ data, renderedAt }: Props) {
  const config = CATEGORIES[data.category];
  if (!config) return null;

  const itemLimit = config.variant === "feature" ? 8 : 6;
  const items = data.items.slice(0, itemLimit);
  const updated = data.updatedAt ? timeAgo(data.updatedAt, renderedAt) : "—";

  const variantClass: Record<typeof config.variant, string> = {
    feature: "md:col-span-7 md:row-span-2",
    list: "md:col-span-5 md:row-span-2",
    ticker: "md:col-span-5",
    editorial: "md:col-span-7",
  };

  return (
    <Link
      href={config.href}
      className={
        "group relative block overflow-hidden rounded-3xl " +
        "border border-white/[0.06] bg-white/[0.025] " +
        "backdrop-blur-2xl transition-colors duration-300 " +
        "hover:border-white/[0.14] hover:bg-white/[0.04] " +
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 " +
        variantClass[config.variant]
      }
      style={{ viewTransitionName: "card-" + config.category }}
    >
      <Accent color={config.accent} />
      <Header config={config} count={data.items.length} updated={updated} available={data.available} />
      <Body data={data} items={items} />
    </Link>
  );
}

function Accent({ color }: { color: string }) {
  return (
    <>
      <div
        className="absolute -top-24 -right-24 h-64 w-64 rounded-full opacity-40 blur-3xl pointer-events-none transition-opacity duration-500 group-hover:opacity-60"
        style={{ background: color }}
      />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />
    </>
  );
}

function Header({
  config,
  count,
  updated,
  available,
}: {
  config: import("@/lib/categories").CategoryConfig;
  count: number;
  updated: string;
  available: boolean;
}) {
  return (
    <div className="relative flex items-start justify-between gap-4 px-7 pt-7">
      <div className="flex items-baseline gap-3 min-w-0">
        <span
          className="font-mono text-[11px] tracking-[0.2em] uppercase"
          style={{ color: config.accent }}
        >
          {config.number}
        </span>
        <div className="min-w-0">
          <h2
            className="text-[15px] font-medium text-white/95 truncate"
            style={{ viewTransitionName: "title-" + config.category }}
          >
            {config.label}
          </h2>
          <p className="text-[11px] text-white/35 mt-0.5 tracking-wide">
            {config.caption} · {available ? count + " items" : "unavailable"}
          </p>
        </div>
      </div>
      <span className="shrink-0 text-[10px] font-mono text-white/30 tabular-nums pt-1">
        {updated}
      </span>
    </div>
  );
}

function Body({ data, items }: { data: CategoryData; items: typeof data.items }) {
  const config = CATEGORIES[data.category];
  if (!data.available || items.length === 0) {
    return (
      <div className="px-7 pb-7 pt-10 text-white/30 text-sm">
        {data.error || "暂无数据"}
      </div>
    );
  }
  switch (config.variant) {
    case "feature":
      return <FeatureBody items={items} accent={config.accent} />;
    case "list":
      return <ListBody items={items} accent={config.accent} />;
    case "ticker":
      return <TickerBody items={items} accent={config.accent} />;
    case "editorial":
      return <EditorialBody items={items} accent={config.accent} />;
  }
}

function FeatureBody({ items, accent }: { items: import("@/lib/types").HotspotItem[]; accent: string }) {
  const [lead, ...rest] = items;
  return (
    <div className="relative flex flex-col h-full px-7 pt-6 pb-7">
      <div>
        <div className="text-[10px] font-mono tracking-widest uppercase mb-3" style={{ color: accent }}>
          Top story
        </div>
        <h3 className="text-2xl md:text-[26px] font-semibold leading-[1.2] text-white tracking-tight">
          {lead.title}
        </h3>
        <p className="mt-3 text-sm text-white/55 leading-relaxed line-clamp-2 max-w-prose">
          {lead.summary}
        </p>
      </div>
      <div className="mt-4 pt-4 border-t border-white/[0.06]">
        <div className="text-[9.5px] font-mono tracking-[0.18em] uppercase mb-2.5" style={{ color: accent }}>
          Secondary signals
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-2.5">
          {rest.slice(0, 6).map((item) => (
            <div key={item.id} className="min-w-0">
              <div className="text-[12.5px] text-white/68 line-clamp-2 leading-snug">
                {item.title}
              </div>
              {item.popularity !== undefined && (
                <div className="mt-1 text-[10px] font-mono text-white/32 tabular-nums">
                  {compactNumber(item.popularity)} pts · {item.source}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ListBody({ items, accent }: { items: import("@/lib/types").HotspotItem[]; accent: string }) {
  return (
    <ol className="relative px-7 pt-5 pb-7 space-y-3.5">
      {items.slice(0, 5).map((item, i) => (
        <li key={item.id} className="flex items-start gap-4">
          <span
            className="shrink-0 font-mono text-[11px] tabular-nums pt-0.5 w-5 text-right"
            style={{ color: i === 0 ? accent : "rgba(255,255,255,0.3)" }}
          >
            {String(i + 1).padStart(2, "0")}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] text-white/85 leading-snug line-clamp-2">{item.title}</p>
            <p className="mt-1 text-[12px] text-white/45 leading-snug line-clamp-2">
              {item.summary || "暂无描述"}
            </p>
            {item.popularity !== undefined && (
              <p className="mt-1 text-[10.5px] font-mono text-white/35 tabular-nums">
                {"★ " + compactNumber(item.popularity)} · {item.source}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

function TickerBody({ items, accent }: { items: import("@/lib/types").HotspotItem[]; accent: string }) {
  return (
    <div className="relative px-7 pt-6 pb-7 space-y-2.5">
      {items.slice(0, 4).map((item, i) => (
        <div key={item.id} className="flex items-center gap-3 group/row">
          <span
            className="h-1.5 w-1.5 rounded-full shrink-0"
            style={{
              background: i === 0 ? accent : "rgba(255,255,255,0.2)",
              boxShadow: i === 0 ? "0 0 12px " + accent : "none",
            }}
          />
          <span className="text-[13px] text-white/80 leading-tight line-clamp-1 flex-1">
            {item.title}
          </span>
          <span className="text-[10px] font-mono text-white/30 tabular-nums shrink-0">
            {item.source.slice(0, 8)}
          </span>
        </div>
      ))}
    </div>
  );
}

function EditorialBody({ items, accent }: { items: import("@/lib/types").HotspotItem[]; accent: string }) {
  const [lead, ...rest] = items;
  return (
    <div className="relative grid grid-cols-5 gap-6 px-7 pt-6 pb-7">
      <div className="col-span-3">
        <span className="block text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: accent }}>
          Headline
        </span>
        <h3 className="text-[20px] font-serif font-medium leading-snug text-white">
          {lead.title}
        </h3>
        <p className="mt-2 text-[12.5px] text-white/50 line-clamp-2">{lead.summary}</p>
      </div>
      <div className="col-span-2 border-l border-white/[0.06] pl-5 space-y-3">
        {rest.slice(0, 3).map((item) => (
          <div key={item.id} className="text-[12px] text-white/70 leading-snug line-clamp-2">
            {item.title}
          </div>
        ))}
      </div>
    </div>
  );
}
