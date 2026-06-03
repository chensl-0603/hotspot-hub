import { auth } from "@/auth";
import { classifyProtectedPath } from "@/lib/route-policy";

export default auth((request) => {
  const access = classifyProtectedPath(request.nextUrl.pathname);
  if (access === "public") return;

  if (!request.auth?.user) {
    const loginUrl = new URL("/login", request.nextUrl);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname + request.nextUrl.search);
    return Response.redirect(loginUrl);
  }

  if (access === "admin" && request.auth.user.role !== "ADMIN") {
    return Response.redirect(new URL("/403", request.nextUrl));
  }
});

export const config = {
  matcher: [
    "/github",
    "/tech",
    "/finance",
    "/politics",
    "/item/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
  ],
};
