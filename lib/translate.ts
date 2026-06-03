import crypto from "node:crypto";

const translationCache = new Map<string, string>();

function isChinese(text: string): boolean {
  return /[\u4e00-\u9fff]/.test(text);
}

export async function translateToChinese(text: string): Promise<string> {
  if (!text || text.length < 5 || isChinese(text)) return text;

  const cached = translationCache.get(text);
  if (cached) return cached;

  const limitedText = text.slice(0, 500);
  const providers = [translateWithAlibabaCloud, translateWithMyMemory, translateWithGoogleGtx];

  for (const provider of providers) {
    const translated = await provider(limitedText);
    if (translated && isChinese(translated)) {
      translationCache.set(text, translated);
      return translated;
    }
  }

  return text;
}

async function translateWithAlibabaCloud(text: string): Promise<string | null> {
  const accessKeyId = process.env.ALIBABA_CLOUD_ACCESS_KEY_ID;
  const accessKeySecret = process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET;
  if (!accessKeyId || !accessKeySecret) return null;

  try {
    const params: Record<string, string> = {
      AccessKeyId: accessKeyId,
      Action: "TranslateGeneral",
      Format: "JSON",
      FormatType: "text",
      RegionId: process.env.ALIBABA_CLOUD_TRANSLATE_REGION || "cn-hangzhou",
      Scene: "general",
      SignatureMethod: "HMAC-SHA1",
      SignatureNonce: crypto.randomUUID(),
      SignatureVersion: "1.0",
      SourceLanguage: "en",
      SourceText: text,
      TargetLanguage: "zh",
      Timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
      Version: "2018-10-12",
    };
    params.Signature = signAlibabaRpcParams(params, accessKeySecret);

    const endpoint =
      process.env.ALIBABA_CLOUD_TRANSLATE_ENDPOINT || "mt.cn-hangzhou.aliyuncs.com";
    const res = await fetch("https://" + endpoint + "/?" + new URLSearchParams(params), {
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data.Data?.Translated || null;
  } catch {
    return null;
  }
}

function signAlibabaRpcParams(params: Record<string, string>, accessKeySecret: string): string {
  const canonicalized = Object.keys(params)
    .sort()
    .map((key) => percentEncode(key) + "=" + percentEncode(params[key]))
    .join("&");
  const stringToSign = "GET&%2F&" + percentEncode(canonicalized);
  return crypto
    .createHmac("sha1", accessKeySecret + "&")
    .update(stringToSign)
    .digest("base64");
}

function percentEncode(value: string): string {
  return encodeURIComponent(value)
    .replace(/\+/g, "%20")
    .replace(/\*/g, "%2A")
    .replace(/%7E/g, "~");
}

async function translateWithMyMemory(text: string): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      q: text,
      langpair: "en|zh-CN",
    });
    if (process.env.MYMEMORY_EMAIL) {
      params.set("de", process.env.MYMEMORY_EMAIL);
    }

    const res = await fetch("https://api.mymemory.translated.net/get?" + params, {
      signal: AbortSignal.timeout(2500),
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data.responseData?.translatedText || null;
  } catch {
    return null;
  }
}

async function translateWithGoogleGtx(text: string): Promise<string | null> {
  try {
    const res = await fetch(
      "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-CN&dt=t&q=" +
        encodeURIComponent(text),
      { signal: AbortSignal.timeout(2500) }
    );

    if (!res.ok) return null;

    const data = await res.json();
    const chunks = Array.isArray(data?.[0]) ? data[0] : [];
    const translated = chunks
      .map((chunk: unknown) => (Array.isArray(chunk) ? chunk[0] : ""))
      .filter((chunk: unknown): chunk is string => typeof chunk === "string")
      .join("");

    return translated || null;
  } catch {
    return null;
  }
}
