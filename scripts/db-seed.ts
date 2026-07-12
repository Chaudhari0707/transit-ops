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

/** Fuel logs + toll/misc expenses for Fuel & Expense screen (MAINT linked from closed logs). */
function seedFuelAndExpenses(sql: SqlClient, createdByUserId: string) {
  return Effect.gen(function* () {
    const van05Id = yield* lookupVehicleId(sql, "GJ-01-VA-1005");
    const truck12Id = yield* lookupVehicleId(sql, "GJ-06-TK-1212");
    const van03Id = yield* lookupVehicleId(sql, "GJ-01-VA-1003");
    const tollId = yield* lookupExpenseCategoryId(sql, "TOLL");
    const miscId = yield* lookupExpenseCategoryId(sql, "MISC");

    const fuelSeeds = [
      {
        vehicleId: van05Id,
        liters: "42.000",
        costInr: "3150.00",
        loggedAt: "2026-07-05",
        notes: "Van-05 city fill",
      },
      {
        vehicleId: truck12Id,
        liters: "110.000",
        costInr: "8400.00",
        loggedAt: "2026-07-06",
        notes: "Truck-12 Surat corridor",
      },
      {
        vehicleId: van03Id,
        liters: "28.000",
        costInr: "2050.00",
        loggedAt: "2026-07-06",
        notes: "Van-03 hub shuttle",
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
        categoryId: tollId,
        amountInr: "120.00",
        incurredOn: "2026-07-05",
        description: "Expressway toll Van-05",
      },
      {
        vehicleId: truck12Id,
        categoryId: tollId,
        amountInr: "340.00",
        incurredOn: "2026-07-06",
        description: "Toll Truck-12 corridor",
      },
      {
        vehicleId: truck12Id,
        categoryId: miscId,
        amountInr: "150.00",
        incurredOn: "2026-07-06",
        description: "Parking / misc Truck-12",
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

    yield* Console.log("   ✓ fuel_logs (3) + expenses toll/misc (3)");
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

      yield* Console.log("\n🔧  Maintenance sample data:");
      yield* seedMaintenanceLogs(sql, result.id);

      yield* Console.log("\n⛽  Fuel & expense sample data:");
      yield* seedFuelAndExpenses(sql, finance.id);
    }),
  );

  yield* Console.log(
    `\n✅  Seed complete — masters, users (FM/FA/Safety), fleet (${FLEET_VEHICLE_SEEDS.length} vehicles, ${FLEET_DRIVER_SEEDS.length} drivers), maintenance, fuel & expenses.\n`,
  );
});

await runScript(program, "❌  Seed failed:");
