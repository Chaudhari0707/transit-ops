/**
 * Domain session helpers for Elysia modules.
 * Delegates to monish Better Auth session — no parallel cookie auth.
 */
import type { SessionUser } from "@/lib/api/_types/session";
import { requireAnyRole, requireRole } from "@/lib/auth/_lib/require-role";
import { requireAuthSession } from "@/lib/auth/session";

export async function requireUser(headers: Headers): Promise<SessionUser> {
  return requireAuthSession(headers);
}

export { requireAnyRole, requireRole };
