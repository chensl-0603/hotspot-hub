import Link from "next/link";
import { auth, signIn, signOut } from "@/auth";

export default async function AuthStatus() {
  const session = await auth();

  if (!session?.user) {
    return (
      <form
        action={async () => {
          "use server";
          await signIn("github", { redirectTo: "/" });
        }}
      >
        <button className="h-9 px-3 rounded-full border border-white/10 bg-white/[0.04] text-[11px] font-mono tracking-wider uppercase text-white/55 hover:text-white hover:bg-white/[0.08] transition-colors">
          GitHub 登录
        </button>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-2 py-1">
      {session.user.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={session.user.image}
          alt={session.user.name || "GitHub 用户"}
          width={28}
          height={28}
          referrerPolicy="no-referrer"
          className="h-7 w-7 rounded-full object-cover"
        />
      ) : (
        <span className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-[11px] font-mono text-white/60">
          {(session.user.name || session.user.email || "U").slice(0, 1).toUpperCase()}
        </span>
      )}
      <span className="hidden sm:block max-w-28 truncate text-[11px] font-mono text-white/45">
        {session.user.name || session.user.email || "已登录"}
      </span>
      {session.user.role === "ADMIN" && (
        <Link
          href="/admin"
          className="rounded-full px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-[oklch(0.82_0.14_165)] hover:bg-white/[0.06]"
        >
          后台
        </Link>
      )}
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
      >
        <button className="rounded-full px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-white/35 hover:text-white/70 hover:bg-white/[0.06]">
          退出
        </button>
      </form>
    </div>
  );
}
