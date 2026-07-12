import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "fleet_manager",
  "dispatcher",
  "safety_officer",
  "financial_analyst",
]);

export const vehicleStatusEnum = pgEnum("vehicle_status", [
  "available",
  "on_trip",
  "in_shop",
  "retired",
]);

export const driverStatusEnum = pgEnum("driver_status", [
  "available",
  "on_trip",
  "off_duty",
  "suspended",
]);

export const tripStatusEnum = pgEnum("trip_status", [
  "draft",
  "dispatched",
  "completed",
  "cancelled",
]);

export const maintenanceStatusEnum = pgEnum("maintenance_status", ["open", "closed"]);

export const notificationStatusEnum = pgEnum("notification_status", [
  "pending",
  "sent",
  "failed",
  "cancelled",
]);

export const documentEntityTypeEnum = pgEnum("document_entity_type", [
  "vehicle",
  "maintenance_log",
]);
