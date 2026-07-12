import type { SqlClient } from "./_types/sql-client";
import {
  Console,
  Effect,
  runScript,
  seedAdminUser,
  upsertAdminUser,
  withDatabase,
} from "./runtime";
import { FLEET_DRIVER_SEEDS, FLEET_VEHICLE_SEEDS } from "./seed-fleet-data";
import { LOCATION_SEEDS } from "./seed-locations-data";

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

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }

  return fallbackMessage;
}

function lookupMasterId(
  sql: SqlClient,
  tableName: "vehicle_types" | "license_categories",
  code: string,
) {
  return Effect.tryPromise({
    try: async () => {
      const rows = await sql<{ id: string }[]>`
        SELECT id
        FROM ${sql(tableName)}
        WHERE code = ${code}
          AND deleted_at IS NULL
        LIMIT 1
      `;

      const row = rows[0];

      if (!row) {
        throw new Error(`Missing master row ${tableName}.${code}. Seed masters first.`);
      }

      return row.id;
    },
    catch: (error) => new Error(getErrorMessage(error, `Failed to resolve ${tableName}.${code}.`)),
  });
}

function seedFleetVehicles(sql: SqlClient, createdByUserId: string) {
  return Effect.gen(function* () {
    for (const vehicle of FLEET_VEHICLE_SEEDS) {
      const vehicleTypeId = yield* lookupMasterId(sql, "vehicle_types", vehicle.vehicleTypeCode);

      yield* Effect.tryPromise({
        try: () =>
          sql`
            INSERT INTO vehicles (
              id,
              registration_number,
              name_model,
              vehicle_type_id,
              max_load_capacity_kg,
              odometer_km,
              acquisition_cost_inr,
              status,
              notes,
              created_by_user_id,
              created_at,
              updated_at
            )
            SELECT
              gen_random_uuid(),
              ${vehicle.registrationNumber},
              ${vehicle.nameModel},
              ${vehicleTypeId}::uuid,
              ${vehicle.maxLoadCapacityKg},
              ${vehicle.odometerKm},
              ${vehicle.acquisitionCostInr},
              ${vehicle.status},
              ${vehicle.notes},
              ${createdByUserId},
              NOW(),
              NOW()
            WHERE NOT EXISTS (
              SELECT 1
              FROM vehicles v
              WHERE v.registration_number = ${vehicle.registrationNumber}
                AND v.deleted_at IS NULL
            )
          `,
        catch: (error) =>
          new Error(
            getErrorMessage(error, `Failed to seed vehicle ${vehicle.registrationNumber}.`),
          ),
      });
    }

    yield* Console.log(`   ✓ vehicles (${FLEET_VEHICLE_SEEDS.length})`);
  });
}

function seedFleetDrivers(sql: SqlClient, createdByUserId: string) {
  return Effect.gen(function* () {
    for (const driver of FLEET_DRIVER_SEEDS) {
      const licenseCategoryId = yield* lookupMasterId(
        sql,
        "license_categories",
        driver.licenseCategoryCode,
      );

      yield* Effect.tryPromise({
        try: () =>
          sql`
            INSERT INTO drivers (
              id,
              full_name,
              license_number,
              license_category_id,
              license_expiry_date,
              contact_number,
              safety_score,
              status,
              notes,
              created_by_user_id,
              created_at,
              updated_at
            )
            SELECT
              gen_random_uuid(),
              ${driver.fullName},
              ${driver.licenseNumber},
              ${licenseCategoryId}::uuid,
              ${driver.licenseExpiryDate}::date,
              ${driver.contactNumber},
              ${driver.safetyScore},
              ${driver.status},
              ${driver.notes},
              ${createdByUserId},
              NOW(),
              NOW()
            WHERE NOT EXISTS (
              SELECT 1
              FROM drivers d
              WHERE d.license_number = ${driver.licenseNumber}
                AND d.deleted_at IS NULL
            )
          `,
        catch: (error) =>
          new Error(getErrorMessage(error, `Failed to seed driver ${driver.licenseNumber}.`)),
      });
    }

    yield* Console.log(`   ✓ drivers (${FLEET_DRIVER_SEEDS.length})`);
  });
}

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

      yield* Console.log("\n📍  Location master data:");
      for (const location of LOCATION_SEEDS) {
        yield* Effect.tryPromise({
          try: () =>
            sql`
              INSERT INTO locations (id, code, name, is_active, created_at, updated_at)
              SELECT gen_random_uuid(), ${location.code}, ${location.name}, TRUE, NOW(), NOW()
              WHERE NOT EXISTS (
                SELECT 1 FROM locations l
                WHERE l.code = ${location.code} AND l.deleted_at IS NULL
              )
            `,
          catch: (error) =>
            new Error(getErrorMessage(error, `Failed to seed location ${location.code}.`)),
        });
      }
      yield* Console.log(`   ✓ locations (${LOCATION_SEEDS.length})`);

      yield* Console.log("\n🚛  Fleet sample data:");
      yield* seedFleetVehicles(sql, result.id);
      yield* seedFleetDrivers(sql, result.id);
    }),
  );

  yield* Console.log(
    `\n✅  Seed complete — masters, ${LOCATION_SEEDS.length} locations, fleet_manager, ${FLEET_VEHICLE_SEEDS.length} vehicles, ${FLEET_DRIVER_SEEDS.length} drivers.\n`,
  );
});

await runScript(program, "❌  Seed failed:");
