import { describe, expect, test } from "bun:test";

import { FORBIDDEN_MESSAGE } from "@/lib/api/http-errors";
import {
  assertAllowedExpenseCategoryCode,
  assertFuelExpenseReadRole,
  assertFuelExpenseWriteRole,
  computeOperationalCostInr,
  normalizePositiveAmount,
  normalizePositiveLiters,
  sumClosedMaintenanceLinked,
} from "@/modules/fuel-expenses/_lib/rules";

describe("assertFuelExpenseReadRole", () => {
  test("rejects dispatcher", () => {
    expect(() => assertFuelExpenseReadRole("dispatcher")).toThrow(FORBIDDEN_MESSAGE);
  });

  test("allows finance and fleet manager", () => {
    expect(() => assertFuelExpenseReadRole("financial_analyst")).not.toThrow();
    expect(() => assertFuelExpenseReadRole("fleet_manager")).not.toThrow();
  });
});

describe("assertFuelExpenseWriteRole", () => {
  test("rejects safety officer", () => {
    expect(() => assertFuelExpenseWriteRole("safety_officer")).toThrow(FORBIDDEN_MESSAGE);
  });

  test("allows finance", () => {
    expect(() => assertFuelExpenseWriteRole("financial_analyst")).not.toThrow();
  });
});

describe("assertAllowedExpenseCategoryCode", () => {
  test("rejects maintenance-like codes", () => {
    expect(() => assertAllowedExpenseCategoryCode("MAINTENANCE")).toThrow(
      "Expense category must be TOLL, FINE, or MISC",
    );
  });

  test("allows toll fine misc", () => {
    expect(() => assertAllowedExpenseCategoryCode("TOLL")).not.toThrow();
    expect(() => assertAllowedExpenseCategoryCode("fine")).not.toThrow();
    expect(() => assertAllowedExpenseCategoryCode("MISC")).not.toThrow();
  });
});

describe("computeOperationalCostInr ADR-044", () => {
  test("fuel + maintenance only", () => {
    expect(computeOperationalCostInr(13600, 18000)).toBe(31600);
  });

  test("ignores negative inputs as zero floor", () => {
    expect(computeOperationalCostInr(-10, 100)).toBe(100);
  });
});

describe("sumClosedMaintenanceLinked MAINT. (LINKED)", () => {
  test("sums completed maintenance costs", () => {
    expect(sumClosedMaintenanceLinked(["12400.00", "5600.00"])).toBe(18000);
  });

  test("ignores invalid values", () => {
    expect(sumClosedMaintenanceLinked(["abc", "-1", "100"])).toBe(100);
  });
});

describe("normalize failure modes", () => {
  test("rejects zero liters", () => {
    expect(() => normalizePositiveLiters(0)).toThrow("liters must be greater than 0");
  });

  test("rejects non-positive amount", () => {
    expect(() => normalizePositiveAmount(0, "amountInr")).toThrow(
      "amountInr must be greater than 0",
    );
  });
});
