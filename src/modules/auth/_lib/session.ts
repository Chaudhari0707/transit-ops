import { and, eq, sql } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { user } from "@/lib/db/schema";
import type { AppSessionUser } from "@/modules/auth/_types/session";

function parseSessionUserId(cookieHeader: string | null): string | null {
  if (!cookieHeader) {
    return null;
  }

  const match = cookieHeader.match(/(?:^|;\s*)session=([^;]+)/);

  if (!match?.[1]) {
    return null;
  }

  try {
    const token = decodeURIComponent(match[1]);
    const userId = token.split(".")[0]?.trim();
    return userId && userId.length > 0 ? userId : null;
  } catch {
    return null;
  }
}

/**
 * Resolves the active app user from the transitional `session` cookie
 * (`userId.randomUuid`) set by the auth sign-in module.
 * Replace with Better Auth `auth.api.getSession` once ODO-20 lands.
 */
export async function requireSessionUser(headers: Headers): Promise<AppSessionUser> {
  const userId = parseSessionUserId(headers.get("cookie"));

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const [matched] = await getDb()
    .select({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    })
    .from(user)
    .where(and(eq(user.id, userId), eq(user.isActive, true), sql`${user.deletedAt} is null`))
    .limit(1);

  if (!matched) {
    throw new Error("Unauthorized");
  }

  return matched;
}

export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }

  return fallback;
}

/** Map service error messages to HTTP status codes (api-standards §2). */
export function resolveErrorCode(message: string): number {
  const normalized = message.trim().toLowerCase();

  if (normalized === "unauthorized") {
    return 401;
  }

  if (normalized === "forbidden") {
    return 403;
  }

  if (normalized.endsWith("not found")) {
    return 404;
  }

  if (normalized.startsWith("conflict") || normalized.includes("already has an open")) {
    return 409;
  }

  if (normalized.includes("too many requests")) {
    return 429;
  }

  return 400;
}
