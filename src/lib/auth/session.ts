import "server-only";

import { and, eq, isNull } from "drizzle-orm";

import { auth } from "@/lib/auth/better-auth";
import { getDb } from "@/lib/db/client";
import { user } from "@/lib/db/schema";
import type { UserRole } from "@/lib/auth/_types/roles";

export type AuthActor = {
  userId: string;
  role: UserRole;
  email: string;
};

const ROLES = new Set<UserRole>([
  "fleet_manager",
  "dispatcher",
  "safety_officer",
  "financial_analyst",
]);

function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && ROLES.has(value as UserRole);
}

/**
 * Resolve the active actor from Better Auth session cookies.
 * Re-checks is_active + soft-delete from DB (ADR-036).
 */
export async function requireAuthActor(headers: Headers): Promise<AuthActor> {
  const session = await auth.api.getSession({ headers });

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const [row] = await getDb()
    .select({
      id: user.id,
      email: user.email,
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
    userId: row.id,
    role: row.role,
    email: row.email,
  };
}
