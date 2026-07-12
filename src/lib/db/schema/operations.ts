import { sql } from "drizzle-orm";
import {
  bigserial,
  check,
  date,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { user } from "@/lib/db/schema/auth";
import { maintenanceStatusEnum, tripStatusEnum } from "@/lib/db/schema/enums";
import { drivers, vehicles } from "@/lib/db/schema/fleet";
import { deletedAt, timestamps } from "@/lib/db/schema/helpers";
import { locations } from "@/lib/db/schema/locations";
import { expenseCategories, maintenanceTypes } from "@/lib/db/schema/masters";

export const trips = pgTable(
  "trips",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    status: tripStatusEnum("status").notNull().default("draft"),
    sourceLocationId: uuid("source_location_id")
      .notNull()
      .references(() => locations.id),
    destinationLocationId: uuid("destination_location_id")
      .notNull()
      .references(() => locations.id),
    vehicleId: uuid("vehicle_id")
      .notNull()
      .references(() => vehicles.id),
    driverId: uuid("driver_id")
      .notNull()
      .references(() => drivers.id),
    cargoWeightKg: numeric("cargo_weight_kg", { precision: 12, scale: 2 }).notNull(),
    plannedDistanceKm: numeric("planned_distance_km", { precision: 12, scale: 2 }).notNull(),
    startOdometerKm: numeric("start_odometer_km", { precision: 12, scale: 1 }),
    endOdometerKm: numeric("end_odometer_km", { precision: 12, scale: 1 }),
    actualDistanceKm: numeric("actual_distance_km", { precision: 12, scale: 2 }),
    fuelConsumedLiters: numeric("fuel_consumed_liters", { precision: 12, scale: 3 }),
    fuelCostInr: numeric("fuel_cost_inr", { precision: 12, scale: 2 }),
    dispatchedAt: timestamp("dispatched_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    cancelReason: text("cancel_reason"),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => user.id),
    ...timestamps,
    deletedAt,
  },
  (table) => [
    index("trips_status_idx").on(table.status),
    index("trips_vehicle_id_status_idx").on(table.vehicleId, table.status),
    index("trips_driver_id_status_idx").on(table.driverId, table.status),
    index("trips_dispatched_at_idx").on(table.dispatchedAt),
    index("trips_completed_at_idx").on(table.completedAt),
    uniqueIndex("trips_one_dispatched_vehicle")
      .on(table.vehicleId)
      .where(sql`${table.status} = 'dispatched' and ${table.deletedAt} is null`),
    uniqueIndex("trips_one_dispatched_driver")
      .on(table.driverId)
      .where(sql`${table.status} = 'dispatched' and ${table.deletedAt} is null`),
    index("trips_source_location_id_idx").on(table.sourceLocationId),
    index("trips_destination_location_id_idx").on(table.destinationLocationId),
    check("trips_cargo_weight_kg_positive", sql`${table.cargoWeightKg} > 0`),
    check("trips_planned_distance_km_positive", sql`${table.plannedDistanceKm} > 0`),
    check(
      "trips_source_destination_different",
      sql`${table.sourceLocationId} <> ${table.destinationLocationId}`,
    ),
  ],
);

export const maintenanceLogs = pgTable(
  "maintenance_logs",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    vehicleId: uuid("vehicle_id")
      .notNull()
      .references(() => vehicles.id),
    maintenanceTypeId: uuid("maintenance_type_id")
      .notNull()
      .references(() => maintenanceTypes.id),
    status: maintenanceStatusEnum("status").notNull().default("open"),
    description: text("description"),
    vendorName: varchar("vendor_name", { length: 160 }),
    costInr: numeric("cost_inr", { precision: 12, scale: 2 }).notNull().default("0"),
    odometerAtServiceKm: numeric("odometer_at_service_km", { precision: 12, scale: 1 }),
    nextDueOdometerKm: numeric("next_due_odometer_km", { precision: 12, scale: 1 }),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => user.id),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("maintenance_logs_one_open_per_vehicle")
      .on(table.vehicleId)
      .where(sql`${table.status} = 'open'`),
    index("maintenance_logs_vehicle_id_status_idx").on(table.vehicleId, table.status),
    index("maintenance_logs_started_at_idx").on(table.startedAt),
    check("maintenance_logs_cost_inr_non_negative", sql`${table.costInr} >= 0`),
  ],
);

export const fuelLogs = pgTable(
  "fuel_logs",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    vehicleId: uuid("vehicle_id")
      .notNull()
      .references(() => vehicles.id),
    tripId: uuid("trip_id").references(() => trips.id),
    liters: numeric("liters", { precision: 12, scale: 3 }).notNull(),
    costInr: numeric("cost_inr", { precision: 12, scale: 2 }).notNull(),
    loggedAt: date("logged_at").notNull(),
    notes: text("notes"),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => user.id),
    ...timestamps,
  },
  (table) => [
    index("fuel_logs_vehicle_id_logged_at_idx").on(table.vehicleId, table.loggedAt),
    uniqueIndex("fuel_logs_trip_id_unique")
      .on(table.tripId)
      .where(sql`${table.tripId} is not null`),
    check("fuel_logs_liters_positive", sql`${table.liters} > 0`),
    check("fuel_logs_cost_inr_non_negative", sql`${table.costInr} >= 0`),
  ],
);

export const expenses = pgTable(
  "expenses",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    vehicleId: uuid("vehicle_id")
      .notNull()
      .references(() => vehicles.id),
    expenseCategoryId: uuid("expense_category_id")
      .notNull()
      .references(() => expenseCategories.id),
    tripId: uuid("trip_id").references(() => trips.id),
    amountInr: numeric("amount_inr", { precision: 12, scale: 2 }).notNull(),
    incurredOn: date("incurred_on").notNull(),
    description: text("description"),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => user.id),
    ...timestamps,
  },
  (table) => [
    index("expenses_vehicle_id_incurred_on_idx").on(table.vehicleId, table.incurredOn),
    index("expenses_expense_category_id_idx").on(table.expenseCategoryId),
    index("expenses_trip_id_idx").on(table.tripId),
    check("expenses_amount_inr_positive", sql`${table.amountInr} > 0`),
  ],
);
