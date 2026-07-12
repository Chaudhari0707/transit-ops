import { and, eq, or, sql } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { account, user } from "@/lib/db/schema";
import { isSignInInputEmpty, normalizeIdentifier } from "@/modules/auth/_lib/identifiers";
import type { AuthModel } from "@/modules/auth/_types/auth";

/**
 * Transitional email/password sign-in against Better Auth tables (`user` + `account`).
 * Will be replaced by Better Auth handlers once `src/lib/auth/better-auth.ts` is wired.
 */
export abstract class Auth {
  static async signIn({ username, password }: AuthModel["signInBody"]) {
    if (isSignInInputEmpty(username, password)) {
      return null;
    }

    const identifier = normalizeIdentifier(username);
    const normalizedPassword = password.trim();

    const [matchedUser] = await getDb()
      .select()
      .from(user)
      .where(
        and(
          or(eq(user.email, identifier), sql`lower(${user.name}) = ${identifier}`),
          eq(user.isActive, true),
          sql`${user.deletedAt} is null`,
        ),
      )
      .limit(1);

    if (!matchedUser) {
      return null;
    }

    const [credential] = await getDb()
      .select()
      .from(account)
      .where(and(eq(account.userId, matchedUser.id), eq(account.providerId, "credential")))
      .limit(1);

    if (!credential?.password) {
      return null;
    }

    const passwordMatches = await Bun.password.verify(normalizedPassword, credential.password);

    if (!passwordMatches) {
      return null;
    }

    return {
      username: matchedUser.email,
      token: `${matchedUser.id}.${crypto.randomUUID()}`,
    };
  }
}
