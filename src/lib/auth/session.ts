import "server-only";

import { and, eq, isNull } from "drizzle-orm";

import type { AuthSessionUser } from "@/lib/auth/_types/session";
import { isUserRole, type UserRole } from "@/lib/auth/_types/user-role";
import { auth } from "@/lib/auth/better-auth";
import { getDb } from "@/lib/db/client";
import { user } from "@/lib/db/schema";

/**
 * Resolve the active actor from Better Auth session cookies.
 * Re-checks is_active + soft-delete from DB (ADR-036).
 */
export async function requireAuthSession(headers: Headers): Promise<AuthSessionUser> {
  const session = await auth.api.getSession({ headers });

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const [row] = await getDb()
    .select({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      deletedAt: user.deletedAt,
    })
    .from(user)
    .where(and(eq(user.id, session.user.id), isNull(user.deletedAt)))
    .limit(1);

  if (!row || !row.isActive) {
    throw new Error("Unauthorized");
  }

  if (!isUserRole(row.role)) {
    throw new Error("Unauthorized");
  }

  return {
    email: row.email,
    id: row.id,
    name: row.name,
    role: row.role,
    userId: row.id,
  };
}

export const requireAuthActor = requireAuthSession;
export const requireSessionUser = requireAuthSession;

export function requireRole(actor: AuthSessionUser, allowedRoles: readonly UserRole[]): void {
  if (!allowedRoles.includes(actor.role)) {
    throw new Error("Forbidden");
  }
}

export function requireAnyRole(
  actor: AuthSessionUser,
  allowedRoles: readonly UserRole[],
): AuthSessionUser {
  requireRole(actor, allowedRoles);
  return actor;
}
