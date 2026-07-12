import "server-only";

import { and, desc, eq, isNull, sql } from "drizzle-orm";

import { requireSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import {
  expenseCategories,
  expenses,
  fuelLogs,
  maintenanceLogs,
  trips,
  vehicles,
} from "@/lib/db/schema";
import { rollupOtherExpenseRows } from "@/modules/fuel-expenses/_lib/other-expenses-rollup";
import {
  assertAllowedExpenseCategoryCode,
  assertFuelExpenseReadRole,
  assertFuelExpenseWriteRole,
  computeFuelEfficiencyKmPerL,
  computeOperationalCostInr,
  efficiencyToFixed,
  moneyToFixed,
  normalizeDateOnly,
  normalizeNonNegativeAmount,
  normalizePositiveAmount,
  normalizePositiveLiters,
} from "@/modules/fuel-expenses/_lib/rules";
import type {
  CreateExpenseInput,
  CreateFuelLogInput,
  ExpenseListItem,
  FuelLogListItem,
  OperationalSummary,
  OtherExpenseRow,
} from "@/modules/fuel-expenses/_types/fuel-expenses";

function mapFuelRow(row: {
  costInr: string;
  id: number;
  liters: string;
  loggedAt: string;
  notes: string | null;
  tripId: string | null;
  vehicleId: string;
  vehicleNameModel: string;
  vehicleRegistration: string;
}): FuelLogListItem {
  return {
    id: row.id,
    vehicleId: row.vehicleId,
    vehicleRegistration: row.vehicleRegistration,
    vehicleNameModel: row.vehicleNameModel,
    tripId: row.tripId,
    liters: row.liters,
    costInr: row.costInr,
    loggedAt: row.loggedAt,
    notes: row.notes,
  };
}

function mapExpenseRow(row: {
  amountInr: string;
  categoryCode: string;
  categoryId: string;
  categoryName: string;
  description: string | null;
  id: number;
  incurredOn: string;
  tripId: string | null;
  vehicleId: string;
  vehicleNameModel: string;
  vehicleRegistration: string;
}): ExpenseListItem {
  return {
    id: row.id,
    vehicleId: row.vehicleId,
    vehicleRegistration: row.vehicleRegistration,
    vehicleNameModel: row.vehicleNameModel,
    categoryId: row.categoryId,
    categoryCode: row.categoryCode,
    categoryName: row.categoryName,
    tripId: row.tripId,
    amountInr: row.amountInr,
    incurredOn: row.incurredOn,
    description: row.description,
  };
}

const fuelSelect = {
  id: fuelLogs.id,
  vehicleId: fuelLogs.vehicleId,
  vehicleRegistration: vehicles.registrationNumber,
  vehicleNameModel: vehicles.nameModel,
  tripId: fuelLogs.tripId,
  liters: fuelLogs.liters,
  costInr: fuelLogs.costInr,
  loggedAt: fuelLogs.loggedAt,
  notes: fuelLogs.notes,
};

const expenseSelect = {
  id: expenses.id,
  vehicleId: expenses.vehicleId,
  vehicleRegistration: vehicles.registrationNumber,
  vehicleNameModel: vehicles.nameModel,
  categoryId: expenses.expenseCategoryId,
  categoryCode: expenseCategories.code,
  categoryName: expenseCategories.name,
  tripId: expenses.tripId,
  amountInr: expenses.amountInr,
  incurredOn: expenses.incurredOn,
  description: expenses.description,
};

export abstract class FuelExpensesService {
  static async listFuelLogs(headers: Headers) {
    const actor = await requireSessionUser(headers);
    assertFuelExpenseReadRole(actor.role);

    const rows = await getDb()
      .select(fuelSelect)
      .from(fuelLogs)
      .innerJoin(vehicles, eq(fuelLogs.vehicleId, vehicles.id))
      .orderBy(desc(fuelLogs.loggedAt), desc(fuelLogs.id));

    return { items: rows.map(mapFuelRow) };
  }

  static async createFuelLog(headers: Headers, body: CreateFuelLogInput) {
    const actor = await requireSessionUser(headers);
    assertFuelExpenseWriteRole(actor.role);

    if (!body.vehicleId?.trim()) {
      throw new Error("vehicleId is required");
    }

    const liters = normalizePositiveLiters(body.liters);
    const costInr = normalizeNonNegativeAmount(body.costInr, "costInr");
    const loggedAt = normalizeDateOnly(body.loggedAt, "loggedAt");
    const notes = body.notes?.trim() ? body.notes.trim() : null;
    const tripId = body.tripId?.trim() ? body.tripId.trim() : null;

    const db = getDb();

    const [vehicle] = await db
      .select({ id: vehicles.id, deletedAt: vehicles.deletedAt })
      .from(vehicles)
      .where(eq(vehicles.id, body.vehicleId))
      .limit(1);

    if (!vehicle || vehicle.deletedAt) {
      throw new Error("Vehicle not found");
    }

    if (tripId) {
      const [existing] = await db
        .select({ id: fuelLogs.id })
        .from(fuelLogs)
        .where(eq(fuelLogs.tripId, tripId))
        .limit(1);

      if (existing) {
        throw new Error("Conflict: fuel log already exists for this trip");
      }
    }

    const [inserted] = await db
      .insert(fuelLogs)
      .values({
        vehicleId: vehicle.id,
        tripId,
        liters,
        costInr,
        loggedAt,
        notes,
        createdByUserId: actor.id,
      })
      .returning({ id: fuelLogs.id });

    if (!inserted) {
      throw new Error("Failed to create fuel log");
    }

    const [row] = await db
      .select(fuelSelect)
      .from(fuelLogs)
      .innerJoin(vehicles, eq(fuelLogs.vehicleId, vehicles.id))
      .where(eq(fuelLogs.id, inserted.id))
      .limit(1);

    if (!row) {
      throw new Error("Fuel log not found");
    }

    return { log: mapFuelRow(row) };
  }

  static async listExpenses(headers: Headers) {
    const actor = await requireSessionUser(headers);
    assertFuelExpenseReadRole(actor.role);

    const rows = await getDb()
      .select(expenseSelect)
      .from(expenses)
      .innerJoin(vehicles, eq(expenses.vehicleId, vehicles.id))
      .innerJoin(expenseCategories, eq(expenses.expenseCategoryId, expenseCategories.id))
      .orderBy(desc(expenses.incurredOn), desc(expenses.id));

    return { items: rows.map(mapExpenseRow) };
  }

  static async createExpense(headers: Headers, body: CreateExpenseInput) {
    const actor = await requireSessionUser(headers);
    assertFuelExpenseWriteRole(actor.role);

    if (!body.vehicleId?.trim()) {
      throw new Error("vehicleId is required");
    }

    if (!body.expenseCategoryId?.trim()) {
      throw new Error("expenseCategoryId is required");
    }

    const amountInr = normalizePositiveAmount(body.amountInr, "amountInr");
    const incurredOn = normalizeDateOnly(body.incurredOn, "incurredOn");
    const description = body.description?.trim() ? body.description.trim() : null;
    const tripId = body.tripId?.trim() ? body.tripId.trim() : null;

    const db = getDb();

    const [vehicle] = await db
      .select({ id: vehicles.id, deletedAt: vehicles.deletedAt })
      .from(vehicles)
      .where(eq(vehicles.id, body.vehicleId))
      .limit(1);

    if (!vehicle || vehicle.deletedAt) {
      throw new Error("Vehicle not found");
    }

    const [category] = await db
      .select({
        id: expenseCategories.id,
        code: expenseCategories.code,
      })
      .from(expenseCategories)
      .where(
        and(
          eq(expenseCategories.id, body.expenseCategoryId),
          eq(expenseCategories.isActive, true),
          isNull(expenseCategories.deletedAt),
        ),
      )
      .limit(1);

    if (!category) {
      throw new Error("Expense category not found");
    }

    assertAllowedExpenseCategoryCode(category.code);

    const [inserted] = await db
      .insert(expenses)
      .values({
        vehicleId: vehicle.id,
        expenseCategoryId: category.id,
        tripId,
        amountInr,
        incurredOn,
        description,
        createdByUserId: actor.id,
      })
      .returning({ id: expenses.id });

    if (!inserted) {
      throw new Error("Failed to create expense");
    }

    const [row] = await db
      .select(expenseSelect)
      .from(expenses)
      .innerJoin(vehicles, eq(expenses.vehicleId, vehicles.id))
      .innerJoin(expenseCategories, eq(expenses.expenseCategoryId, expenseCategories.id))
      .where(eq(expenses.id, inserted.id))
      .limit(1);

    if (!row) {
      throw new Error("Expense not found");
    }

    return { expense: mapExpenseRow(row) };
  }

  /**
   * Other expenses board: per vehicle rollup of toll/misc/fine + **closed** maintenance linked.
   * Maintenance is never written into `expenses` (ADR-045).
   */
  static async listOtherExpenseRows(headers: Headers): Promise<{ items: OtherExpenseRow[] }> {
    const actor = await requireSessionUser(headers);
    assertFuelExpenseReadRole(actor.role);

    const db = getDb();

    const vehicleRows = await db
      .select({
        id: vehicles.id,
        registrationNumber: vehicles.registrationNumber,
        nameModel: vehicles.nameModel,
        status: vehicles.status,
      })
      .from(vehicles)
      .where(isNull(vehicles.deletedAt))
      .orderBy(vehicles.registrationNumber);

    const expenseRows = await db
      .select({
        vehicleId: expenses.vehicleId,
        categoryCode: expenseCategories.code,
        amountInr: expenses.amountInr,
        tripId: expenses.tripId,
      })
      .from(expenses)
      .innerJoin(expenseCategories, eq(expenses.expenseCategoryId, expenseCategories.id));

    // Closed maintenance only for MAINT. (LINKED) display (ADR-045).
    const maintRows = await db
      .select({
        vehicleId: maintenanceLogs.vehicleId,
        costInr: maintenanceLogs.costInr,
      })
      .from(maintenanceLogs)
      .where(eq(maintenanceLogs.status, "closed"));

    return {
      items: rollupOtherExpenseRows(vehicleRows, expenseRows, maintRows),
    };
  }

  static async getSummary(headers: Headers): Promise<OperationalSummary> {
    const actor = await requireSessionUser(headers);
    assertFuelExpenseReadRole(actor.role);

    const db = getDb();

    const [fuelAgg] = await db
      .select({
        totalCost: sql<string>`coalesce(sum(${fuelLogs.costInr}), 0)`,
        totalLiters: sql<string>`coalesce(sum(${fuelLogs.liters}), 0)`,
      })
      .from(fuelLogs);

    // Op cost includes all maintenance costs (open + closed) per ADR-044.
    const [maintAgg] = await db
      .select({ total: sql<string>`coalesce(sum(${maintenanceLogs.costInr}), 0)` })
      .from(maintenanceLogs);

    const [expenseAgg] = await db
      .select({ total: sql<string>`coalesce(sum(${expenses.amountInr}), 0)` })
      .from(expenses);

    const [distanceAgg] = await db
      .select({
        totalDistance: sql<string>`coalesce(sum(${trips.actualDistanceKm}), 0)`,
      })
      .from(trips)
      .where(and(eq(trips.status, "completed"), isNull(trips.deletedAt)));

    const fuelTotal = Number(fuelAgg?.totalCost ?? 0);
    const fuelLiters = Number(fuelAgg?.totalLiters ?? 0);
    const maintenanceTotal = Number(maintAgg?.total ?? 0);
    const expensesTotal = Number(expenseAgg?.total ?? 0);
    const totalDistance = Number(distanceAgg?.totalDistance ?? 0);
    const efficiency = computeFuelEfficiencyKmPerL(totalDistance, fuelLiters);

    return {
      expensesTotalInr: moneyToFixed(expensesTotal),
      fuelEfficiencyKmPerL: efficiencyToFixed(efficiency),
      fuelTotalInr: moneyToFixed(fuelTotal),
      fuelTotalLiters: moneyToFixed(fuelLiters),
      maintenanceTotalInr: moneyToFixed(maintenanceTotal),
      operationalCostInr: moneyToFixed(computeOperationalCostInr(fuelTotal, maintenanceTotal)),
      totalDistanceKm: moneyToFixed(totalDistance),
    };
  }

  static async listCategories(headers: Headers) {
    const actor = await requireSessionUser(headers);
    assertFuelExpenseReadRole(actor.role);

    const items = await getDb()
      .select({
        id: expenseCategories.id,
        code: expenseCategories.code,
        name: expenseCategories.name,
      })
      .from(expenseCategories)
      .where(and(eq(expenseCategories.isActive, true), isNull(expenseCategories.deletedAt)))
      .orderBy(expenseCategories.code);

    return {
      items: items.filter((item) => {
        try {
          assertAllowedExpenseCategoryCode(item.code);
          return true;
        } catch {
          return false;
        }
      }),
    };
  }

  static async listVehicles(headers: Headers) {
    const actor = await requireSessionUser(headers);
    assertFuelExpenseReadRole(actor.role);

    const items = await getDb()
      .select({
        id: vehicles.id,
        registrationNumber: vehicles.registrationNumber,
        nameModel: vehicles.nameModel,
        status: vehicles.status,
      })
      .from(vehicles)
      .where(isNull(vehicles.deletedAt))
      .orderBy(vehicles.registrationNumber);

    return { items };
  }
}
