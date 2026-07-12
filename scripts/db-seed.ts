import {
  Console,
  Effect,
  runScript,
  seedAdminUser,
  upsertAdminUser,
  withDatabase,
} from "./runtime";

const MASTER_SEEDS = {
  expense_categories: [
    { code: "TOLL", name: "Toll" },
    { code: "FINE", name: "Fine" },
    { code: "MISC", name: "Miscellaneous" },
  ],
  license_categories: [
    { code: "LMV", name: "Light Motor Vehicle" },
    { code: "HMV", name: "Heavy Motor Vehicle" },
  ],
  maintenance_types: [
    { code: "OIL_CHANGE", name: "Oil Change" },
    { code: "TYRE", name: "Tyre Service" },
    { code: "GENERAL", name: "General Service" },
  ],
  vehicle_types: [
    { code: "VAN", name: "Van" },
    { code: "TRUCK", name: "Truck" },
  ],
} as const;

const program = Effect.gen(function* () {
  const adminUser = yield* seedAdminUser;

  yield* Console.log("🌱  Starting database seed...\n");

  yield* withDatabase((sql) =>
    Effect.gen(function* () {
      for (const [tableName, rows] of Object.entries(MASTER_SEEDS) as Array<
        [keyof typeof MASTER_SEEDS, ReadonlyArray<{ code: string; name: string }>]
      >) {
        for (const row of rows) {
          yield* Effect.tryPromise({
            try: () =>
              sql`
                INSERT INTO ${sql(tableName)} (id, code, name, is_active, created_at, updated_at)
                SELECT gen_random_uuid(), ${row.code}, ${row.name}, TRUE, NOW(), NOW()
                WHERE NOT EXISTS (
                  SELECT 1 FROM ${sql(tableName)} t
                  WHERE t.code = ${row.code} AND t.deleted_at IS NULL
                )
              `,
            catch: (error) =>
              new Error(
                error instanceof Error ? error.message : `Failed to seed ${tableName}.${row.code}.`,
              ),
          });
        }
        yield* Console.log(`   ✓ ${tableName} (${rows.length})`);
      }

      const result = yield* upsertAdminUser(sql, adminUser);
      yield* Console.log("\n✅  Fleet manager user seeded:");
      yield* Console.log(`      Email    : ${adminUser.email}`);
      yield* Console.log(`      Password : ${adminUser.password}`);
      yield* Console.log(`      Role     : fleet_manager`);
      yield* Console.log(`      Record ID: ${result.id}`);
    }),
  );

  yield* Console.log("\n⚠️   Masters + one fleet_manager only. Add sample fleet data as needed.\n");
});

await runScript(program, "❌  Seed failed:");
