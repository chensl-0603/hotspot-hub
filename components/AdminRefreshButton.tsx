"use client";

import { useState, useTransition } from "react";

interface RefreshResult {
  ok: boolean;
  refreshedAt?: string;
  items?: Array<{
    category: string;
    available: boolean;
    count: number;
    error?: string;
  }>;
  error?: string;
}

export default function AdminRefreshButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<RefreshResult | null>(null);

  return (
    <div className="space-y-3">
      <button
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            const res = await fetch("/api/admin/refresh", { method: "POST" });
            const data = (await res.json().catch(() => ({ ok: false, error: "刷新响应解析失败" }))) as RefreshResult;
            setResult(data);
          });
        }}
        className="inline-flex h-10 items-center rounded-full border border-white/15 bg-white text-black px-4 text-sm font-semibold hover:bg-white/85 disabled:cursor-wait disabled:opacity-60 transition-colors"
      >
        {isPending ? "正在刷新..." : "刷新热点数据"}
      </button>
      {result && (
        <div className="rounded-[8px] border border-white/10 bg-white/[0.04] p-4 text-xs text-white/50">
          <div className="font-mono uppercase tracking-wider text-white/35">
            {result.ok ? `完成 · ${result.refreshedAt || ""}` : "刷新失败"}
          </div>
          {result.error && <p className="mt-2 text-[oklch(0.75_0.14_35)]">{result.error}</p>}
          {result.items && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {result.items.map((item) => (
                <div key={item.category} className="flex justify-between gap-3 rounded bg-white/[0.035] px-3 py-2">
                  <span className="font-mono uppercase text-white/40">{item.category}</span>
                  <span className={item.available ? "text-white/55" : "text-[oklch(0.75_0.14_35)]"}>
                    {item.available ? `${item.count} 条` : item.error || "不可用"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
