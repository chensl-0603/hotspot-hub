import { NextRequest } from "next/server";
import { fetchCategory } from "@/lib/cache";
import type { Category } from "@/lib/types";
import {
  buildInsightPrompt,
  extractArticleText,
  extractOpenAiCompatibleDeltasFromBuffer,
  getCachedInsight,
  hasInsightProviderConfig,
  insightCacheKey,
  setCachedInsight,
  streamOpenAiCompatibleInsight,
  verifyInsightItemSnapshot,
} from "@/lib/insights";

export const dynamic = "force-dynamic";

const CATEGORY_SET = new Set<Category>(["github", "tech", "finance", "politics"]);
const encoder = new TextEncoder();

export async function GET(request: NextRequest) {
  return handleInsightRequest(request, null);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  return handleInsightRequest(request, body?.snapshot ?? null);
}

async function handleInsightRequest(request: NextRequest, snapshot: unknown) {
  const category = request.nextUrl.searchParams.get("category") as Category | null;
  const id = request.nextUrl.searchParams.get("id");

  if (!category || !CATEGORY_SET.has(category) || !id) {
    return new Response("请求参数无效。", { status: 400 });
  }

  const data = await fetchCategory(category);
  const snapshotItem = verifyInsightItemSnapshot(snapshot);
  const item =
    data.items.find((entry) => entry.id === id) ||
    (snapshotItem?.category === category && snapshotItem.id === id ? snapshotItem : null);
  if (!item) return new Response("词条不存在。", { status: 404 });

  const cached = getCachedInsight(insightCacheKey(item));
  if (cached) return streamResponse(formatSseChunk(cached));

  if (!hasInsightProviderConfig()) {
    return streamResponse(formatSseChunk("AI 解读未配置。请在 .env.local 中填写 AI_API_KEY 后重试。"));
  }

  const articleText = await extractArticleText(item.url);
  const prompt = buildInsightPrompt({ item, articleText, now: new Date() });
  const aiStream = await streamOpenAiCompatibleInsight(prompt);
  if (!aiStream) return streamResponse(formatSseChunk("AI 解读暂时不可用，请稍后重试。"));

  const reader = aiStream.getReader();
  const decoder = new TextDecoder();
  let completed = "";
  let sseBuffer = "";

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          const tail = decoder.decode();
          const parsed = extractOpenAiCompatibleDeltasFromBuffer(sseBuffer, tail + "\n");
          sseBuffer = parsed.buffer;
          if (parsed.text) completed += parsed.text;
          if (parsed.text) controller.enqueue(encoder.encode(formatSseChunk(parsed.text)));
          if (completed.trim()) setCachedInsight(insightCacheKey(item), completed);
          controller.close();
          return;
        }

        const raw = decoder.decode(value, { stream: true });
        const parsed = extractOpenAiCompatibleDeltasFromBuffer(sseBuffer, raw);
        sseBuffer = parsed.buffer;
        const text = parsed.text;

        if (text) {
          completed += text;
          controller.enqueue(encoder.encode(formatSseChunk(text)));
          return;
        }
      }
    },
    cancel() {
      reader.cancel();
    },
  });

  return streamResponse(stream);
}

function formatSseChunk(text: string) {
  return "data: " + JSON.stringify(text) + "\n\n";
}

function streamResponse(body: string | ReadableStream<Uint8Array>) {
  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
