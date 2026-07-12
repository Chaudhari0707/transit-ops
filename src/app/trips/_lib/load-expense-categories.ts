import "server-only";

import { and, asc, eq, sql } from "drizzle-orm";

import type { ExpenseCategoryOption } from "@/app/trips/_types/trip-form";
import { getDb } from "@/lib/db/client";
import { expenseCategories } from "@/lib/db/schema";

export async function loadExpenseCategories(): Promise<ExpenseCategoryOption[]> {
  const rows = await getDb()
    .select({
      id: expenseCategories.id,
      code: expenseCategories.code,
      name: expenseCategories.name,
    })
    .from(expenseCategories)
    .where(and(eq(expenseCategories.isActive, true), sql`${expenseCategories.deletedAt} is null`))
    .orderBy(asc(expenseCategories.code));

  return rows;
}
