import Link from "next/link";
import FluidBackground from "@/components/ui/FluidBackground";
import AdminRefreshButton from "@/components/AdminRefreshButton";
import { CATEGORY_ORDER } from "@/lib/categories";
import { fetchAllCategories } from "@/lib/cache";
import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await requireAdminSession();
  const [categories, databaseOk] = await Promise.all([
    fetchAllCategories(),
    prisma.$queryRaw`SELECT 1`
      .then(() => true)
      .catch(() => false),
  ]);

  const envChecks = [
    ["DATABASE_URL", Boolean(process.env.DATABASE_URL)],
    ["AUTH_SECRET", Boolean(process.env.AUTH_SECRET)],
    ["AUTH_GITHUB_ID", Boolean(process.env.AUTH_GITHUB_ID)],
    ["AUTH_GITHUB_SECRET", Boolean(process.env.AUTH_GITHUB_SECRET)],
    ["ADMIN_GITHUB_IDS / ADMIN_EMAILS", Boolean(process.env.ADMIN_GITHUB_IDS || process.env.ADMIN_EMAILS)],
  ] as const;

  return (
    <>
      <FluidBackground />
      <main className="relative z-10 min-h-screen px-6 py-8 md:px-12">
        <div className="mx-auto max-w-[1180px]">
          <nav className="flex items-center justify-between gap-4">
            <Link
              href="/"
              className="text-[11px] font-mono uppercase tracking-widest text-white/40 hover:text-white/80 transition-colors"
            >
              ← Index
            </Link>
            <span className="text-[11px] font-mono uppercase tracking-widest text-white/30">Admin Console</span>
          </nav>

          <header className="mt-12">
            <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-[oklch(0.82_0.14_165)]">
              系统状态
            </span>
            <h1 className="mt-4 text-[42px] font-semibold leading-none tracking-[-0.02em] text-white md:text-[60px]">
              Hotspot Hub 后台
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/45">
              当前第一版后台用于检查登录、环境配置、数据库连接与数据源状态，并允许管理员手动刷新热点缓存。
            </p>
          </header>

          <section className="mt-10 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <Panel title="管理员">
              <div className="space-y-3 text-sm text-white/55">
                <Row label="账号" value={session.user.name || session.user.email || session.user.id} />
                <Row label="邮箱" value={session.user.email || "未公开"} />
                <Row label="角色" value={session.user.role} />
              </div>
            </Panel>

            <Panel title="操作">
              <AdminRefreshButton />
            </Panel>
          </section>

          <section className="mt-5 grid gap-5 lg:grid-cols-2">
            <Panel title="环境配置">
              <div className="space-y-2">
                {envChecks.map(([name, ok]) => (
                  <StatusLine key={name} label={name} ok={ok} />
                ))}
                <StatusLine label="MySQL 连接" ok={databaseOk} />
              </div>
            </Panel>

            <Panel title="数据源">
              <div className="space-y-2">
                {CATEGORY_ORDER.map((category) => {
                  const data = categories.find((item) => item.category === category);
                  return (
                    <StatusLine
                      key={category}
                      label={`${category} · ${data?.items.length || 0} 条`}
                      ok={Boolean(data?.available)}
                      value={data?.updatedAt ? new Date(data.updatedAt).toLocaleString("zh-CN") : "未更新"}
                    />
                  );
                })}
              </div>
            </Panel>
          </section>
        </div>
      </main>
    </>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[8px] border border-white/10 bg-black/20 p-5 backdrop-blur-xl">
      <h2 className="mb-5 text-[11px] font-mono uppercase tracking-[0.2em] text-white/35">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-white/[0.06] pb-2">
      <span className="font-mono text-xs uppercase tracking-wider text-white/30">{label}</span>
      <span className="max-w-[70%] truncate text-right">{value}</span>
    </div>
  );
}

function StatusLine({ label, ok, value }: { label: string; ok: boolean; value?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded bg-white/[0.035] px-3 py-2 text-sm">
      <span className="truncate text-white/55">{label}</span>
      <span className="flex shrink-0 items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-white/35">
        <span className={ok ? "h-1.5 w-1.5 rounded-full bg-[oklch(0.82_0.14_165)]" : "h-1.5 w-1.5 rounded-full bg-[oklch(0.72_0.16_35)]"} />
        {value || (ok ? "OK" : "Missing")}
      </span>
    </div>
  );
}
