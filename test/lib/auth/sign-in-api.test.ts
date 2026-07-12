import { afterAll, beforeAll, describe, expect, test } from "bun:test";

import postgres from "postgres";

import {
  buildTestAuthUser,
  deleteTestAuthUser,
  TEST_AUTH_PASSWORD,
  upsertTestAuthUser,
} from "../../support/auth-fixtures";
import { loadTestEnvFiles } from "../../support/load-env";
import { postSignInEmail } from "../../support/sign-in-request";

await loadTestEnvFiles();

const databaseUrl = Bun.env.DATABASE_URL?.trim();
const adminEmail = Bun.env.AUTH_ADMIN_EMAIL?.trim() ?? "admin@example.com";
const adminPassword = Bun.env.AUTH_ADMIN_PASSWORD?.trim() ?? "password";
const describeWithDatabase = databaseUrl ? describe : describe.skip;

const fixtureEmails = {
  dispatcher: "signin-dispatcher@test.local",
  inactive: "signin-inactive@test.local",
  deleted: "signin-deleted@test.local",
  rateLimit: "signin-ratelimit@test.local",
} as const;

function hasActiveSessionCookie(setCookie: string | null) {
  if (!setCookie) {
    return false;
  }

  return /better-auth\.session_token=[^;]+/.test(setCookie) && !setCookie.includes("Max-Age=0");
}

describeWithDatabase("sign-in API integration", () => {
  let sql: ReturnType<typeof postgres>;

  beforeAll(async () => {
    sql = postgres(databaseUrl!, { max: 1, prepare: false });

    // Ensure seeded admin credentials match env — shared Neon can drift from other branches/seeds.
    await upsertTestAuthUser(
      sql,
      buildTestAuthUser({
        email: adminEmail,
        fullName: "Project Admin",
        password: adminPassword,
        phoneNumber: "0000000000",
        role: "fleet_manager",
      }),
    );

    await upsertTestAuthUser(
      sql,
      buildTestAuthUser({
        email: fixtureEmails.dispatcher,
        role: "dispatcher",
      }),
    );

    await upsertTestAuthUser(
      sql,
      buildTestAuthUser({
        email: fixtureEmails.inactive,
        role: "financial_analyst",
        isActive: false,
      }),
    );

    await upsertTestAuthUser(
      sql,
      buildTestAuthUser({
        email: fixtureEmails.deleted,
        role: "safety_officer",
        deletedAt: new Date("2026-07-12T00:00:00.000Z"),
      }),
    );
  }, 60_000);

  afterAll(async () => {
    // Best-effort cleanup — do not fail the suite on shared Neon lag.
    await Promise.allSettled([
      deleteTestAuthUser(sql, fixtureEmails.dispatcher),
      deleteTestAuthUser(sql, fixtureEmails.inactive),
      deleteTestAuthUser(sql, fixtureEmails.deleted),
      deleteTestAuthUser(sql, fixtureEmails.rateLimit),
    ]);
    await sql.end({ timeout: 5 }).catch(() => undefined);
  }, 120_000);

  test("accepts valid admin credentials with matching role", async () => {
    const response = await postSignInEmail({
      email: adminEmail,
      forwardedFor: "10.0.0.11",
      password: adminPassword,
      role: "fleet_manager",
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      user: {
        email: adminEmail,
        role: "fleet_manager",
      },
    });
    expect(hasActiveSessionCookie(response.setCookie)).toBe(true);
  });

  test("rejects valid password when selected role does not match", async () => {
    const response = await postSignInEmail({
      email: adminEmail,
      forwardedFor: "10.0.0.12",
      password: adminPassword,
      role: "dispatcher",
    });

    expect(response.status).toBe(401);
    // Role mismatch is normalized to a credentials-style failure (no role leak).
    expect(String((response.body as { message?: string }).message ?? "")).toMatch(
      /invalid (email|username) or password/i,
    );
    expect(hasActiveSessionCookie(response.setCookie)).toBe(false);
  });

  test("rejects unknown email", async () => {
    const response = await postSignInEmail({
      email: "missing-user@test.local",
      forwardedFor: "10.0.0.13",
      password: adminPassword,
      role: "fleet_manager",
    });

    expect(response.status).toBe(401);
  });

  test("rejects wrong password", async () => {
    const response = await postSignInEmail({
      email: adminEmail,
      forwardedFor: "10.0.0.14",
      password: "definitely-wrong-password",
      role: "fleet_manager",
    });

    expect(response.status).toBe(401);
  });

  test("rejects missing role header after credential verification", async () => {
    const response = await postSignInEmail({
      email: fixtureEmails.dispatcher,
      forwardedFor: "10.0.0.15",
      password: TEST_AUTH_PASSWORD,
    });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      message: "Invalid username or password",
    });
    expect(hasActiveSessionCookie(response.setCookie)).toBe(false);
  });

  test("rejects invalid role header value", async () => {
    const response = await postSignInEmail({
      email: fixtureEmails.dispatcher,
      forwardedFor: "10.0.0.16",
      password: TEST_AUTH_PASSWORD,
      role: "super_admin",
    });

    expect(response.status).toBe(400);
  });

  test("rejects inactive users", async () => {
    const response = await postSignInEmail({
      email: fixtureEmails.inactive,
      forwardedFor: "10.0.0.17",
      password: TEST_AUTH_PASSWORD,
      role: "financial_analyst",
    });

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      message: "Invalid username or password",
    });
    expect(hasActiveSessionCookie(response.setCookie)).toBe(false);
  });

  test("rejects soft-deleted users", async () => {
    const response = await postSignInEmail({
      email: fixtureEmails.deleted,
      forwardedFor: "10.0.0.18",
      password: TEST_AUTH_PASSWORD,
      role: "safety_officer",
    });

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      message: "Invalid username or password",
    });
    expect(hasActiveSessionCookie(response.setCookie)).toBe(false);
  });

  test("accepts non-admin users when role matches", async () => {
    const response = await postSignInEmail({
      email: fixtureEmails.dispatcher,
      forwardedFor: "10.0.0.19",
      password: TEST_AUTH_PASSWORD,
      role: "dispatcher",
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      user: {
        email: fixtureEmails.dispatcher,
        role: "dispatcher",
      },
    });
  });
});

describeWithDatabase.serial("sign-in API rate limiting", () => {
  let sql: ReturnType<typeof postgres>;

  beforeAll(async () => {
    sql = postgres(databaseUrl!, { max: 1, prepare: false });
  }, 60_000);

  afterAll(async () => {
    await deleteTestAuthUser(sql, fixtureEmails.rateLimit);
    await sql.end();
  }, 60_000);

  test("locks out repeated failed password attempts", async () => {
    const rateLimitIp = "10.255.0.99";

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await postSignInEmail({
        email: fixtureEmails.rateLimit,
        forwardedFor: rateLimitIp,
        password: `wrong-password-${attempt}`,
        role: "fleet_manager",
      });

      expect(response.status).toBe(401);
    }

    const lockedResponse = await postSignInEmail({
      email: fixtureEmails.rateLimit,
      forwardedFor: rateLimitIp,
      password: "wrong-password-final",
      role: "fleet_manager",
    });

    expect(lockedResponse.status).toBe(429);
  });
});
