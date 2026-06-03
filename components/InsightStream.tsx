"use client";

import { useEffect, useMemo, useState } from "react";
import type { InsightItemSnapshot } from "@/lib/insights";
import type { Category } from "@/lib/types";

interface Props {
  category: Category;
  id: string;
  accent: string;
  snapshot: InsightItemSnapshot;
}

export default function InsightStream({ category, id, accent, snapshot }: Props) {
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");

  const endpoint = useMemo(() => {
    const params = new URLSearchParams({ category, id });
    return "/api/insights/stream?" + params;
  }, [category, id]);

  useEffect(() => {
    const controller = new AbortController();

    async function run() {
      try {
        setStatus("loading");
        setContent("");

        const res = await fetch(endpoint, {
          method: "POST",
          signal: controller.signal,
          headers: {
            Accept: "text/plain",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ snapshot }),
        });
        if (!res.ok || !res.body) {
          const message = await res.text().catch(() => "");
          setStatus("error");
          setContent(message || "AI 解读暂时不可用。");
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let sseBuffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const parsed = readSseText(sseBuffer, decoder.decode(value, { stream: true }));
          sseBuffer = parsed.buffer;
          if (parsed.text) setContent((current) => current + parsed.text);
        }

        const tail = readSseText(sseBuffer, decoder.decode() + "\n\n");
        if (tail.text) setContent((current) => current + tail.text);
        setStatus("done");
      } catch {
        if (!controller.signal.aborted) {
          setStatus("error");
          setContent("AI 解读暂时不可用。");
        }
      }
    }

    run();
    return () => controller.abort();
  }, [endpoint, snapshot]);

  return (
    <section className="mt-10 border-t border-white/[0.06] pt-8">
      <div className="flex items-center justify-between gap-4 mb-5">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.22em]" style={{ color: accent }}>
            AI Insight
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">站内摘要理解</h2>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-wider text-white/35 flex items-center gap-2">
          {status === "loading" && (
            <span className="h-1.5 w-1.5 rounded-full animate-ticker" style={{ background: accent }} />
          )}
          {status === "loading" ? "Generating" : status === "done" ? "Complete" : "Unavailable"}
        </span>
      </div>

      <div className="min-h-[260px] rounded-2xl border border-white/[0.06] bg-white/[0.025] px-5 py-5 md:px-6 md:py-6">
        {content ? (
          <StreamingMarkdown text={content} />
        ) : (
          <InsightLoadingState accent={accent} />
        )}
      </div>
    </section>
  );
}

function readSseText(buffer: string, chunk: string): { text: string; buffer: string } {
  const combined = buffer + chunk;
  const parts = combined.split(/\n\n/);
  const rest = parts.pop() || "";
  const text = parts
    .map((part) =>
      part
        .split(/\r?\n/)
        .filter((line) => line.startsWith("data:"))
        .map((line) => parseSseData(line.slice(5).trim()))
        .join("")
    )
    .join("");

  return { text, buffer: rest };
}

function parseSseData(payload: string) {
  if (!payload || payload === "[DONE]") return "";
  try {
    const value = JSON.parse(payload);
    return typeof value === "string" ? value : "";
  } catch {
    return payload;
  }
}

function InsightLoadingState({ accent }: { accent: string }) {
  const rows = ["w-[72%]", "w-[91%]", "w-[84%]", "w-[64%]", "w-[78%]"];

  return (
    <div className="relative min-h-[190px] overflow-hidden rounded-xl border border-white/[0.04] bg-[oklch(0.11_0.018_175/0.34)] px-4 py-4">
      <div
        className="pointer-events-none absolute inset-x-4 top-0 h-px insight-scanline"
        style={{ background: "linear-gradient(90deg, transparent, " + accent + ", transparent)" }}
      />
      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-white/28">
        <span className="h-1.5 w-1.5 rounded-full animate-ticker" style={{ background: accent }} />
        Reading source
      </div>
      <div className="mt-7 space-y-3.5">
        {rows.map((width, index) => (
          <div
            key={width}
            className={"insight-shimmer h-3 rounded-full bg-white/[0.045] " + width}
            style={{ animationDelay: index * 120 + "ms" }}
          />
        ))}
      </div>
      <div className="mt-8 grid grid-cols-[54px_1fr] gap-3">
        <div className="insight-shimmer h-10 rounded-lg bg-white/[0.035]" />
        <div className="space-y-2.5 pt-1">
          <div className="insight-shimmer h-2.5 w-2/3 rounded-full bg-white/[0.04]" />
          <div className="insight-shimmer h-2.5 w-1/2 rounded-full bg-white/[0.03]" />
        </div>
      </div>
    </div>
  );
}

function StreamingMarkdown({ text }: { text: string }) {
  return (
    <div className="space-y-3 text-[14px] leading-7 text-white/72">
      {text.split("\n").map((line, i) => {
        if (line.startsWith("## ")) {
          return (
            <h3 key={i} className="pt-3 text-[15px] font-semibold text-white">
              {line.replace(/^##\s+/, "")}
            </h3>
          );
        }
        if (line.trim().startsWith("- ")) {
          return (
            <p key={i} className="pl-4 text-white/68">
              {line.trim()}
            </p>
          );
        }
        return line.trim() ? <p key={i}>{line}</p> : <div key={i} className="h-1" />;
      })}
    </div>
  );
}
