import { sql } from "drizzle-orm";
import { boolean, index, pgTable, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";

import { deletedAt, timestamps } from "@/lib/db/schema/helpers";

export const locations = pgTable(
  "locations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: varchar("code", { length: 32 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
    deletedAt,
  },
  (table) => [
    uniqueIndex("locations_code_unique")
      .on(table.code)
      .where(sql`${table.deletedAt} is null`),
    index("locations_is_active_idx").on(table.isActive),
  ],
);
