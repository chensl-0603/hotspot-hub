import { HotspotItem } from "../types";

export async function fetchPoliticsNews(): Promise<HotspotItem[]> {
  const sources = [
    "https://news.google.com/rss?hl=zh-CN&gl=CN&ceid=CN:zh-Hans",
    "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
  ];

  for (const url of sources) {
    try {
      const res = await fetch(url, {
        next: { revalidate: 600 },
        signal: AbortSignal.timeout(1500),
      });
      if (!res.ok) continue;
      const xml = await res.text();
      const items = parseRSS(xml);
      if (items.length > 0) {
        return items.slice(0, 10).map((item, i) => ({
          id: "pol-" + i + "-" + Buffer.from(item.link || item.title).toString("base64").slice(0, 8),
          title: item.title,
          summary: item.description.replace(/<[^>]+>/g, "").slice(0, 120) || "暂无摘要",
          url: item.link || "#",
          source: new URL(url).hostname,
          category: "politics" as const,
          publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        }));
      }
    } catch {
      // continue
    }
  }
  return getFallback();
}

function parseRSS(xml: string) {
  const items: { title: string; link: string; description: string; pubDate: string }[] = [];
  const re = /<item>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const b = m[1];
    const g = (t: string) => {
      const x = b.match(new RegExp("<" + t + "[^>]*>([\\s\\S]*?)</" + t + ">"));
      return x ? x[1].trim().replace(/<!\[CDATA\[|\]\]>/g, "") : "";
    };
    items.push({ title: g("title"), link: g("link"), description: g("description"), pubDate: g("pubDate") });
  }
  return items;
}

function getFallback(): HotspotItem[] {
  const now = new Date().toISOString();
  return [
    { id: "pol-1", title: "G20峰会聚焦全球治理改革", summary: "各国领导人就气候变化、债务问题等议题展开讨论。", url: "https://www.reuters.com", source: "Reuters", category: "politics", publishedAt: now, popularity: 88 },
    { id: "pol-2", title: "联合国安理会讨论中东局势", summary: "多方呼吁停火与人道主义援助通道开放。", url: "https://news.un.org", source: "UN News", category: "politics", publishedAt: now, popularity: 85 },
    { id: "pol-3", title: "欧盟通过新一轮数字监管法案", summary: "加强对大型科技公司的数据与反垄断监管。", url: "https://www.bbc.com", source: "BBC", category: "politics", publishedAt: now, popularity: 72 },
    { id: "pol-4", title: "亚太经合组织会议达成多项合作共识", summary: "区域经济一体化与供应链韧性成为焦点。", url: "https://www.reuters.com", source: "Reuters", category: "politics", publishedAt: now, popularity: 68 },
    { id: "pol-5", title: "多国签署气候行动新承诺", summary: "COP后续谈判推进减排目标细化与资金落实。", url: "https://www.bbc.com", source: "BBC", category: "politics", publishedAt: now, popularity: 65 },
  ];
}