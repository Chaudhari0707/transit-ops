import { getDb } from "@/lib/db/client";
import { isSignInInputEmpty, normalizeIdentifier } from "@/modules/auth/_lib/identifiers";
import type { AuthModel } from "@/modules/auth/_types/auth";

export abstract class Auth {
  static async signIn({ username, password }: AuthModel["signInBody"]) {
    if (isSignInInputEmpty(username, password)) {
      return null;
    }

    const identifier = normalizeIdentifier(username);
    const normalizedPassword = password.trim();

    const adminUser = await getDb().query.adminUsers.findFirst({
      where: (table, { eq, or }) => or(eq(table.username, identifier), eq(table.email, identifier)),
    });

    if (!adminUser?.isActive) {
      return null;
    }

    const passwordMatches = await Bun.password.verify(normalizedPassword, adminUser.passwordHash);

    if (!passwordMatches) {
      return null;
    }

    return {
      username: adminUser.username,
      token: `${adminUser.id}.${crypto.randomUUID()}`,
    };
  }
}
