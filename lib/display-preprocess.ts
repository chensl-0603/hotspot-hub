import type { Category, HotspotItem } from "./types";

type Translator = (text: string) => Promise<string>;

const TITLE_TRANSLATION_CATEGORIES = new Set<Category>(["tech", "finance"]);

export async function preprocessItemsForDisplay(
  category: Category,
  items: HotspotItem[],
  translate: Translator
): Promise<HotspotItem[]> {
  return Promise.all(
    items.map(async (item) => ({
      ...item,
      title: TITLE_TRANSLATION_CATEGORIES.has(category)
        ? await translate(item.title)
        : item.title,
      summary: await translate(item.summary),
    }))
  );
}
