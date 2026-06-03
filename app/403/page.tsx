import Link from "next/link";
import FluidBackground from "@/components/ui/FluidBackground";

export default function ForbiddenPage() {
  return (
    <>
      <FluidBackground />
      <main className="relative z-10 min-h-screen grid place-items-center px-6">
        <section className="w-full max-w-[420px] rounded-[8px] border border-white/10 bg-black/25 p-7 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-white/35">403</span>
          <h1 className="mt-5 text-3xl font-semibold tracking-[-0.02em] text-white">没有后台权限</h1>
          <p className="mt-3 text-sm leading-relaxed text-white/45">
            当前 GitHub 账号已登录，但不是管理员。管理员权限由数据库角色和白名单同步控制。
          </p>
          <Link
            href="/"
            className="mt-7 inline-flex rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-sm text-white/75 hover:bg-white/[0.1] hover:text-white transition-colors"
          >
            返回首页
          </Link>
        </section>
      </main>
    </>
  );
}
