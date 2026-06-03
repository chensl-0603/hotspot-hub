import { CATEGORIES } from "@/lib/categories";
import type { Category, HotspotItem } from "@/lib/types";

interface Props {
  items: (HotspotItem & { _cat: Category })[];
}

export default function HomeMarquee({ items }: Props) {
  if (items.length === 0) return null;
  const doubled = [...items, ...items];

  return (
    <div className="relative w-full overflow-hidden border-y border-white/[0.05] bg-white/[0.015] py-3 mb-8">
      <div
        className="absolute left-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
        style={{
          background:
            "linear-gradient(to right, oklch(0.14 0.02 175 / 0.95), transparent)",
        }}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
        style={{
          background:
            "linear-gradient(to left, oklch(0.14 0.02 175 / 0.95), transparent)",
        }}
      />
      <div className="flex animate-marquee whitespace-nowrap will-change-transform">
        {doubled.map((item, i) => {
          const cfg = CATEGORIES[item._cat];
          return (
            <span key={item.id + "-" + i} className="inline-flex items-center gap-3 px-8 text-[12.5px]">
              <span
                className="font-mono text-[10px] tracking-widest uppercase"
                style={{ color: cfg.accent }}
              >
                {cfg.shortLabel}
              </span>
              <span className="text-white/65 truncate max-w-[480px]">{item.title}</span>
              <span className="text-white/15">·</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
