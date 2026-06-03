import { Category, CategoryData, HotspotItem } from "./types";
import { fetchGitHubTrending } from "./sources/github";
import { fetchTechNews } from "./sources/tech";
import { fetchFinanceNews } from "./sources/finance";
import { fetchPoliticsNews } from "./sources/politics";
import { translateToChinese } from "./translate";
import { preprocessItemsForDisplay } from "./display-preprocess";

interface CacheEntry {
  data: CategoryData;
  timestamp: number;
}

const CACHE_TTL = 10 * 60 * 1000;
const cache = new Map<string, CacheEntry>();

const FETCHERS: Record<Category, { label: string; fetcher: () => Promise<HotspotItem[]> }> = {
  github: { label: "GitHub 热门", fetcher: fetchGitHubTrending },
  tech: { label: "技术新闻", fetcher: fetchTechNews },
  finance: { label: "金融热点", fetcher: fetchFinanceNews },
  politics: { label: "时政热点", fetcher: fetchPoliticsNews },
};

export async function fetchCategory(cat: Category, options: { forceRefresh?: boolean } = {}): Promise<CategoryData> {
  const cached = cache.get(cat);
  if (!options.forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const meta = FETCHERS[cat];
  try {
    const raw = await meta.fetcher();
    const items = await preprocessItemsForDisplay(cat, raw, translateToChinese);
    const data: CategoryData = {
      category: cat,
      label: meta.label,
      items,
      updatedAt: new Date().toISOString(),
      available: true,
    };
    cache.set(cat, { data, timestamp: Date.now() });
    return data;
  } catch {
    const fallback: CategoryData = {
      category: cat,
      label: meta.label,
      items: [],
      updatedAt: new Date().toISOString(),
      available: false,
    };
    return fallback;
  }
}

export async function fetchAllCategories(): Promise<CategoryData[]> {
  const cats = Object.keys(FETCHERS) as Category[];
  return Promise.all(cats.map((cat) => fetchCategory(cat)));
}

export async function refreshCategory(cat: Category): Promise<CategoryData> {
  return fetchCategory(cat, { forceRefresh: true });
}

export async function refreshAllCategories(): Promise<CategoryData[]> {
  const cats = Object.keys(FETCHERS) as Category[];
  return Promise.all(cats.map(refreshCategory));
}
