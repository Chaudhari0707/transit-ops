import { calculateTripRevenueInr, REVENUE_RATE_INR_PER_KM_KG } from "../src/lib/constants/revenue";
import type { SqlClient } from "./_types/sql-client";
import {
  Console,
  Effect,
  runScript,
  seedAdminUser,
  upsertAdminUser,
  upsertCredentialUser,
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
    { code: "OTHER", name: "Other" },
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

function lookupVehicleId(sql: SqlClient, registrationNumber: string) {
  return Effect.tryPromise({
    try: async () => {
      const rows = await sql<{ id: string }[]>`
        SELECT id
        FROM vehicles
        WHERE registration_number = ${registrationNumber}
          AND deleted_at IS NULL
        LIMIT 1
      `;

      const row = rows[0];

      if (!row) {
        throw new Error(`Missing vehicle ${registrationNumber}. Seed fleet first.`);
      }

      return row.id;
    },
    catch: (error) =>
      new Error(getErrorMessage(error, `Failed to resolve vehicle ${registrationNumber}.`)),
  });
}

function lookupMaintenanceTypeId(sql: SqlClient, code: string) {
  return Effect.tryPromise({
    try: async () => {
      const rows = await sql<{ id: string }[]>`
        SELECT id
        FROM maintenance_types
        WHERE code = ${code}
          AND deleted_at IS NULL
        LIMIT 1
      `;

      const row = rows[0];

      if (!row) {
        throw new Error(`Missing maintenance type ${code}.`);
      }

      return row.id;
    },
    catch: (error) =>
      new Error(getErrorMessage(error, `Failed to resolve maintenance type ${code}.`)),
  });
}

/** Align open log with Van-07 (in_shop) + one closed history for op-cost demo. */
function seedMaintenanceLogs(sql: SqlClient, createdByUserId: string) {
  return Effect.gen(function* () {
    const van07Id = yield* lookupVehicleId(sql, "GJ-01-VA-1007");
    const truck12Id = yield* lookupVehicleId(sql, "GJ-06-TK-1212");
    const oilTypeId = yield* lookupMaintenanceTypeId(sql, "OIL_CHANGE");
    const generalTypeId = yield* lookupMaintenanceTypeId(sql, "GENERAL");

    yield* Effect.tryPromise({
      try: () =>
        sql`
          INSERT INTO maintenance_logs (
            vehicle_id,
            maintenance_type_id,
            status,
            description,
            vendor_name,
            cost_inr,
            odometer_at_service_km,
            started_at,
            created_by_user_id,
            created_at,
            updated_at
          )
          SELECT
            ${van07Id}::uuid,
            ${oilTypeId}::uuid,
            'open',
            'Scheduled brake service + pads',
            'City Auto Care',
            8500.00,
            28750.0,
            NOW() - INTERVAL '1 day',
            ${createdByUserId},
            NOW(),
            NOW()
          WHERE NOT EXISTS (
            SELECT 1
            FROM maintenance_logs m
            WHERE m.vehicle_id = ${van07Id}::uuid
              AND m.status = 'open'
          )
        `,
      catch: (error) =>
        new Error(getErrorMessage(error, "Failed to seed open maintenance for Van-07.")),
    });

    yield* Effect.tryPromise({
      try: () =>
        sql`
          INSERT INTO maintenance_logs (
            vehicle_id,
            maintenance_type_id,
            status,
            description,
            vendor_name,
            cost_inr,
            odometer_at_service_km,
            next_due_odometer_km,
            started_at,
            completed_at,
            created_by_user_id,
            created_at,
            updated_at
          )
          SELECT
            ${truck12Id}::uuid,
            ${generalTypeId}::uuid,
            'closed',
            'Quarterly general service',
            'Surat Fleet Works',
            12400.00,
            127800.0,
            137800.0,
            NOW() - INTERVAL '14 days',
            NOW() - INTERVAL '12 days',
            ${createdByUserId},
            NOW(),
            NOW()
          WHERE NOT EXISTS (
            SELECT 1
            FROM maintenance_logs m
            WHERE m.vehicle_id = ${truck12Id}::uuid
              AND m.status = 'closed'
              AND m.description = 'Quarterly general service'
          )
        `,
      catch: (error) =>
        new Error(getErrorMessage(error, "Failed to seed closed maintenance for Truck-12.")),
    });

    // Extra closed maintenance on Van-05 so MAINT. (LINKED) appears for mockup path.
    const van05Id = yield* lookupVehicleId(sql, "GJ-01-VA-1005");
    const tyreTypeId = yield* lookupMaintenanceTypeId(sql, "TYRE");

    yield* Effect.tryPromise({
      try: () =>
        sql`
          INSERT INTO maintenance_logs (
            vehicle_id,
            maintenance_type_id,
            status,
            description,
            vendor_name,
            cost_inr,
            odometer_at_service_km,
            started_at,
            completed_at,
            created_by_user_id,
            created_at,
            updated_at
          )
          SELECT
            ${van05Id}::uuid,
            ${tyreTypeId}::uuid,
            'closed',
            'Tyre replacement after long haul',
            'Gandhinagar Tyres',
            5600.00,
            44800.0,
            NOW() - INTERVAL '20 days',
            NOW() - INTERVAL '19 days',
            ${createdByUserId},
            NOW(),
            NOW()
          WHERE NOT EXISTS (
            SELECT 1
            FROM maintenance_logs m
            WHERE m.vehicle_id = ${van05Id}::uuid
              AND m.status = 'closed'
              AND m.description = 'Tyre replacement after long haul'
          )
        `,
      catch: (error) =>
        new Error(getErrorMessage(error, "Failed to seed closed maintenance for Van-05.")),
    });

    yield* Console.log("   ✓ maintenance_logs (open Van-07 + closed Truck-12/Van-05)");
  });
}

function lookupExpenseCategoryId(sql: SqlClient, code: string) {
  return Effect.tryPromise({
    try: async () => {
      const rows = await sql<{ id: string }[]>`
        SELECT id
        FROM expense_categories
        WHERE code = ${code}
          AND deleted_at IS NULL
        LIMIT 1
      `;

      const row = rows[0];

      if (!row) {
        throw new Error(`Missing expense category ${code}.`);
      }

      return row.id;
    },
    catch: (error) =>
      new Error(getErrorMessage(error, `Failed to resolve expense category ${code}.`)),
  });
}

/**
 * Manual fuel/expense samples for Finance UI (trip-linked logs come from seedSampleTrips).
 * Keep liters modest so fleet efficiency stays realistic (~8 km/L with completed trips).
 */
function seedFuelAndExpenses(sql: SqlClient, createdByUserId: string) {
  return Effect.gen(function* () {
    const van05Id = yield* lookupVehicleId(sql, "GJ-01-VA-1005");
    const van03Id = yield* lookupVehicleId(sql, "GJ-01-VA-1003");
    const fineId = yield* lookupExpenseCategoryId(sql, "FINE");
    const miscId = yield* lookupExpenseCategoryId(sql, "MISC");

    // Small manual top-ups only — completed-trip fuel carries most distance/efficiency.
    const fuelSeeds = [
      {
        vehicleId: van05Id,
        liters: "6.000",
        costInr: "450.00",
        loggedAt: "2026-07-05",
        notes: "Van-05 city top-up (manual)",
      },
      {
        vehicleId: van03Id,
        liters: "4.000",
        costInr: "300.00",
        loggedAt: "2026-07-06",
        notes: "Van-03 hub top-up (manual)",
      },
    ] as const;

    for (const fuel of fuelSeeds) {
      yield* Effect.tryPromise({
        try: () =>
          sql`
            INSERT INTO fuel_logs (
              vehicle_id, liters, cost_inr, logged_at, notes, created_by_user_id, created_at, updated_at
            )
            SELECT
              ${fuel.vehicleId}::uuid,
              ${fuel.liters},
              ${fuel.costInr},
              ${fuel.loggedAt}::date,
              ${fuel.notes},
              ${createdByUserId},
              NOW(),
              NOW()
            WHERE NOT EXISTS (
              SELECT 1
              FROM fuel_logs f
              WHERE f.vehicle_id = ${fuel.vehicleId}::uuid
                AND f.logged_at = ${fuel.loggedAt}::date
                AND f.notes = ${fuel.notes}
            )
          `,
        catch: (error) =>
          new Error(getErrorMessage(error, `Failed to seed fuel log ${fuel.notes}.`)),
      });
    }

    const expenseSeeds = [
      {
        vehicleId: van05Id,
        categoryId: miscId,
        amountInr: "120.00",
        incurredOn: "2026-07-05",
        description: "Parking / misc Van-05 (manual)",
      },
      {
        vehicleId: van03Id,
        categoryId: fineId,
        amountInr: "500.00",
        incurredOn: "2026-07-06",
        description: "Traffic fine Van-03 (manual)",
      },
    ] as const;

    for (const expense of expenseSeeds) {
      yield* Effect.tryPromise({
        try: () =>
          sql`
            INSERT INTO expenses (
              vehicle_id,
              expense_category_id,
              amount_inr,
              incurred_on,
              description,
              created_by_user_id,
              created_at,
              updated_at
            )
            SELECT
              ${expense.vehicleId}::uuid,
              ${expense.categoryId}::uuid,
              ${expense.amountInr},
              ${expense.incurredOn}::date,
              ${expense.description},
              ${createdByUserId},
              NOW(),
              NOW()
            WHERE NOT EXISTS (
              SELECT 1
              FROM expenses e
              WHERE e.vehicle_id = ${expense.vehicleId}::uuid
                AND e.description = ${expense.description}
            )
          `,
        catch: (error) =>
          new Error(getErrorMessage(error, `Failed to seed expense ${expense.description}.`)),
      });
    }

    yield* Console.log("   ✓ fuel_logs manual (2) + expenses fine/misc (2)");
  });
}

function lookupIdByCode(
  sql: SqlClient,
  tableName: "expense_categories" | "locations",
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

/** Soft-delete absurd completed trips (e.g. bad manual complete tests) that break efficiency KPIs. */
function cleanupBadAnalyticsTrips(sql: SqlClient) {
  return Effect.tryPromise({
    try: () =>
      sql`
        UPDATE trips
        SET deleted_at = NOW(), updated_at = NOW()
        WHERE deleted_at IS NULL
          AND status = 'completed'
          AND actual_distance_km IS NOT NULL
          AND actual_distance_km > 5000
      `,
    catch: (error) => new Error(getErrorMessage(error, "Failed to cleanup bad analytics trips.")),
  });
}

/** Drop superseded high-liter manual fuel rows so trip-linked efficiency stays realistic. */
function cleanupLegacyManualFuel(sql: SqlClient) {
  return Effect.tryPromise({
    try: () =>
      sql`
        DELETE FROM fuel_logs
        WHERE trip_id IS NULL
          AND notes IN (
            'Van-05 city fill',
            'Truck-12 Surat corridor',
            'Van-03 hub shuttle',
            'Van-05 city top-up (manual)',
            'Van-03 hub top-up (manual)'
          )
      `,
    catch: (error) =>
      new Error(getErrorMessage(error, "Failed to cleanup legacy manual fuel logs.")),
  });
}

/** Refresh trip-linked fuel liters/cost when seed constants change (idempotent update). */
function refreshTripLinkedFuelFromSeed(sql: SqlClient) {
  return Effect.gen(function* () {
    for (const trip of TRIP_SEEDS) {
      const liters = trip.fuelConsumedLiters;
      const costInr = trip.fuelCostInr;

      if (trip.status !== "completed" || !liters || !costInr) {
        continue;
      }

      yield* Effect.tryPromise({
        try: () =>
          sql`
            UPDATE fuel_logs f
            SET
              liters = ${liters},
              cost_inr = ${costInr},
              updated_at = NOW()
            FROM trips t
            WHERE f.trip_id = t.id
              AND t.deleted_at IS NULL
              AND t.status = 'completed'
              AND f.notes = ${`Seed fuel for ${trip.seedKey}`}
          `,
        catch: (error) =>
          new Error(getErrorMessage(error, `Failed to refresh fuel for ${trip.seedKey}.`)),
      });
    }
  });
}

/** Remove fuel/expense/revenue linked to soft-deleted trips so KPIs stay consistent. */
function cleanupLogsForDeletedTrips(sql: SqlClient) {
  return Effect.gen(function* () {
    yield* Effect.tryPromise({
      try: () =>
        sql`
          DELETE FROM fuel_logs f
          USING trips t
          WHERE f.trip_id = t.id
            AND t.deleted_at IS NOT NULL
        `,
      catch: (error) =>
        new Error(getErrorMessage(error, "Failed to cleanup fuel for deleted trips.")),
    });
    yield* Effect.tryPromise({
      try: () =>
        sql`
          DELETE FROM expenses e
          USING trips t
          WHERE e.trip_id = t.id
            AND t.deleted_at IS NOT NULL
        `,
      catch: (error) =>
        new Error(getErrorMessage(error, "Failed to cleanup expenses for deleted trips.")),
    });
    yield* Effect.tryPromise({
      try: () =>
        sql`
          DELETE FROM revenue_logs r
          USING trips t
          WHERE r.trip_id = t.id
            AND t.deleted_at IS NOT NULL
        `,
      catch: (error) =>
        new Error(getErrorMessage(error, "Failed to cleanup revenue for deleted trips.")),
    });
  });
}

/** Sample trips + trip-linked fuel/expense/revenue (ADR-056) for analytics. */
function seedSampleTrips(sql: SqlClient, createdByUserId: string) {
  return Effect.gen(function* () {
    yield* cleanupBadAnalyticsTrips(sql);
    yield* cleanupLogsForDeletedTrips(sql);
    yield* cleanupLegacyManualFuel(sql);
    yield* refreshTripLinkedFuelFromSeed(sql);
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

      let tripId = existing[0]?.id;
      const isCompleted = trip.status === "completed";

      if (!tripId) {
        tripId = crypto.randomUUID();

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
          catch: (error) =>
            new Error(getErrorMessage(error, `Failed to seed trip ${trip.seedKey}.`)),
        });
      }

      if (!isCompleted) {
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
            SELECT
              ${vehicle.id}::uuid,
              ${tripId}::uuid,
              ${trip.fuelConsumedLiters ?? "1.000"},
              ${trip.fuelCostInr ?? "1.00"},
              ${earnedOn}::date,
              ${`Seed fuel for ${trip.seedKey}`},
              ${createdByUserId},
              NOW(),
              NOW()
            WHERE NOT EXISTS (
              SELECT 1 FROM fuel_logs f WHERE f.trip_id = ${tripId}::uuid
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
            SELECT
              ${vehicle.id}::uuid,
              ${expenseCategoryId}::uuid,
              ${tripId}::uuid,
              ${trip.expenseAmountInr ?? "100.00"},
              ${earnedOn}::date,
              ${`Seed expense for ${trip.seedKey}`},
              ${createdByUserId},
              NOW(),
              NOW()
            WHERE NOT EXISTS (
              SELECT 1
              FROM expenses e
              WHERE e.trip_id = ${tripId}::uuid
                AND e.description = ${`Seed expense for ${trip.seedKey}`}
            )
          `,
        catch: (error) =>
          new Error(getErrorMessage(error, `Failed to seed expense for ${trip.seedKey}.`)),
      });

      const revenueInsert = yield* Effect.tryPromise({
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
            SELECT
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
            WHERE NOT EXISTS (
              SELECT 1 FROM revenue_logs r WHERE r.trip_id = ${tripId}::uuid
            )
            RETURNING id
          `,
        catch: (error) =>
          new Error(getErrorMessage(error, `Failed to seed revenue for ${trip.seedKey}.`)),
      });

      if (Array.isArray(revenueInsert) && revenueInsert.length > 0) {
        revenueCount += 1;
      }
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

      const finance = yield* upsertCredentialUser(sql, {
        email: "finance@example.com",
        fullName: "Demo Finance Analyst",
        password: adminUser.password,
        phoneNumber: "9111111111",
        role: "financial_analyst",
        username: "finance",
      });
      yield* Console.log("\n✅  Financial analyst user seeded:");
      yield* Console.log(`      Email    : finance@example.com`);
      yield* Console.log(`      Password : ${adminUser.password}`);
      yield* Console.log(`      Role     : financial_analyst`);
      yield* Console.log(`      Record ID: ${finance.id}`);

      const safety = yield* upsertCredentialUser(sql, {
        email: "safety@example.com",
        fullName: "Demo Safety Officer",
        password: adminUser.password,
        phoneNumber: "9222222222",
        role: "safety_officer",
        username: "safety",
      });
      yield* Console.log("\n✅  Safety officer user seeded:");
      yield* Console.log(`      Email    : safety@example.com`);
      yield* Console.log(`      Password : ${adminUser.password}`);
      yield* Console.log(`      Role     : safety_officer`);
      yield* Console.log(`      Record ID: ${safety.id}`);

      const dispatcher = yield* upsertCredentialUser(sql, {
        email: "dispatcher@example.com",
        fullName: "Demo Dispatcher",
        password: adminUser.password,
        phoneNumber: "9333333333",
        role: "dispatcher",
        username: "dispatcher",
      });
      yield* Console.log("\n✅  Dispatcher user seeded:");
      yield* Console.log(`      Email    : dispatcher@example.com`);
      yield* Console.log(`      Password : ${adminUser.password}`);
      yield* Console.log(`      Role     : dispatcher`);
      yield* Console.log(`      Record ID: ${dispatcher.id}`);

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

      yield* Console.log("\n🔧  Maintenance sample data:");
      yield* seedMaintenanceLogs(sql, result.id);

      yield* Console.log("\n⛽  Manual fuel & expense sample data:");
      yield* seedFuelAndExpenses(sql, finance.id);
    }),
  );

  yield* Console.log(
    `\n✅  Seed complete — masters, users (FM/FA/Safety/Dispatcher), ${LOCATION_SEEDS.length} locations, fleet (${FLEET_VEHICLE_SEEDS.length} vehicles, ${FLEET_DRIVER_SEEDS.length} drivers), ${TRIP_SEEDS.length} trips + revenue, maintenance, fuel & expenses.\n`,
  );
});

await runScript(program, "❌  Seed failed:");
