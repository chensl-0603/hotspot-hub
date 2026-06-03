import Link from "next/link";
import { redirect } from "next/navigation";
import FluidBackground from "@/components/ui/FluidBackground";
import { auth, signIn } from "@/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const callbackUrl = params?.callbackUrl?.startsWith("/") ? params.callbackUrl : "/";

  if (session?.user) redirect(callbackUrl);

  return (
    <>
      <FluidBackground />
      <main className="relative z-10 min-h-screen grid place-items-center px-6">
        <section className="w-full max-w-[420px] rounded-[8px] border border-white/10 bg-black/25 p-7 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <Link
            href="/"
            className="text-[11px] font-mono uppercase tracking-widest text-white/35 hover:text-white/75 transition-colors"
          >
            ← 返回首页
          </Link>
          <h1 className="mt-8 text-3xl font-semibold tracking-[-0.02em] text-white">登录 Hotspot Hub</h1>
          <p className="mt-3 text-sm leading-relaxed text-white/45">
            使用 GitHub 账号继续访问频道页、AI 摘要和个人可见内容。管理员账号会自动看到后台入口。
          </p>
          <form
            className="mt-7"
            action={async () => {
              "use server";
              await signIn("github", { redirectTo: callbackUrl });
            }}
          >
            <button className="w-full rounded-full border border-white/15 bg-white text-black px-4 py-3 text-sm font-semibold hover:bg-white/85 transition-colors">
              使用 GitHub 登录
            </button>
          </form>
        </section>
      </main>
    </>
  );
}
