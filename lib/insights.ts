import { Readability } from "@mozilla/readability";
import { createHmac } from "crypto";
import { JSDOM } from "jsdom";
import type { HotspotItem } from "./types";

const INSIGHT_CACHE_TTL = 24 * 60 * 60 * 1000;
const INSIGHT_PROMPT_VERSION = "v2";
const DEFAULT_AI_API_BASE = "https://api.deepseek.com";
const DEFAULT_AI_MODEL = "deepseek-v4-flash";
const insightCache = new Map<string, { value: string; timestamp: number }>();

export interface InsightItemSnapshot {
  item: HotspotItem;
  signature: string;
}

export function insightCacheKey(item: HotspotItem): string {
  return INSIGHT_PROMPT_VERSION + "|" + item.url + "|" + item.title;
}

export function getCachedInsight(key: string, now = Date.now()): string | null {
  const cached = insightCache.get(key);
  if (!cached) return null;
  if (now - cached.timestamp > INSIGHT_CACHE_TTL) {
    insightCache.delete(key);
    return null;
  }
  return cached.value;
}

export function setCachedInsight(key: string, value: string, now = Date.now()) {
  insightCache.set(key, { value, timestamp: now });
}

export function createInsightItemSnapshot(item: HotspotItem): InsightItemSnapshot {
  return {
    item,
    signature: signInsightItem(item),
  };
}

export function verifyInsightItemSnapshot(snapshot: unknown): HotspotItem | null {
  if (!snapshot || typeof snapshot !== "object") return null;

  const { item, signature } = snapshot as { item?: HotspotItem; signature?: unknown };
  if (!isHotspotItem(item) || typeof signature !== "string") return null;

  const expected = signInsightItem(item);
  return signature === expected ? item : null;
}

export async function extractArticleText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "hotspot-hub/1.0",
      },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;

    const html = await res.text();
    const dom = new JSDOM(html, { url });
    const article = new Readability(dom.window.document).parse();
    const text = article?.textContent?.replace(/\s+/g, " ").trim();
    return text ? text.slice(0, 7000) : null;
  } catch {
    return null;
  }
}

function signInsightItem(item: HotspotItem): string {
  return createHmac("sha256", getInsightProviderConfig().apiKey || "hotspot-hub-dev")
    .update(stableStringify(item))
    .digest("hex");
}

function stableStringify(item: HotspotItem): string {
  return JSON.stringify({
    id: item.id,
    title: item.title,
    summary: item.summary,
    url: item.url,
    source: item.source,
    category: item.category,
    publishedAt: item.publishedAt,
    popularity: item.popularity,
  });
}

function isHotspotItem(value: unknown): value is HotspotItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<HotspotItem>;
  return (
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    typeof item.summary === "string" &&
    typeof item.url === "string" &&
    typeof item.source === "string" &&
    ["github", "tech", "finance", "politics"].includes(item.category || "") &&
    typeof item.publishedAt === "string" &&
    (item.popularity === undefined || typeof item.popularity === "number")
  );
}

export function buildInsightPrompt({
  item,
  articleText,
  now = new Date(),
}: {
  item: HotspotItem;
  articleText: string | null;
  now?: Date;
}): string {
  const body = articleText || "正文抓取不可用，请基于标题、已有摘要、来源和热度进行谨慎解读。";
  const currentDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return [
    "你是 Hotspot Hub 的中文研究助理。请用中文帮助用户判断这条内容是否值得点开原文阅读。",
    "输出结构化 Markdown，不要编造未给出的事实。若信息不足，请明确说明不确定。",
    `当前日期：${currentDate}（Asia/Shanghai）。判断时间新旧必须以当前日期和发布时间为准。不要根据模型知识截止日期推断现在是哪一年，不要把已发生的 2026 日期说成未来。`,
    "",
    "必须包含这些小节：",
    "## 这篇在讲什么",
    "## 为什么值得读",
    "## 关键背景",
    "## 需要注意",
    "## 相关延伸",
    "",
    "资料：",
    `标题：${item.title}`,
    `已有摘要：${item.summary}`,
    `来源：${item.source}`,
    `发布时间：${item.publishedAt}`,
    item.popularity === undefined ? "" : `热度：${item.popularity}`,
    `原文链接：${item.url}`,
    "",
    "正文或可用上下文：",
    body,
  ]
    .filter(Boolean)
    .join("\n");
}

export function getInsightProviderConfig() {
  return {
    apiKey: process.env.AI_API_KEY || "",
    apiBase: process.env.AI_API_BASE || DEFAULT_AI_API_BASE,
    model: process.env.AI_MODEL || DEFAULT_AI_MODEL,
  };
}

export function hasInsightProviderConfig() {
  return Boolean(getInsightProviderConfig().apiKey);
}

export function extractOpenAiCompatibleDelta(line: string): string | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("data:")) return null;

  const payload = trimmed.slice(5).trim();
  if (!payload || payload === "[DONE]") return null;

  try {
    const data = JSON.parse(payload);
    const content = data.choices?.[0]?.delta?.content;
    return typeof content === "string" && content.length > 0 ? content : null;
  } catch {
    return null;
  }
}

export function extractOpenAiCompatibleDeltasFromBuffer(
  buffer: string,
  chunk: string
): { text: string; buffer: string } {
  const combined = buffer + chunk;
  const lastLineBreak = combined.lastIndexOf("\n");
  if (lastLineBreak === -1) return { text: "", buffer: combined };

  const complete = combined.slice(0, lastLineBreak + 1);
  const rest = combined.slice(lastLineBreak + 1);
  const text = complete
    .split(/\r?\n/)
    .map(extractOpenAiCompatibleDelta)
    .filter((part): part is string => Boolean(part))
    .join("");

  return { text, buffer: rest };
}

export async function streamOpenAiCompatibleInsight(prompt: string): Promise<ReadableStream<Uint8Array> | null> {
  const { apiKey, apiBase, model } = getInsightProviderConfig();
  if (!apiKey) return null;

  const res = await fetch(apiBase.replace(/\/$/, "") + "/chat/completions", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      stream: true,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: "你只输出中文 Markdown。保持克制、准确、可读。当前日期以用户消息中的当前日期为准，不要使用模型知识截止日期判断时间。",
        },
        { role: "user", content: prompt },
      ],
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok || !res.body) return null;
  return res.body;
}
