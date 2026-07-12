import "server-only";

import { and, eq, gt, sql } from "drizzle-orm";

import type { SessionUser } from "@/lib/api/_types/session";
import { getDb } from "@/lib/db/client";
import { session, user } from "@/lib/db/schema";
import type { UserRole } from "@/lib/db/schema/_types/roles";

const DEV_BYPASS_DISPATCHER_ROLE = "dispatcher" satisfies UserRole;

type SessionCookie = {
  value?: unknown;
};

function extractSessionToken(cookie: SessionCookie | undefined): string | null {
  if (typeof cookie?.value !== "string") {
    return null;
  }

  const token = cookie.value.trim();

  return token.length > 0 ? token : null;
}

function isDevAuthBypassEnabled(): boolean {
  return Bun.env.API_DEV_AUTH_BYPASS === "true" && Bun.env.NODE_ENV !== "production";
}

async function resolveDevBypassUser(): Promise<SessionUser> {
  const db = getDb();

  const [dispatcher] = await db
    .select({
      email: user.email,
      id: user.id,
      name: user.name,
      role: user.role,
    })
    .from(user)
    .where(
      and(
        eq(user.role, DEV_BYPASS_DISPATCHER_ROLE),
        eq(user.isActive, true),
        sql`${user.deletedAt} is null`,
      ),
    )
    .limit(1);

  if (dispatcher) {
    return dispatcher;
  }

  const adminEmail = (Bun.env.AUTH_ADMIN_EMAIL ?? "admin@example.com").trim();

  const [seededAdmin] = await db
    .select({
      email: user.email,
      id: user.id,
      name: user.name,
      role: user.role,
    })
    .from(user)
    .where(and(eq(user.email, adminEmail), eq(user.isActive, true), sql`${user.deletedAt} is null`))
    .limit(1);

  if (!seededAdmin) {
    throw new Error("Unauthorized");
  }

  return {
    ...seededAdmin,
    role: DEV_BYPASS_DISPATCHER_ROLE,
  };
}

async function resolveUserIdFromToken(token: string): Promise<string | null> {
  const [sessionRow] = await getDb()
    .select({ userId: session.userId })
    .from(session)
    .where(and(eq(session.token, token), gt(session.expiresAt, sql`now()`)))
    .limit(1);

  if (sessionRow) {
    return sessionRow.userId;
  }

  const transitionalUserId = token.split(".")[0]?.trim();

  return transitionalUserId && transitionalUserId.length > 0 ? transitionalUserId : null;
}

export async function requireUser(cookie: SessionCookie | undefined): Promise<SessionUser> {
  const token = extractSessionToken(cookie);

  if (!token) {
    if (isDevAuthBypassEnabled()) {
      return resolveDevBypassUser();
    }

    throw new Error("Unauthorized");
  }

  const userId = await resolveUserIdFromToken(token);

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const [matchedUser] = await getDb()
    .select({
      email: user.email,
      id: user.id,
      name: user.name,
      role: user.role,
    })
    .from(user)
    .where(and(eq(user.id, userId), eq(user.isActive, true), sql`${user.deletedAt} is null`))
    .limit(1);

  if (!matchedUser) {
    throw new Error("Unauthorized");
  }

  return matchedUser;
}

export function requireRole(actor: SessionUser, allowedRoles: readonly UserRole[]): void {
  if (!allowedRoles.includes(actor.role)) {
    throw new Error("Forbidden");
  }
}

export function requireAnyRole(actor: SessionUser, allowedRoles: readonly UserRole[]): SessionUser {
  requireRole(actor, allowedRoles);
  return actor;
}
