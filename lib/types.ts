export type Category = "github" | "tech" | "finance" | "politics";

export interface HotspotItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  category: Category;
  publishedAt: string;
  popularity?: number;
}

export interface CategoryData {
  category: Category;
  label: string;
  items: HotspotItem[];
  updatedAt: string;
  available: boolean;
  error?: string;
}
