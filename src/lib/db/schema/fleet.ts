import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  numeric,
  pgTable,
  smallint,
  text,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { user } from "@/lib/db/schema/auth";
import { driverStatusEnum, vehicleStatusEnum } from "@/lib/db/schema/enums";
import { deletedAt, timestamps } from "@/lib/db/schema/helpers";
import { licenseCategories, vehicleTypes } from "@/lib/db/schema/masters";

export const vehicles = pgTable(
  "vehicles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    registrationNumber: varchar("registration_number", { length: 32 }).notNull(),
    nameModel: varchar("name_model", { length: 160 }).notNull(),
    vehicleTypeId: uuid("vehicle_type_id")
      .notNull()
      .references(() => vehicleTypes.id),
    maxLoadCapacityKg: numeric("max_load_capacity_kg", { precision: 12, scale: 2 }).notNull(),
    odometerKm: numeric("odometer_km", { precision: 12, scale: 1 }).notNull().default("0"),
    acquisitionCostInr: numeric("acquisition_cost_inr", { precision: 12, scale: 2 }).notNull(),
    status: vehicleStatusEnum("status").notNull().default("available"),
    notes: text("notes"),
    createdByUserId: text("created_by_user_id").references(() => user.id),
    ...timestamps,
    deletedAt,
  },
  (table) => [
    uniqueIndex("vehicles_registration_number_unique")
      .on(table.registrationNumber)
      .where(sql`${table.deletedAt} is null`),
    index("vehicles_status_idx").on(table.status),
    index("vehicles_vehicle_type_id_idx").on(table.vehicleTypeId),
    check("vehicles_max_load_capacity_kg_positive", sql`${table.maxLoadCapacityKg} > 0`),
    check("vehicles_odometer_km_non_negative", sql`${table.odometerKm} >= 0`),
    check("vehicles_acquisition_cost_inr_non_negative", sql`${table.acquisitionCostInr} >= 0`),
  ],
);

export const drivers = pgTable(
  "drivers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fullName: varchar("full_name", { length: 160 }).notNull(),
    licenseNumber: varchar("license_number", { length: 64 }).notNull(),
    licenseCategoryId: uuid("license_category_id")
      .notNull()
      .references(() => licenseCategories.id),
    licenseExpiryDate: date("license_expiry_date").notNull(),
    contactNumber: varchar("contact_number", { length: 32 }).notNull(),
    safetyScore: smallint("safety_score").notNull().default(100),
    status: driverStatusEnum("status").notNull().default("available"),
    userId: text("user_id").references(() => user.id),
    notes: text("notes"),
    createdByUserId: text("created_by_user_id").references(() => user.id),
    ...timestamps,
    deletedAt,
  },
  (table) => [
    uniqueIndex("drivers_license_number_unique")
      .on(table.licenseNumber)
      .where(sql`${table.deletedAt} is null`),
    uniqueIndex("drivers_user_id_unique")
      .on(table.userId)
      .where(sql`${table.userId} is not null`),
    index("drivers_status_idx").on(table.status),
    index("drivers_license_expiry_date_idx").on(table.licenseExpiryDate),
    check("drivers_safety_score_range", sql`${table.safetyScore} between 0 and 100`),
  ],
);
