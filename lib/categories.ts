import type { Category } from "./types";

export interface CategoryConfig {
  category: Category;
  label: string;
  shortLabel: string;
  href: string;
  number: string;
  caption: string;
  accent: string;
  accentSoft: string;
  variant: "feature" | "list" | "ticker" | "editorial";
}

export const CATEGORIES: Record<Category, CategoryConfig> = {
  github: {
    category: "github",
    label: "GitHub 热门仓库",
    shortLabel: "GitHub",
    href: "/github",
    number: "01",
    caption: "Open Source",
    accent: "oklch(0.82 0.14 165)",
    accentSoft: "oklch(0.82 0.14 165 / 0.18)",
    variant: "list",
  },
  tech: {
    category: "tech",
    label: "技术新闻热点",
    shortLabel: "Tech",
    href: "/tech",
    number: "02",
    caption: "Engineering",
    accent: "oklch(0.85 0.12 130)",
    accentSoft: "oklch(0.85 0.12 130 / 0.18)",
    variant: "feature",
  },
  finance: {
    category: "finance",
    label: "金融市场动态",
    shortLabel: "Markets",
    href: "/finance",
    number: "03",
    caption: "Capital",
    accent: "oklch(0.84 0.13 95)",
    accentSoft: "oklch(0.84 0.13 95 / 0.18)",
    variant: "ticker",
  },
  politics: {
    category: "politics",
    label: "全球时政要闻",
    shortLabel: "World",
    href: "/politics",
    number: "04",
    caption: "Geopolitics",
    accent: "oklch(0.80 0.10 200)",
    accentSoft: "oklch(0.80 0.10 200 / 0.18)",
    variant: "editorial",
  },
};

export const CATEGORY_ORDER: Category[] = ["github", "tech", "finance", "politics"];
