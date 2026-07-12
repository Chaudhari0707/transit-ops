import { FORBIDDEN_MESSAGE } from "@/lib/api/http-errors";
import type { AuthSessionUser } from "@/lib/auth/_types/session";
import type { UserRole } from "@/lib/auth/_types/user-role";

export function requireRole(actor: AuthSessionUser, allowedRoles: readonly UserRole[]): void {
  if (!allowedRoles.includes(actor.role)) {
    throw new Error(FORBIDDEN_MESSAGE);
  }
}

export function requireAnyRole(
  actor: AuthSessionUser,
  allowedRoles: readonly UserRole[],
): AuthSessionUser {
  requireRole(actor, allowedRoles);
  return actor;
}
