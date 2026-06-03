import assert from "node:assert/strict";
import test from "node:test";
import { translateToChinese } from "../lib/translate.ts";

function response(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  });
}

test("does not cache untranslated fallback after a failed translation request", async () => {
  const originalFetch = globalThis.fetch;
  const calls: string[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    calls.push(String(input));
    if (calls.length === 1) {
      return response({ error: "rate limited" }, { status: 429 });
    }
    return response({ responseData: { translatedText: "苹果发布新的人工智能模型" } });
  }) as typeof fetch;

  try {
    const text = "Apple launches new AI model " + Date.now();

    assert.equal(await translateToChinese(text), text);
    assert.equal(await translateToChinese(text), "苹果发布新的人工智能模型");
    assert.equal(calls.length, 3);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("uses Alibaba Cloud machine translation first when credentials are configured", async () => {
  const originalFetch = globalThis.fetch;
  const originalKeyId = process.env.ALIBABA_CLOUD_ACCESS_KEY_ID;
  const originalSecret = process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET;
  const calls: string[] = [];

  process.env.ALIBABA_CLOUD_ACCESS_KEY_ID = "test-key";
  process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET = "test-secret";
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    calls.push(String(input));
    return response({ Data: { Translated: "苹果发布新的人工智能模型" } });
  }) as typeof fetch;

  try {
    const result = await translateToChinese("Apple launches Alibaba model");
    const url = new URL(calls[0]);

    assert.equal(result, "苹果发布新的人工智能模型");
    assert.equal(url.hostname, "mt.cn-hangzhou.aliyuncs.com");
    assert.equal(url.searchParams.get("Action"), "TranslateGeneral");
    assert.equal(url.searchParams.get("SourceLanguage"), "en");
    assert.equal(url.searchParams.get("TargetLanguage"), "zh");
    assert.equal(url.searchParams.get("FormatType"), "text");
    assert.equal(url.searchParams.get("SignatureMethod"), "HMAC-SHA1");
    assert.ok(url.searchParams.get("Signature"));
    assert.equal(calls.length, 1);
  } finally {
    restoreEnv("ALIBABA_CLOUD_ACCESS_KEY_ID", originalKeyId);
    restoreEnv("ALIBABA_CLOUD_ACCESS_KEY_SECRET", originalSecret);
    globalThis.fetch = originalFetch;
  }
});

test("skips Alibaba Cloud when credentials are missing", async () => {
  const originalFetch = globalThis.fetch;
  const originalKeyId = process.env.ALIBABA_CLOUD_ACCESS_KEY_ID;
  const originalSecret = process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET;
  const calls: string[] = [];

  delete process.env.ALIBABA_CLOUD_ACCESS_KEY_ID;
  delete process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    calls.push(String(input));
    return response({ responseData: { translatedText: "苹果发布新的人工智能模型" } });
  }) as typeof fetch;

  try {
    const result = await translateToChinese("Apple launches public fallback model");

    assert.equal(result, "苹果发布新的人工智能模型");
    assert.match(calls[0], /api\.mymemory\.translated\.net/);
  } finally {
    restoreEnv("ALIBABA_CLOUD_ACCESS_KEY_ID", originalKeyId);
    restoreEnv("ALIBABA_CLOUD_ACCESS_KEY_SECRET", originalSecret);
    globalThis.fetch = originalFetch;
  }
});

test("tries the next translation provider when the first provider is unavailable", async () => {
  const originalFetch = globalThis.fetch;
  const calls: string[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    calls.push(String(input));
    if (calls.length === 1) {
      return response({ error: "rate limited" }, { status: 429 });
    }
    return response([[["苹果发布新的人工智能模型", "Apple launches new AI model"]]]);
  }) as typeof fetch;

  try {
    const result = await translateToChinese("Apple launches new AI model fallback");

    assert.equal(result, "苹果发布新的人工智能模型");
    assert.equal(calls.length, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

function restoreEnv(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}

test("passes configured MyMemory email to raise translation quota", async () => {
  const originalFetch = globalThis.fetch;
  const originalEmail = process.env.MYMEMORY_EMAIL;
  const calls: string[] = [];

  process.env.MYMEMORY_EMAIL = "ops@example.com";
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    calls.push(String(input));
    return response({ responseData: { translatedText: "苹果发布新的人工智能模型" } });
  }) as typeof fetch;

  try {
    const result = await translateToChinese("Apple launches configured email model");

    assert.equal(result, "苹果发布新的人工智能模型");
    assert.match(calls[0], /[?&]de=ops%40example\.com/);
  } finally {
    if (originalEmail === undefined) {
      delete process.env.MYMEMORY_EMAIL;
    } else {
      process.env.MYMEMORY_EMAIL = originalEmail;
    }
    globalThis.fetch = originalFetch;
  }
});
