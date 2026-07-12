import { sql } from "drizzle-orm";
import { boolean, pgTable, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";

import { deletedAt, timestamps } from "@/lib/db/schema/helpers";

function masterTable(name: string, codeUniqueName: string) {
  return pgTable(
    name,
    {
      id: uuid("id").defaultRandom().primaryKey(),
      code: varchar("code", { length: 32 }).notNull(),
      name: varchar("name", { length: 120 }).notNull(),
      isActive: boolean("is_active").notNull().default(true),
      ...timestamps,
      deletedAt,
    },
    (table) => [
      uniqueIndex(codeUniqueName)
        .on(table.code)
        .where(sql`${table.deletedAt} is null`),
    ],
  );
}

export const vehicleTypes = masterTable("vehicle_types", "vehicle_types_code_unique");
export const licenseCategories = masterTable(
  "license_categories",
  "license_categories_code_unique",
);
export const expenseCategories = masterTable(
  "expense_categories",
  "expense_categories_code_unique",
);
export const maintenanceTypes = masterTable("maintenance_types", "maintenance_types_code_unique");
