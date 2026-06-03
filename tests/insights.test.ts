import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  buildInsightPrompt,
  createInsightItemSnapshot,
  extractOpenAiCompatibleDelta,
  extractOpenAiCompatibleDeltasFromBuffer,
  getCachedInsight,
  setCachedInsight,
  streamOpenAiCompatibleInsight,
  verifyInsightItemSnapshot,
} from "../lib/insights.ts";
import type { HotspotItem } from "../lib/types.ts";

const categoryClientSource = readFileSync(
  new URL("../components/CategoryClient.tsx", import.meta.url),
  "utf8"
);
const detailPageSource = readFileSync(
  new URL("../app/item/[category]/[id]/page.tsx", import.meta.url),
  "utf8"
);
const streamRouteSource = readFileSync(
  new URL("../app/api/insights/stream/route.ts", import.meta.url),
  "utf8"
);
const insightStreamSource = readFileSync(
  new URL("../components/InsightStream.tsx", import.meta.url),
  "utf8"
);
const globalCssSource = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const nextConfigSource = readFileSync(new URL("../next.config.ts", import.meta.url), "utf8");

function item(): HotspotItem {
  return {
    id: "hn-1",
    title: "苹果推出新的 AI 模型",
    summary: "由 alice 发布，120 分",
    url: "https://example.com/story",
    source: "Hacker News",
    category: "tech",
    publishedAt: "2026-05-29T00:00:00.000Z",
    popularity: 120,
  };
}

test("category rows link to the internal insight detail page", () => {
  assert.match(categoryClientSource, /from "next\/link"/);
  assert.match(categoryClientSource, /href=\{`\/item\/\$\{item\.category\}\/\$\{encodeURIComponent\(item\.id\)\}`\}/);
  assert.doesNotMatch(categoryClientSource, /target="_blank"/);
});

test("detail page resolves an item and renders the streaming insight shell", () => {
  assert.match(detailPageSource, /fetchCategory\(category\)/);
  assert.match(detailPageSource, /notFound\(\)/);
  assert.match(detailPageSource, /createInsightItemSnapshot\(item\)/);
  assert.match(detailPageSource, /<InsightStream/);
  assert.match(detailPageSource, /阅读原文/);
});

test("insight stream posts a signed item snapshot to survive feed refreshes", () => {
  assert.match(insightStreamSource, /method: "POST"/);
  assert.match(insightStreamSource, /snapshot/);
  assert.match(streamRouteSource, /verifyInsightItemSnapshot/);
});

test("insight stream shows animated in-card loading feedback before text arrives", () => {
  assert.match(insightStreamSource, /InsightLoadingState/);
  assert.match(insightStreamSource, /insight-scanline/);
  assert.match(insightStreamSource, /insight-shimmer/);
  assert.match(globalCssSource, /@keyframes insight-shimmer/);
  assert.match(globalCssSource, /@keyframes insight-scanline/);
});

test("dev config allows ngrok origins to reach client-requested stream endpoints", () => {
  assert.match(nextConfigSource, /allowedDevOrigins/);
  assert.match(nextConfigSource, /\*\.ngrok-free\.app/);
  assert.match(nextConfigSource, /\*\.ngrok-free\.dev/);
});

test("stream route handles missing AI key without blocking the detail page", () => {
  assert.match(streamRouteSource, /AI_API_KEY/);
  assert.doesNotMatch(streamRouteSource, /DEEPSEEK_API_KEY/);
  assert.match(streamRouteSource, /AI 解读未配置/);
  assert.match(streamRouteSource, /text\/event-stream; charset=utf-8/);
});

test("stream route uses SSE headers so public tunnels do not buffer chunks", () => {
  assert.match(streamRouteSource, /formatSseChunk/);
  assert.match(streamRouteSource, /X-Accel-Buffering/);
  assert.match(streamRouteSource, /no-transform/);
});

test("stream route falls back to the signed snapshot when the current feed misses the id", () => {
  assert.match(streamRouteSource, /data\.items\.find\(\(entry\) => entry\.id === id\) \|\|/);
  assert.match(streamRouteSource, /snapshotItem\?\.category === category && snapshotItem\.id === id/);
});

test("extracts text from OpenAI-compatible streaming deltas", () => {
  assert.equal(
    extractOpenAiCompatibleDelta('data: {"choices":[{"delta":{"content":"第一段"}}]}'),
    "第一段"
  );
  assert.equal(extractOpenAiCompatibleDelta("data: [DONE]"), null);
});

test("extracts OpenAI-compatible deltas when SSE lines are split across chunks", () => {
  let buffer = "";

  let parsed = extractOpenAiCompatibleDeltasFromBuffer(
    buffer,
    'data: {"choices":[{"delta":{"content":"第一'
  );
  buffer = parsed.buffer;

  assert.equal(parsed.text, "");
  assert.equal(buffer, 'data: {"choices":[{"delta":{"content":"第一');

  parsed = extractOpenAiCompatibleDeltasFromBuffer(buffer, '段"}}]}\n\n');

  assert.equal(parsed.text, "第一段");
  assert.equal(parsed.buffer, "");
});

test("prompt falls back to title and summary when article extraction fails", () => {
  const prompt = buildInsightPrompt({
    item: item(),
    articleText: null,
    now: new Date("2026-05-29T08:00:00.000Z"),
  });

  assert.match(prompt, /苹果推出新的 AI 模型/);
  assert.match(prompt, /由 alice 发布，120 分/);
  assert.match(prompt, /正文抓取不可用/);
});

test("prompt anchors time judgments to the current app date", () => {
  const prompt = buildInsightPrompt({
    item: item(),
    articleText: null,
    now: new Date("2026-05-29T08:00:00.000Z"),
  });

  assert.match(prompt, /当前日期：2026-05-29/);
  assert.match(prompt, /Asia\/Shanghai/);
  assert.match(prompt, /不要把已发生的 2026 日期说成未来/);
  assert.match(prompt, /判断时间新旧必须以当前日期和发布时间为准/);
});

test("insight cache stores completed responses for 24 hours", () => {
  const key = "v2|https://example.com/story|苹果推出新的 AI 模型";
  const now = Date.now();

  setCachedInsight(key, "缓存解读", now);

  assert.equal(getCachedInsight(key, now + 60 * 60 * 1000), "缓存解读");
  assert.equal(getCachedInsight(key, now + 25 * 60 * 60 * 1000), null);
});

test("signed item snapshots reject tampered item data", () => {
  const snapshot = createInsightItemSnapshot(item());

  assert.deepEqual(verifyInsightItemSnapshot(snapshot), item());
  assert.equal(
    verifyInsightItemSnapshot({
      ...snapshot,
      item: { ...snapshot.item, url: "https://evil.example/story" },
    }),
    null
  );
});

test("insight provider uses generic AI env names and keeps DeepSeek defaults only as values", () => {
  assert.match(streamRouteSource, /hasInsightProviderConfig/);
  assert.doesNotMatch(streamRouteSource, /process\.env\.DEEPSEEK/);
  assert.match(streamRouteSource, /\.env\.local 中填写 AI_API_KEY/);
});

test("insight provider sends OpenAI-compatible requests from AI env variables", async (t) => {
  const oldFetch = globalThis.fetch;
  const oldApiKey = process.env.AI_API_KEY;
  const oldApiBase = process.env.AI_API_BASE;
  const oldModel = process.env.AI_MODEL;
  const calls: Array<{ url: string; init: RequestInit }> = [];

  process.env.AI_API_KEY = "test-key";
  process.env.AI_API_BASE = "https://example.ai/v1";
  process.env.AI_MODEL = "mimo-v2.5";
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init || {} });
    return new Response("data: [DONE]\n\n", {
      status: 200,
      headers: { "Content-Type": "text/event-stream" },
    });
  }) as typeof fetch;

  t.after(() => {
    globalThis.fetch = oldFetch;
    process.env.AI_API_KEY = oldApiKey;
    process.env.AI_API_BASE = oldApiBase;
    process.env.AI_MODEL = oldModel;
  });

  const stream = await streamOpenAiCompatibleInsight("帮我解读一下");

  assert.ok(stream);
  assert.equal(calls[0].url, "https://example.ai/v1/chat/completions");
  assert.equal((calls[0].init.headers as Record<string, string>).Authorization, "Bearer test-key");
  assert.equal(JSON.parse(calls[0].init.body as string).model, "mimo-v2.5");
});
