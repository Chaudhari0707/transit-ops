import "server-only";

import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";

import { getDb } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";

function getTrustedOrigins(): string[] {
  const raw = Bun.env.BETTER_AUTH_TRUSTED_ORIGINS ?? Bun.env.BETTER_AUTH_URL ?? "";

  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

/**
 * Minimal Better Auth server for session + email/password.
 * Full login UX / rate-limit polish remains ODO-20.
 */
export const auth = betterAuth({
  baseURL: Bun.env.BETTER_AUTH_URL,
  secret: Bun.env.BETTER_AUTH_SECRET,
  trustedOrigins: getTrustedOrigins(),
  database: drizzleAdapter(getDb(), {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    // Match seed scripts (`Bun.password` / argon2id) so admin@example.com can sign in.
    password: {
      hash: (password) =>
        Bun.password.hash(password, {
          algorithm: "argon2id",
          memoryCost: 65536,
          timeCost: 3,
        }),
      verify: ({ password, hash }) => Bun.password.verify(password, hash),
    },
  },
  user: {
    additionalFields: {
      role: {
        type: [
          "fleet_manager",
          "dispatcher",
          "safety_officer",
          "financial_analyst",
        ] as const,
        required: true,
        input: false,
      },
      phoneNumber: {
        type: "string",
        required: false,
        input: false,
      },
      isActive: {
        type: "boolean",
        required: true,
        defaultValue: true,
        input: false,
      },
      deletedAt: {
        type: "date",
        required: false,
        input: false,
      },
      createdByUserId: {
        type: "string",
        required: false,
        input: false,
      },
    },
  },
});
