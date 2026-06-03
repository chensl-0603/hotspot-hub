import { requireAdminSession } from "@/lib/admin-auth";
import { refreshAllCategories } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function POST() {
  await requireAdminSession();
  const items = await refreshAllCategories();

  return Response.json({
    ok: true,
    refreshedAt: new Date().toISOString(),
    items: items.map((item) => ({
      category: item.category,
      available: item.available,
      count: item.items.length,
      error: item.error,
    })),
  });
}
