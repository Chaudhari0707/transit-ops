import { describe, expect, test } from "bun:test";

import {
  formatVehicleOptionLabel,
  resolvedSelectValue,
  sortVehiclesByCapacity,
} from "@/app/trips/_lib/trip-form-helpers";

describe("trip form vehicle helpers", () => {
  test("formatVehicleOptionLabel includes registration, model, and max capacity", () => {
    const label = formatVehicleOptionLabel({
      id: "vehicle-1",
      maxLoadCapacityKg: "1200.00",
      nameModel: "Tata 407",
      odometerKm: "10000.00",
      registrationNumber: "GJ-01-VA-1005",
      status: "available",
    });

    expect(label).toContain("GJ-01-VA-1005");
    expect(label).toContain("Tata 407");
    expect(label).toContain("1,200 kg");
    expect(label).toContain("max");
  });

  test("sortVehiclesByCapacity orders vehicles from smallest to largest capacity", () => {
    const sorted = sortVehiclesByCapacity([
      {
        id: "large",
        maxLoadCapacityKg: "9000.00",
        nameModel: "Truck",
        odometerKm: "1",
        registrationNumber: "GJ-LG",
        status: "available",
      },
      {
        id: "small",
        maxLoadCapacityKg: "500.00",
        nameModel: "Van",
        odometerKm: "1",
        registrationNumber: "GJ-SM",
        status: "available",
      },
    ]);

    expect(sorted.map((vehicle) => vehicle.id)).toEqual(["small", "large"]);
  });
});

describe("resolvedSelectValue", () => {
  test("returns null while label is unresolved so UUID is never shown", () => {
    expect(resolvedSelectValue("a1b2c3d4-uuid", undefined)).toBeNull();
    expect(resolvedSelectValue("a1b2c3d4-uuid", null)).toBeNull();
    expect(resolvedSelectValue("a1b2c3d4-uuid", "")).toBeNull();
  });

  test("returns null for empty id", () => {
    expect(resolvedSelectValue("", "Mehsana Factory")).toBeNull();
  });

  test("returns id once label is resolved", () => {
    expect(resolvedSelectValue("loc-1", "Mehsana Factory")).toBe("loc-1");
  });
});
