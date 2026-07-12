import { timestamp } from "drizzle-orm/pg-core";

/** Shared created_at / updated_at columns (timestamptz, not null, default now). */
export const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

/** Soft-delete column used by most domain entities. */
export const deletedAt = timestamp("deleted_at", { withTimezone: true });
