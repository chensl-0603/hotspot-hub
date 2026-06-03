import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { isAdminIdentity } from "@/lib/admin-auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [GitHub],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "database",
  },
  events: {
    async linkAccount({ user, account }) {
      if (account.provider !== "github") return;
      if (!isAdminIdentity({ githubId: account.providerAccountId, email: user.email })) return;

      await prisma.user.update({
        where: { id: user.id },
        data: { role: "ADMIN" },
      });
    },
  },
  callbacks: {
    async signIn() {
      return true;
    },
    async session({ session, user }) {
      session.user.id = user.id;
      session.user.role = user.role || "USER";
      return session;
    },
  },
});
