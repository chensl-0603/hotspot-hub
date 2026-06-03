export type RouteAccess = "public" | "user" | "admin";

const USER_ROUTES = new Set(["/github", "/tech", "/finance", "/politics"]);

export function classifyProtectedPath(pathname: string): RouteAccess {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return "admin";
  if (pathname === "/api/admin" || pathname.startsWith("/api/admin/")) return "admin";
  if (USER_ROUTES.has(pathname)) return "user";
  if (pathname.startsWith("/item/")) return "user";
  return "public";
}
