import { NextRequest, NextResponse } from "next/server";
import { Category } from "@/lib/types";
import { fetchCategory } from "@/lib/cache";

const CATEGORIES: Category[] = ["github", "tech", "finance", "politics"];

export async function GET(request: NextRequest) {
  const cat = request.nextUrl.searchParams.get("category") as Category | null;

  if (cat && CATEGORIES.includes(cat)) {
    const data = await fetchCategory(cat);
    return NextResponse.json(data);
  }

  const { fetchAllCategories } = await import("@/lib/cache");
  const results = await fetchAllCategories();
  return NextResponse.json({
    categories: results,
    updatedAt: new Date().toISOString(),
  });
}