import "@/lib/runtime/bun-env-polyfill";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/lib/db/schema";

const globalDatabase = globalThis as typeof globalThis & {
  __elysiaTemplateDb?: ReturnType<typeof drizzle<typeof schema>>;
  __elysiaTemplateSqlClient?: ReturnType<typeof postgres>;
};

function getDatabaseUrl() {
  const databaseUrl = Bun.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for the Elysia auth module.");
  }

  return databaseUrl;
}

function getSqlClient() {
  if (globalDatabase.__elysiaTemplateSqlClient) {
    return globalDatabase.__elysiaTemplateSqlClient;
  }

  const sqlClient = postgres(getDatabaseUrl(), {
    max: 1,
    prepare: false,
  });

  globalDatabase.__elysiaTemplateSqlClient = sqlClient;

  return sqlClient;
}

export function getDb() {
  if (globalDatabase.__elysiaTemplateDb) {
    return globalDatabase.__elysiaTemplateDb;
  }

  const database = drizzle(getSqlClient(), { schema });

  globalDatabase.__elysiaTemplateDb = database;

  return database;
}
