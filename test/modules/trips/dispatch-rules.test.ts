import { describe, expect, test } from "bun:test";

import {
  assertCargoWithinCapacity,
  assertDriverAssignable,
  assertEndOdometerValid,
  assertPositiveFuel,
  assertTripExpensesPresent,
  assertVehicleDispatchable,
} from "@/modules/trips/_lib/dispatch-rules";

const today = "2026-07-12";

describe("assertVehicleDispatchable failures", () => {
  test("rejects in_shop vehicles", () => {
    expect(() => assertVehicleDispatchable({ status: "in_shop", maxLoadCapacityKg: 500 })).toThrow(
      "Vehicle is not available for dispatch",
    );
  });

  test("rejects on_trip vehicles", () => {
    expect(() => assertVehicleDispatchable({ status: "on_trip", maxLoadCapacityKg: 500 })).toThrow(
      "Vehicle is already on trip",
    );
  });
});

describe("assertDriverAssignable failures", () => {
  test("rejects suspended drivers", () => {
    expect(() =>
      assertDriverAssignable({ status: "suspended", licenseExpiryDate: "2030-01-01" }, today),
    ).toThrow("Driver is not available for dispatch");
  });

  test("rejects expired licenses", () => {
    expect(() =>
      assertDriverAssignable({ status: "available", licenseExpiryDate: "2020-01-01" }, today),
    ).toThrow("Driver license is expired");
  });
});

describe("assertCargoWithinCapacity failures", () => {
  test("rejects overweight cargo", () => {
    expect(() => assertCargoWithinCapacity(600, 500)).toThrow(
      "Cargo weight exceeds vehicle capacity",
    );
  });
});

describe("assertEndOdometerValid failures", () => {
  test("rejects end odometer below start", () => {
    expect(() => assertEndOdometerValid(100, 120, 100)).toThrow(
      "End odometer must be greater than or equal to start odometer",
    );
  });
});

describe("complete validation failures", () => {
  test("rejects zero fuel liters", () => {
    expect(() => assertPositiveFuel(0, 100)).toThrow("Fuel liters must be greater than zero");
  });

  test("rejects missing expenses", () => {
    expect(() => assertTripExpensesPresent(0)).toThrow(
      "At least one trip expense is required to complete the trip",
    );
  });
});
