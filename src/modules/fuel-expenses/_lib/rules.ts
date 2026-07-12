import type { UserRole } from "@/lib/auth/_types/user-role";

/** Mockup screen 6 + RBAC: FA writes; FM/FA can view costs. */
export function assertFuelExpenseReadRole(role: UserRole): void {
  if (role !== "financial_analyst" && role !== "fleet_manager") {
    throw new Error("Forbidden");
  }
}

/**
 * Architecture prefers Financial Analyst as primary writer.
 * Fleet Manager also allowed for demo/bootstrap (single seed admin) until multi-role login UI lands.
 */
export function assertFuelExpenseWriteRole(role: UserRole): void {
  if (role !== "financial_analyst" && role !== "fleet_manager") {
    throw new Error("Forbidden");
  }
}

/** Expense categories allowed in `expenses` — never maintenance (ADR-045). */
const ALLOWED_EXPENSE_CODES = new Set(["TOLL", "FINE", "MISC"]);

export function assertAllowedExpenseCategoryCode(code: string): void {
  const normalized = code.trim().toUpperCase();

  if (!ALLOWED_EXPENSE_CODES.has(normalized)) {
    throw new Error("Expense category must be TOLL, FINE, or MISC (maintenance is not an expense)");
  }
}

export function normalizePositiveAmount(value: number | string, fieldName: string): string {
  const parsed = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(`${fieldName} must be a valid number`);
  }

  if (parsed <= 0) {
    throw new Error(`${fieldName} must be greater than 0`);
  }

  return parsed.toFixed(2);
}

export function normalizeNonNegativeAmount(value: number | string, fieldName: string): string {
  const parsed = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(`${fieldName} must be a valid number`);
  }

  if (parsed < 0) {
    throw new Error(`${fieldName} must be greater than or equal to 0`);
  }

  return parsed.toFixed(2);
}

export function normalizePositiveLiters(value: number | string): string {
  const parsed = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error("liters must be a valid number");
  }

  if (parsed <= 0) {
    throw new Error("liters must be greater than 0");
  }

  return parsed.toFixed(3);
}

export function normalizeDateOnly(value: string, fieldName: string): string {
  const trimmed = value.trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    throw new Error(`${fieldName} must be YYYY-MM-DD`);
  }

  const date = new Date(`${trimmed}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`${fieldName} is not a valid date`);
  }

  return trimmed;
}

/**
 * Operational cost (ADR-044): fuel + maintenance only.
 * Toll/misc expenses are excluded from auto operational total.
 */
export function computeOperationalCostInr(fuelCostInr: number, maintenanceCostInr: number): number {
  const fuel = Number.isFinite(fuelCostInr) ? Math.max(0, fuelCostInr) : 0;
  const maint = Number.isFinite(maintenanceCostInr) ? Math.max(0, maintenanceCostInr) : 0;
  return fuel + maint;
}

/**
 * MAINT. (LINKED) for Other Expenses UI (ADR-045):
 * sum of **closed** maintenance costs for the vehicle — read-only, never written to expenses.
 */
export function sumClosedMaintenanceLinked(costs: ReadonlyArray<number | string>): number {
  let sum = 0;

  for (const raw of costs) {
    const value = typeof raw === "number" ? raw : Number(raw);
    if (Number.isFinite(value) && value > 0) {
      sum += value;
    }
  }

  return sum;
}

export function sumMoney(values: ReadonlyArray<number | string>): number {
  let sum = 0;

  for (const raw of values) {
    const value = typeof raw === "number" ? raw : Number(raw);
    if (Number.isFinite(value)) {
      sum += value;
    }
  }

  return sum;
}

export function moneyToFixed(value: number): string {
  return (Number.isFinite(value) ? value : 0).toFixed(2);
}
