import { describe, expect, test } from "bun:test";

import { FORBIDDEN_MESSAGE } from "@/lib/api/http-errors";
import {
  assertCanViewVehicles,
  assertCanWriteVehicles,
  canViewVehicles,
  canWriteVehicles,
} from "@/modules/vehicles/_lib/rbac";

describe("vehicle RBAC failure modes", () => {
  test("safety_officer cannot view fleet", () => {
    expect(canViewVehicles("safety_officer")).toBe(false);
    expect(() => assertCanViewVehicles("safety_officer")).toThrow(FORBIDDEN_MESSAGE);
  });

  test("dispatcher cannot write fleet", () => {
    expect(canWriteVehicles("dispatcher")).toBe(false);
    expect(() => assertCanWriteVehicles("dispatcher")).toThrow(FORBIDDEN_MESSAGE);
  });

  test("financial_analyst cannot write fleet", () => {
    expect(canWriteVehicles("financial_analyst")).toBe(false);
    expect(() => assertCanWriteVehicles("financial_analyst")).toThrow(FORBIDDEN_MESSAGE);
  });

  test("safety_officer cannot write fleet", () => {
    expect(canWriteVehicles("safety_officer")).toBe(false);
    expect(() => assertCanWriteVehicles("safety_officer")).toThrow(FORBIDDEN_MESSAGE);
  });
});

describe("vehicle RBAC allow modes", () => {
  test("fleet_manager can view and write", () => {
    expect(canViewVehicles("fleet_manager")).toBe(true);
    expect(canWriteVehicles("fleet_manager")).toBe(true);
  });

  test("dispatcher and finance can view only", () => {
    expect(canViewVehicles("dispatcher")).toBe(true);
    expect(canViewVehicles("financial_analyst")).toBe(true);
  });
});
