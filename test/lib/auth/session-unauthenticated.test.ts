import { beforeAll, describe, expect, mock, test } from "bun:test";

import { loadTestEnvFiles } from "../../support/load-env";

await loadTestEnvFiles();

mock.module("server-only", () => ({}));

const databaseUrl = Bun.env.DATABASE_URL?.trim();
const describeWithEnv =
  Bun.env.BETTER_AUTH_SECRET?.trim() && Bun.env.BETTER_AUTH_URL?.trim() ? describe : describe.skip;

let requireAuthSession: (headers: Headers) => Promise<unknown>;

beforeAll(async () => {
  ({ requireAuthSession } = await import("@/lib/auth/session"));
});

/**
 * Failure-first: domain APIs must reject requests without a Better Auth session.
 * When BA env is missing, suite is skipped (same pattern as sign-in-api integration).
 */
describeWithEnv("requireAuthSession unauthenticated failure modes", () => {
  test("rejects empty headers (no session cookie)", async () => {
    await expect(requireAuthSession(new Headers())).rejects.toThrow("Unauthorized");
  });

  test("rejects unrelated cookies that are not Better Auth session", async () => {
    const headers = new Headers({
      cookie: "session=userId.fake-token; other=1",
    });
    await expect(requireAuthSession(headers)).rejects.toThrow("Unauthorized");
  });

  test("rejects forged better-auth session token without valid store entry", async () => {
    const headers = new Headers({
      cookie: "better-auth.session_token=forged.invalid.token",
    });
    await expect(requireAuthSession(headers)).rejects.toThrow("Unauthorized");
  });
});

// Silence unused when skipped without DB — document intent
void databaseUrl;
