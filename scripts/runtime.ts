import { Config, Console, Effect } from "effect";
import postgres from "postgres";

const PASSWORD_HASH_OPTIONS = {
  algorithm: "argon2id",
  memoryCost: 65536,
  timeCost: 3,
} as const;

const DEFAULT_ADMIN = {
  email: "admin@example.com",
  fullName: "Project Admin",
  password: "ChangeMe123!",
  phoneNumber: "0000000000",
  username: "admin",
} as const;

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }

  return fallbackMessage;
}

function requireNonEmpty(value: string, name: string): string {
  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    throw new Error(`${name} cannot be empty.`);
  }

  return trimmedValue;
}

function normalizeUsername(value: string): string {
  const normalizedValue = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64);

  return normalizedValue.length > 0 ? normalizedValue : DEFAULT_ADMIN.username;
}

function buildAdminUser(
  email: string,
  password: string,
  fullName: string,
  phoneNumber: string,
  preferredUsername: string,
) {
  const fallbackUsername = email.split("@")[0] ?? DEFAULT_ADMIN.username;

  return {
    email,
    fullName,
    password,
    phoneNumber,
    username: normalizeUsername(
      preferredUsername.length > 0 ? preferredUsername : fallbackUsername,
    ),
  };
}

export const configuredAdminUser = Effect.gen(function* () {
  const email = requireNonEmpty(yield* Config.string("AUTH_ADMIN_EMAIL"), "AUTH_ADMIN_EMAIL");
  const password = requireNonEmpty(
    yield* Config.string("AUTH_ADMIN_PASSWORD"),
    "AUTH_ADMIN_PASSWORD",
  );
  const fullName = requireNonEmpty(
    yield* Config.string("AUTH_ADMIN_NAME").pipe(Config.withDefault(DEFAULT_ADMIN.fullName)),
    "AUTH_ADMIN_NAME",
  );
  const phoneNumber = requireNonEmpty(
    yield* Config.string("AUTH_ADMIN_PHONE_NUMBER").pipe(
      Config.withDefault(DEFAULT_ADMIN.phoneNumber),
    ),
    "AUTH_ADMIN_PHONE_NUMBER",
  );
  const preferredUsername = (yield* Config.string("AUTH_ADMIN_USERNAME").pipe(
    Config.withDefault(""),
  )).trim();

  return buildAdminUser(email, password, fullName, phoneNumber, preferredUsername);
});

export const seedAdminUser = Effect.gen(function* () {
  const email = requireNonEmpty(
    yield* Config.string("AUTH_ADMIN_EMAIL").pipe(Config.withDefault(DEFAULT_ADMIN.email)),
    "AUTH_ADMIN_EMAIL",
  );
  const password = requireNonEmpty(
    yield* Config.string("AUTH_ADMIN_PASSWORD").pipe(Config.withDefault(DEFAULT_ADMIN.password)),
    "AUTH_ADMIN_PASSWORD",
  );
  const fullName = requireNonEmpty(
    yield* Config.string("AUTH_ADMIN_NAME").pipe(Config.withDefault(DEFAULT_ADMIN.fullName)),
    "AUTH_ADMIN_NAME",
  );
  const phoneNumber = requireNonEmpty(
    yield* Config.string("AUTH_ADMIN_PHONE_NUMBER").pipe(
      Config.withDefault(DEFAULT_ADMIN.phoneNumber),
    ),
    "AUTH_ADMIN_PHONE_NUMBER",
  );
  const preferredUsername = (yield* Config.string("AUTH_ADMIN_USERNAME").pipe(
    Config.withDefault(DEFAULT_ADMIN.username),
  )).trim();

  return buildAdminUser(email, password, fullName, phoneNumber, preferredUsername);
});

export function databaseNameFromUrl(databaseUrl: string): string {
  return databaseUrl.split("/").at(-1)?.split("?")[0] ?? "database";
}

export function maskDatabaseUrl(databaseUrl: string): string {
  return databaseUrl.replace(/:[^:@]*@/, ":****@");
}

export function hashPassword(plainTextPassword: string) {
  return Effect.tryPromise({
    try: () => Bun.password.hash(plainTextPassword, PASSWORD_HASH_OPTIONS),
    catch: (error) => new Error(getErrorMessage(error, "Failed to hash password.")),
  });
}

export function promptForInput(promptText: string) {
  return Effect.tryPromise({
    try: async () => {
      await Bun.write(Bun.stdout, promptText);
      const iterator = console[Symbol.asyncIterator]();
      const result = await iterator.next();
      await iterator.return?.();
      return typeof result.value === "string" ? result.value.trim() : "";
    },
    catch: (error) => new Error(getErrorMessage(error, "Failed to read terminal input.")),
  });
}

export function withDatabase<A, E>(
  execute: (sql: ReturnType<typeof postgres>, databaseUrl: string) => Effect.Effect<A, E, never>,
) {
  return Effect.scoped(
    Effect.gen(function* () {
      const databaseUrl = requireNonEmpty(yield* Config.string("DATABASE_URL"), "DATABASE_URL");

      const sql = yield* Effect.acquireRelease(
        Effect.sync(() => postgres(databaseUrl, { max: 1, prepare: false })),
        (client) =>
          Effect.tryPromise({
            try: () => client.end(),
            catch: (error) =>
              new Error(getErrorMessage(error, "Failed to close the database connection.")),
          }).pipe(Effect.orDie),
      );

      return yield* execute(sql, databaseUrl);
    }),
  );
}

/**
 * Upsert a fleet_manager into Better Auth `user` + credential `account`.
 * Transitional until Better Auth seed helpers own bootstrap accounts.
 */
export function upsertAdminUser(
  sql: ReturnType<typeof postgres>,
  adminUser: Awaited<
    typeof seedAdminUser extends Effect.Effect<infer A, unknown, unknown> ? Promise<A> : never
  >,
) {
  return Effect.gen(function* () {
    const passwordHash = yield* hashPassword(adminUser.password);
    const userId = crypto.randomUUID();
    const accountId = crypto.randomUUID();

    const [result] = yield* Effect.tryPromise({
      try: () =>
        sql.begin(async (tx) => {
          const [upsertedUser] = await tx<{ id: string; email: string; name: string }[]>`
            INSERT INTO "user" (
              id, name, email, email_verified, role, phone_number, is_active, created_at, updated_at
            )
            VALUES (
              ${userId},
              ${adminUser.fullName},
              ${adminUser.email},
              TRUE,
              'fleet_manager',
              ${adminUser.phoneNumber},
              TRUE,
              NOW(),
              NOW()
            )
            ON CONFLICT (email) DO UPDATE
              SET
                name = EXCLUDED.name,
                phone_number = EXCLUDED.phone_number,
                is_active = TRUE,
                deleted_at = NULL,
                updated_at = NOW()
            RETURNING id, email, name
          `;

          if (!upsertedUser) {
            throw new Error("Admin user upsert did not return a record.");
          }

          await tx`
            INSERT INTO account (
              id, user_id, account_id, provider_id, password, created_at, updated_at
            )
            VALUES (
              ${accountId},
              ${upsertedUser.id},
              ${upsertedUser.id},
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
            WHERE user_id = ${upsertedUser.id}
              AND provider_id = 'credential'
          `;

          return [
            {
              id: upsertedUser.id,
              email: upsertedUser.email,
              username: adminUser.username,
            },
          ];
        }),
      catch: (error) => new Error(getErrorMessage(error, "Failed to upsert the admin user.")),
    });

    if (!result) {
      yield* Effect.fail(new Error("Admin upsert did not return a record."));
    }

    return result;
  });
}

export function deleteAdminUser(sql: ReturnType<typeof postgres>, adminEmail: string) {
  return Effect.tryPromise({
    try: () =>
      sql<{ id: string; email: string }[]>`
        DELETE FROM "user"
        WHERE email = ${adminEmail}
        RETURNING id, email
      `,
    catch: (error) => new Error(getErrorMessage(error, "Failed to remove the admin user.")),
  }).pipe(Effect.map((rows) => rows[0] ?? null));
}

export async function runScript(
  program: Effect.Effect<unknown, unknown, never>,
  failurePrefix: string,
): Promise<void> {
  try {
    await Effect.runPromise(program);
  } catch (error) {
    console.error(failurePrefix, getErrorMessage(error, "Unknown script failure."));
    throw error instanceof Error ? error : new Error("Unknown script failure.");
  }
}

export { Console, Effect };
