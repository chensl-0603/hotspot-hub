export type UserRole = "USER" | "ADMIN";

export interface AdminIdentity {
  githubId?: string | null;
  email?: string | null;
}

export interface AdminAllowList {
  githubIds?: string | null;
  emails?: string | null;
}

export interface AdminSession {
  user: {
    id: string;
    role: "ADMIN";
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

function splitList(value?: string | null) {
  return (value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function isAdminIdentity(identity: AdminIdentity, allowList: AdminAllowList = {}) {
  const githubId = identity.githubId?.trim();
  const email = identity.email?.trim().toLowerCase();
  const githubIds = splitList(allowList.githubIds ?? process.env.ADMIN_GITHUB_IDS);
  const emails = splitList(allowList.emails ?? process.env.ADMIN_EMAILS).map((entry) => entry.toLowerCase());

  return Boolean((githubId && githubIds.includes(githubId)) || (email && emails.includes(email)));
}

export async function requireAdminSession(): Promise<AdminSession> {
  const [{ redirect }, { auth }] = await Promise.all([import("next/navigation"), import("@/auth")]);
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/admin");
    throw new Error("Authentication required");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/403");
    throw new Error("Admin role required");
  }
  return session as AdminSession;
}
