import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { isAdminIdentity } from "../lib/admin-auth.ts";
import { classifyProtectedPath } from "../lib/route-policy.ts";

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const schemaPath = new URL("../prisma/schema.prisma", import.meta.url);
const authSourcePath = new URL("../auth.ts", import.meta.url);
const proxySourcePath = new URL("../proxy.ts", import.meta.url);
const authRouteSourcePath = new URL("../app/api/auth/[...nextauth]/route.ts", import.meta.url);
const adminPageSourcePath = new URL("../app/admin/page.tsx", import.meta.url);
const refreshRouteSourcePath = new URL("../app/api/admin/refresh/route.ts", import.meta.url);
const homeSource = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const cacheSource = readFileSync(new URL("../lib/cache.ts", import.meta.url), "utf8");
const nextConfigSource = readFileSync(new URL("../next.config.ts", import.meta.url), "utf8");
const authStatusSource = readFileSync(new URL("../components/AuthStatus.tsx", import.meta.url), "utf8");

test("auth dependencies are declared", () => {
  assert.match(packageJson.dependencies["next-auth"], /beta/);
  assert.ok(packageJson.dependencies["@auth/prisma-adapter"]);
  assert.ok(packageJson.dependencies["@prisma/client"]);
  assert.ok(packageJson.dependencies["@prisma/adapter-mariadb"]);
  assert.ok(packageJson.dependencies.mariadb);
  assert.ok(packageJson.devDependencies.prisma);
});

test("prisma schema defines MySQL Auth.js tables with a user role", () => {
  assert.ok(existsSync(schemaPath));
  const schema = readFileSync(schemaPath, "utf8");

  assert.match(schema, /provider\s+=\s+"mysql"/);
  assert.match(schema, /model User/);
  assert.match(schema, /model Account/);
  assert.match(schema, /model Session/);
  assert.match(schema, /model VerificationToken/);
  assert.match(schema, /enum UserRole/);
  assert.match(schema, /role\s+UserRole\s+@default\(USER\)/);
});

test("admin identity matches configured GitHub ids and emails", () => {
  assert.equal(
    isAdminIdentity(
      { githubId: "12345", email: "reader@example.com" },
      { githubIds: "12345,67890", emails: "" }
    ),
    true
  );
  assert.equal(
    isAdminIdentity(
      { githubId: "nope", email: "Admin@Example.com" },
      { githubIds: "", emails: "admin@example.com" }
    ),
    true
  );
  assert.equal(
    isAdminIdentity(
      { githubId: "nope", email: "reader@example.com" },
      { githubIds: "12345", emails: "admin@example.com" }
    ),
    false
  );
});

test("route policy keeps home public and protects channels, details, and admin", () => {
  assert.equal(classifyProtectedPath("/"), "public");
  assert.equal(classifyProtectedPath("/api/weather"), "public");
  assert.equal(classifyProtectedPath("/api/auth/session"), "public");
  assert.equal(classifyProtectedPath("/tech"), "user");
  assert.equal(classifyProtectedPath("/github"), "user");
  assert.equal(classifyProtectedPath("/item/tech/story-1"), "user");
  assert.equal(classifyProtectedPath("/admin"), "admin");
  assert.equal(classifyProtectedPath("/api/admin/refresh"), "admin");
});

test("Auth.js is wired to GitHub, Prisma, database sessions, and admin role sessions", () => {
  assert.ok(existsSync(authSourcePath));
  assert.ok(existsSync(authRouteSourcePath));
  const authSource = readFileSync(authSourcePath, "utf8");
  const authRouteSource = readFileSync(authRouteSourcePath, "utf8");

  assert.match(authSource, /PrismaAdapter/);
  assert.match(authSource, /GitHub/);
  assert.match(authSource, /strategy:\s*"database"/);
  assert.match(authSource, /session\.user\.role/);
  assert.match(authSource, /events:\s*\{/);
  assert.match(authSource, /linkAccount/);
  assert.match(authSource, /isAdminIdentity/);
  assert.match(authRouteSource, /export const \{ GET, POST \} = handlers/);
});

test("sign in callback does not write the user table before Auth.js creates the user", () => {
  const authSource = readFileSync(authSourcePath, "utf8");
  const signInBlock = authSource.match(/async signIn\([\s\S]*?return true;\s*}/)?.[0] || "";

  assert.match(signInBlock, /return true/);
  assert.doesNotMatch(signInBlock, /prisma\.user\.update/);
});

test("proxy redirects unauthenticated users and non-admin users", () => {
  assert.ok(existsSync(proxySourcePath));
  const proxySource = readFileSync(proxySourcePath, "utf8");

  assert.match(proxySource, /classifyProtectedPath/);
  assert.match(proxySource, /\/login/);
  assert.match(proxySource, /\/403/);
  assert.match(proxySource, /role !== "ADMIN"/);
});

test("home page renders a compact auth status beside the weather badge", () => {
  assert.match(homeSource, /AuthStatus/);
  assert.match(homeSource, /WeatherBadgeClient/);
});

test("GitHub avatar images are allowed by Next image config", () => {
  assert.match(nextConfigSource, /remotePatterns/);
  assert.match(nextConfigSource, /avatars\.githubusercontent\.com/);
});

test("auth status renders GitHub avatars without the Next image optimizer", () => {
  assert.doesNotMatch(authStatusSource, /from "next\/image"/);
  assert.match(authStatusSource, /<img/);
  assert.match(authStatusSource, /referrerPolicy="no-referrer"/);
});

test("admin page and refresh endpoint require admin and expose manual refresh", () => {
  assert.ok(existsSync(adminPageSourcePath));
  assert.ok(existsSync(refreshRouteSourcePath));
  const adminPageSource = readFileSync(adminPageSourcePath, "utf8");
  const refreshRouteSource = readFileSync(refreshRouteSourcePath, "utf8");

  assert.match(adminPageSource, /requireAdminSession/);
  assert.match(adminPageSource, /系统状态/);
  assert.match(adminPageSource, /AdminRefreshButton/);
  assert.match(refreshRouteSource, /requireAdminSession/);
  assert.match(refreshRouteSource, /refreshAllCategories/);
});

test("cache layer exposes explicit refresh without changing normal fetch behavior", () => {
  assert.match(cacheSource, /export async function refreshCategory/);
  assert.match(cacheSource, /export async function refreshAllCategories/);
  assert.match(cacheSource, /forceRefresh/);
});
