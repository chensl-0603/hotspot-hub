import { HotspotItem } from "../types";

interface HNStory {
  id: number;
  title: string;
  url?: string;
  score: number;
  by: string;
  time: number;
}

export async function fetchTechNews(): Promise<HotspotItem[]> {
  try {
    const res = await fetch(
      "https://hacker-news.firebaseio.com/v0/topstories.json",
      { next: { revalidate: 600 } }
    );

    if (!res.ok) return getTechFallback();

    const ids: number[] = await res.json();
    const top8 = ids.slice(0, 8);
    if (top8.length === 0) return getTechFallback();

    const stories = await Promise.all(
      top8.map(async (id) => {
        try {
          const storyRes = await fetch(
            "https://hacker-news.firebaseio.com/v0/item/" + id + ".json",
            { signal: AbortSignal.timeout(5000) }
          );
          return (await storyRes.json()) as HNStory;
        } catch {
          return null;
        }
      })
    );

    const items = stories
      .filter((s): s is HNStory => s !== null && !!s.title)
      .map((story) => ({
        id: "hn-" + story.id,
        title: story.title,
        summary: "由 " + story.by + " 发布，" + story.score + " 分",
        url: story.url || "https://news.ycombinator.com/item?id=" + story.id,
        source: "Hacker News",
        category: "tech" as const,
        publishedAt: new Date(story.time * 1000).toISOString(),
        popularity: story.score,
      }));

    return items.length === 0 ? getTechFallback() : items;
  } catch {
    return getTechFallback();
  }
}

function getTechFallback(): HotspotItem[] {
  const now = new Date().toISOString();
  return [
    {
      id: "tech-fb-1",
      title: "AI 编程工具进入工程团队日常工作流",
      summary: "团队开始将代码生成、测试补全和文档整理接入开发流程，关注点转向质量控制与评审效率。",
      url: "https://news.ycombinator.com",
      source: "Hacker News",
      category: "tech",
      publishedAt: now,
      popularity: 96,
    },
    {
      id: "tech-fb-2",
      title: "开源数据库社区讨论向量检索与事务系统融合",
      summary: "开发者关注检索增强应用中的延迟、索引更新和传统 OLTP 负载兼容性。",
      url: "https://news.ycombinator.com",
      source: "Hacker News",
      category: "tech",
      publishedAt: now,
      popularity: 82,
    },
    {
      id: "tech-fb-3",
      title: "浏览器端 AI 推理性能继续提升",
      summary: "WebGPU、模型量化和本地缓存让更多轻量模型能够直接在用户设备上运行。",
      url: "https://news.ycombinator.com",
      source: "Hacker News",
      category: "tech",
      publishedAt: now,
      popularity: 74,
    },
    {
      id: "tech-fb-4",
      title: "前端框架继续押注服务端组件与流式渲染",
      summary: "社区围绕缓存边界、数据请求位置和部署复杂度展开讨论。",
      url: "https://news.ycombinator.com",
      source: "Hacker News",
      category: "tech",
      publishedAt: now,
      popularity: 68,
    },
  ];
}
