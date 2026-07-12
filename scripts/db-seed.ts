import { calculateTripRevenueInr, REVENUE_RATE_INR_PER_KM_KG } from "../src/lib/constants/revenue";
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
import { TRIP_SEEDS } from "./seed-trips-data";

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

function lookupIdByCode(
  sql: SqlClient,
  tableName: "locations" | "expense_categories",
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
        throw new Error(`Missing row ${tableName}.${code}. Seed masters first.`);
      }

      return row.id;
    },
    catch: (error) => new Error(getErrorMessage(error, `Failed to resolve ${tableName}.${code}.`)),
  });
}

function seedSampleTrips(sql: SqlClient, createdByUserId: string) {
  return Effect.gen(function* () {
    let revenueCount = 0;

    for (const trip of TRIP_SEEDS) {
      const vehicleRows = yield* Effect.tryPromise({
        try: () =>
          sql<{ id: string; max_load_capacity_kg: string }[]>`
            SELECT id, max_load_capacity_kg
            FROM vehicles
            WHERE name_model = ${trip.vehicleNameModel}
              AND deleted_at IS NULL
            LIMIT 1
          `,
        catch: (error) =>
          new Error(getErrorMessage(error, `Failed to find vehicle ${trip.vehicleNameModel}.`)),
      });
      const vehicle = vehicleRows[0];

      if (!vehicle) {
        throw new Error(`Vehicle ${trip.vehicleNameModel} not found. Seed fleet first.`);
      }

      const driverRows = yield* Effect.tryPromise({
        try: () =>
          sql<{ id: string }[]>`
            SELECT id
            FROM drivers
            WHERE full_name = ${trip.driverFullName}
              AND deleted_at IS NULL
            LIMIT 1
          `,
        catch: (error) =>
          new Error(getErrorMessage(error, `Failed to find driver ${trip.driverFullName}.`)),
      });
      const driver = driverRows[0];

      if (!driver) {
        throw new Error(`Driver ${trip.driverFullName} not found. Seed fleet first.`);
      }

      const sourceLocationId = yield* lookupIdByCode(sql, "locations", trip.sourceLocationCode);
      const destinationLocationId = yield* lookupIdByCode(
        sql,
        "locations",
        trip.destinationLocationCode,
      );

      const existing = yield* Effect.tryPromise({
        try: () =>
          sql<{ id: string }[]>`
            SELECT id
            FROM trips
            WHERE vehicle_id = ${vehicle.id}::uuid
              AND driver_id = ${driver.id}::uuid
              AND source_location_id = ${sourceLocationId}::uuid
              AND destination_location_id = ${destinationLocationId}::uuid
              AND planned_distance_km = ${trip.plannedDistanceKm}
              AND status = ${trip.status}
              AND deleted_at IS NULL
            LIMIT 1
          `,
        catch: (error) =>
          new Error(getErrorMessage(error, `Failed to check existing trip ${trip.seedKey}.`)),
      });

      if (existing[0]) {
        continue;
      }

      const tripId = crypto.randomUUID();
      const isCompleted = trip.status === "completed";
      const isDispatched = trip.status === "dispatched";

      yield* Effect.tryPromise({
        try: () =>
          sql`
            INSERT INTO trips (
              id,
              status,
              source_location_id,
              destination_location_id,
              vehicle_id,
              driver_id,
              cargo_weight_kg,
              planned_distance_km,
              start_odometer_km,
              end_odometer_km,
              actual_distance_km,
              fuel_consumed_liters,
              fuel_cost_inr,
              dispatched_at,
              completed_at,
              created_by_user_id,
              created_at,
              updated_at
            )
            VALUES (
              ${tripId}::uuid,
              ${trip.status},
              ${sourceLocationId}::uuid,
              ${destinationLocationId}::uuid,
              ${vehicle.id}::uuid,
              ${driver.id}::uuid,
              ${trip.cargoWeightKg},
              ${trip.plannedDistanceKm},
              ${trip.startOdometerKm ?? null},
              ${trip.endOdometerKm ?? null},
              ${trip.actualDistanceKm ?? null},
              ${trip.fuelConsumedLiters ?? null},
              ${trip.fuelCostInr ?? null},
              ${trip.dispatchedOn ? `${trip.dispatchedOn}T08:00:00Z` : null},
              ${trip.completedOn ? `${trip.completedOn}T17:00:00Z` : null},
              ${createdByUserId},
              NOW(),
              NOW()
            )
          `,
        catch: (error) => new Error(getErrorMessage(error, `Failed to seed trip ${trip.seedKey}.`)),
      });

      if (!isCompleted) {
        if (isDispatched) {
          // vehicle/driver already seeded as on_trip for active demos
        }
        continue;
      }

      const expenseCategoryId = yield* lookupIdByCode(
        sql,
        "expense_categories",
        trip.expenseCategoryCode ?? "TOLL",
      );
      const earnedOn = trip.completedOn ?? "2026-07-01";
      const capacityKg = Number(vehicle.max_load_capacity_kg);
      const plannedKm = Number(trip.plannedDistanceKm);
      const amountInr = calculateTripRevenueInr(plannedKm, capacityKg);

      yield* Effect.tryPromise({
        try: () =>
          sql`
            INSERT INTO fuel_logs (
              vehicle_id,
              trip_id,
              liters,
              cost_inr,
              logged_at,
              notes,
              created_by_user_id,
              created_at,
              updated_at
            )
            VALUES (
              ${vehicle.id}::uuid,
              ${tripId}::uuid,
              ${trip.fuelConsumedLiters ?? "1.000"},
              ${trip.fuelCostInr ?? "1.00"},
              ${earnedOn}::date,
              ${`Seed fuel for ${trip.seedKey}`},
              ${createdByUserId},
              NOW(),
              NOW()
            )
          `,
        catch: (error) =>
          new Error(getErrorMessage(error, `Failed to seed fuel for ${trip.seedKey}.`)),
      });

      yield* Effect.tryPromise({
        try: () =>
          sql`
            INSERT INTO expenses (
              vehicle_id,
              expense_category_id,
              trip_id,
              amount_inr,
              incurred_on,
              description,
              created_by_user_id,
              created_at,
              updated_at
            )
            VALUES (
              ${vehicle.id}::uuid,
              ${expenseCategoryId}::uuid,
              ${tripId}::uuid,
              ${trip.expenseAmountInr ?? "100.00"},
              ${earnedOn}::date,
              ${`Seed expense for ${trip.seedKey}`},
              ${createdByUserId},
              NOW(),
              NOW()
            )
          `,
        catch: (error) =>
          new Error(getErrorMessage(error, `Failed to seed expense for ${trip.seedKey}.`)),
      });

      yield* Effect.tryPromise({
        try: () =>
          sql`
            INSERT INTO revenue_logs (
              trip_id,
              vehicle_id,
              planned_distance_km,
              capacity_kg,
              rate_inr_per_km_kg,
              amount_inr,
              earned_on,
              created_by_user_id,
              created_at,
              updated_at
            )
            VALUES (
              ${tripId}::uuid,
              ${vehicle.id}::uuid,
              ${plannedKm.toFixed(2)},
              ${capacityKg.toFixed(2)},
              ${REVENUE_RATE_INR_PER_KM_KG.toFixed(4)},
              ${amountInr.toFixed(2)},
              ${earnedOn}::date,
              ${createdByUserId},
              NOW(),
              NOW()
            )
          `,
        catch: (error) =>
          new Error(getErrorMessage(error, `Failed to seed revenue for ${trip.seedKey}.`)),
      });

      revenueCount += 1;
    }

    const completedCount = TRIP_SEEDS.filter((t) => t.status === "completed").length;
    yield* Console.log(`   ✓ trips (${TRIP_SEEDS.length})`);
    yield* Console.log(
      `   ✓ revenue_logs for completed trips (${revenueCount}/${completedCount} seeded this run)`,
    );
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

      yield* Console.log("\n🗺️  Sample trips + revenue (ADR-056):");
      yield* seedSampleTrips(sql, result.id);
    }),
  );

  yield* Console.log(
    `\n✅  Seed complete — masters, ${LOCATION_SEEDS.length} locations, fleet_manager, ${FLEET_VEHICLE_SEEDS.length} vehicles, ${FLEET_DRIVER_SEEDS.length} drivers, ${TRIP_SEEDS.length} trips.\n`,
  );
});

await runScript(program, "❌  Seed failed:");
