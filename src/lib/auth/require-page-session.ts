import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import type { PageSession } from "@/lib/auth/_types/page-session";
import { isUserRole } from "@/lib/auth/_types/user-role";
import { auth } from "@/lib/auth/better-auth";

/**
 * Server Components: require a valid Better Auth session + app role.
 * On failure redirects to `/sign-in?next=…` so the app shell never renders unauthenticated.
 */
export async function requirePageSession(nextPath: string): Promise<PageSession> {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = session?.user && "role" in session.user ? session.user.role : null;

  if (!session?.user?.id || !isUserRole(role)) {
    redirect(`/sign-in?next=${encodeURIComponent(nextPath)}`);
  }

  return {
    email: session.user.email,
    name: session.user.name?.trim() || session.user.email,
    role,
    userId: session.user.id,
  };
}
