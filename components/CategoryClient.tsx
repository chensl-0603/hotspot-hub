"use client";

import Link from "next/link";
import { useMemo, useState, useEffect, useRef } from "react";
import type { HotspotItem } from "@/lib/types";
import { timeAgo, compactNumber } from "@/lib/format";

type SortKey = "latest" | "popular";

const PAGE_SIZE = 12;

interface Props {
  items: HotspotItem[];
  accent: string;
  available: boolean;
  renderedAt: number;
}

interface FilterState {
  search: string;
  sort: SortKey;
  sourceFilter: string;
  page: number;
}

const INITIAL: FilterState = { search: "", sort: "latest", sourceFilter: "all", page: 1 };

export default function CategoryClient({ items, accent, available, renderedAt }: Props) {
  const [state, setState] = useState<FilterState>(INITIAL);
  const { search, sort, sourceFilter, page } = state;
  const listRef = useRef<HTMLDivElement>(null);

  const setSearch = (v: string) => setState((s) => ({ ...s, search: v, page: 1 }));
  const setSort = (v: SortKey) => setState((s) => ({ ...s, sort: v, page: 1 }));
  const setSourceFilter = (v: string) => setState((s) => ({ ...s, sourceFilter: v, page: 1 }));
  const setPage = (p: number) => setState((s) => ({ ...s, page: p }));

  const sources = useMemo(() => Array.from(new Set(items.map((i) => i.source))), [items]);

  const filtered = useMemo(() => {
    let arr = [...items];
    if (sourceFilter !== "all") arr = arr.filter((i) => i.source === sourceFilter);
    const q = search.trim().toLowerCase();
    if (q) arr = arr.filter((i) => i.title.toLowerCase().includes(q) || i.summary.toLowerCase().includes(q));
    arr.sort((a, b) => {
      if (sort === "popular") return (b.popularity ?? 0) - (a.popularity ?? 0);
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });
    return arr;
  }, [items, search, sort, sourceFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  if (!available) {
    return (
      <div className="px-6 md:px-12 max-w-[1280px] mx-auto py-20 text-center text-white/30">
        数据源暂不可用，请稍后再试。
      </div>
    );
  }

  return (
    <>
      <Toolbar
        accent={accent}
        search={search}
        onSearch={setSearch}
        sort={sort}
        onSort={setSort}
        sources={sources}
        sourceFilter={sourceFilter}
        onSourceChange={setSourceFilter}
        total={filtered.length}
      />

      <div ref={listRef} className="px-6 md:px-12 max-w-[1280px] w-full mx-auto pt-8">
        {paged.length === 0 ? (
          <div className="py-20 text-center text-white/30 text-sm">没有匹配的结果。</div>
        ) : (
          <ol className="divide-y divide-white/[0.05]">
            {paged.map((item, i) => (
              <ListRow
                key={item.id}
                item={item}
                index={(safePage - 1) * PAGE_SIZE + i + 1}
                accent={accent}
                renderedAt={renderedAt}
              />
            ))}
          </ol>
        )}

        {totalPages > 1 && (
          <Pagination page={safePage} totalPages={totalPages} accent={accent} onChange={(p) => {
            setPage(p);
            listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          }} />
        )}
      </div>
    </>
  );
}

function Toolbar(props: {
  accent: string;
  search: string;
  onSearch: (v: string) => void;
  sort: SortKey;
  onSort: (v: SortKey) => void;
  sources: string[];
  sourceFilter: string;
  onSourceChange: (v: string) => void;
  total: number;
}) {
  return (
    <div className="sticky top-0 z-30 backdrop-blur-2xl bg-[oklch(0.14_0.02_175/0.7)] border-y border-white/[0.05]">
      <div className="px-6 md:px-12 max-w-[1280px] mx-auto py-3 flex items-center gap-3 flex-wrap">
        <span className="text-[10px] font-mono uppercase tracking-widest text-white/35 shrink-0">
          {props.total} results
        </span>
        <div className="h-4 w-px bg-white/10" />

        <div className="relative flex-1 min-w-[180px] max-w-md">
          <input
            type="text"
            placeholder="搜索关键词"
            value={props.search}
            onChange={(e) => props.onSearch(e.target.value)}
            className="w-full bg-transparent text-[13px] text-white placeholder-white/25 py-2 pl-7 pr-3 border-b border-white/10 focus:outline-none focus:border-white/40 transition-colors"
          />
          <span className="absolute left-0 top-1/2 -translate-y-1/2 text-white/30 text-[12px]">⌕</span>
        </div>

        <SegmentedControl
          accent={props.accent}
          value={props.sort}
          options={[
            { value: "latest", label: "最新" },
            { value: "popular", label: "最热" },
          ]}
          onChange={(v) => props.onSort(v as SortKey)}
        />

        {props.sources.length > 1 && (
          <SourceSelect
            sources={props.sources}
            value={props.sourceFilter}
            onChange={props.onSourceChange}
          />
        )}
      </div>
    </div>
  );
}

function SegmentedControl({
  accent,
  value,
  options,
  onChange,
}: {
  accent: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="inline-flex rounded-full bg-white/[0.04] p-0.5 text-[11px] font-mono uppercase tracking-wider">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={
              "px-3.5 py-1.5 rounded-full transition-colors duration-200 " +
              (active ? "text-[oklch(0.14_0.02_175)]" : "text-white/55 hover:text-white/90")
            }
            style={active ? { background: accent } : undefined}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function SourceSelect({
  sources,
  value,
  onChange,
}: {
  sources: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const current = value === "all" ? "全部来源" : value;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-mono uppercase tracking-wider text-white/60 hover:text-white/90 bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
      >
        {current}
        <span className={"transition-transform " + (open ? "rotate-180" : "")}>▾</span>
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-2 min-w-[160px] rounded-xl overflow-hidden border border-white/10 backdrop-blur-2xl bg-[oklch(0.16_0.02_175/0.92)] shadow-[0_24px_60px_oklch(0_0_0/0.5)]"
        >
          <button
            type="button"
            onClick={() => {
              onChange("all");
              setOpen(false);
            }}
            className={
              "block w-full text-left px-4 py-2 text-[12px] transition-colors " +
              (value === "all" ? "text-white bg-white/[0.06]" : "text-white/55 hover:text-white hover:bg-white/[0.04]")
            }
          >
            全部来源
          </button>
          {sources.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                onChange(s);
                setOpen(false);
              }}
              className={
                "block w-full text-left px-4 py-2 text-[12px] transition-colors " +
                (value === s ? "text-white bg-white/[0.06]" : "text-white/55 hover:text-white hover:bg-white/[0.04]")
              }
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ListRow({
  item,
  index,
  accent,
  renderedAt,
}: {
  item: HotspotItem;
  index: number;
  accent: string;
  renderedAt: number;
}) {
  return (
    <li>
      <Link
        href={`/item/${item.category}/${encodeURIComponent(item.id)}`}
        className="group grid grid-cols-[auto_1fr_auto] items-baseline gap-x-6 gap-y-1 py-5 transition-colors hover:bg-white/[0.015] -mx-3 px-3 rounded-xl"
      >
        <span
          className="font-mono text-[12px] tabular-nums tracking-wider"
          style={{ color: index <= 3 ? accent : "rgba(255,255,255,0.3)" }}
        >
          {String(index).padStart(2, "0")}
        </span>
        <h3 className="text-[15px] md:text-[17px] text-white/90 leading-snug font-medium group-hover:text-white transition-colors">
          {item.title}
        </h3>
        <span className="text-[10.5px] font-mono uppercase tracking-wider text-white/30 tabular-nums shrink-0">
          {timeAgo(item.publishedAt, renderedAt)}
        </span>

        <span className="col-start-2 text-[13px] text-white/50 leading-relaxed line-clamp-2 max-w-prose">
          {item.summary}
        </span>
        <span className="col-start-2 mt-1 flex items-center gap-3 text-[10.5px] font-mono uppercase tracking-wider text-white/35">
          <span>{item.source}</span>
          {item.popularity !== undefined && (
            <>
              <span className="text-white/15">·</span>
              <span className="tabular-nums">★ {compactNumber(item.popularity)}</span>
            </>
          )}
        </span>
      </Link>
    </li>
  );
}

function Pagination({
  page,
  totalPages,
  accent,
  onChange,
}: {
  page: number;
  totalPages: number;
  accent: string;
  onChange: (p: number) => void;
}) {
  const pages = pageWindow(page, totalPages);
  return (
    <div className="mt-12 flex items-center justify-center gap-1 text-[12px] font-mono tabular-nums">
      <button
        type="button"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        className="px-3 py-1.5 text-white/40 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        ← prev
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={"e" + i} className="px-2 text-white/25">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className={
              "w-9 h-9 rounded-full transition-colors " +
              (p === page
                ? "text-[oklch(0.14_0.02_175)]"
                : "text-white/45 hover:text-white hover:bg-white/[0.04]")
            }
            style={p === page ? { background: accent } : undefined}
          >
            {p}
          </button>
        )
      )}
      <button
        type="button"
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
        className="px-3 py-1.5 text-white/40 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        next →
      </button>
    </div>
  );
}

function pageWindow(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set<number>([1, total, current, current - 1, current + 1]);
  const sorted = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const result: (number | "…")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    result.push(sorted[i]);
    if (i < sorted.length - 1 && sorted[i + 1] - sorted[i] > 1) result.push("…");
  }
  return result;
}
