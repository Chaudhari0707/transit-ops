import type { Sql } from "postgres";

import { hashPassword } from "@/lib/auth/password";

import type { TestAuthUser } from "./_types/auth-fixtures";

export const TEST_AUTH_PASSWORD = "TestPass123!" as const;

export function buildTestAuthUser(
  overrides: Partial<TestAuthUser> & Pick<TestAuthUser, "email">,
): TestAuthUser {
  return {
    fullName: "Sign-In Test User",
    password: TEST_AUTH_PASSWORD,
    phoneNumber: "9999999999",
    role: "dispatcher",
    isActive: true,
    deletedAt: null,
    ...overrides,
  };
}

export async function upsertTestAuthUser(sql: Sql, testUser: TestAuthUser) {
  const passwordHash = await hashPassword(testUser.password);
  const userId = crypto.randomUUID();
  const accountId = crypto.randomUUID();

  const [upsertedUser] = await sql.begin(async (tx) => {
    const users = await tx<{ id: string; email: string }[]>`
      INSERT INTO "user" (
        id, name, email, email_verified, role, phone_number, is_active, deleted_at, created_at, updated_at
      )
      VALUES (
        ${userId},
        ${testUser.fullName},
        ${testUser.email},
        TRUE,
        ${testUser.role},
        ${testUser.phoneNumber},
        ${testUser.isActive},
        ${testUser.deletedAt},
        NOW(),
        NOW()
      )
      ON CONFLICT (email) DO UPDATE
        SET
          name = EXCLUDED.name,
          role = EXCLUDED.role,
          phone_number = EXCLUDED.phone_number,
          is_active = EXCLUDED.is_active,
          deleted_at = EXCLUDED.deleted_at,
          updated_at = NOW()
      RETURNING id, email
    `;

    const upserted = users[0];

    if (!upserted) {
      throw new Error("Test user upsert did not return a record.");
    }

    await tx`
      INSERT INTO account (
        id, user_id, account_id, provider_id, password, created_at, updated_at
      )
      VALUES (
        ${accountId},
        ${upserted.id},
        ${upserted.id},
        'credential',
        ${passwordHash},
        NOW(),
        NOW()
      )
      ON CONFLICT DO NOTHING
    `;

    await tx`
      UPDATE account
      SET
        password = ${passwordHash},
        updated_at = NOW()
      WHERE user_id = ${upserted.id}
        AND provider_id = 'credential'
    `;

    return users;
  });

  if (!upsertedUser) {
    throw new Error("Test user upsert did not return a record.");
  }

  return upsertedUser;
}

export async function deleteTestAuthUser(sql: Sql, email: string) {
  await sql`
    DELETE FROM "user"
    WHERE email = ${email}
  `;
}
