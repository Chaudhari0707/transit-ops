import { describe, expect, test } from "bun:test";

import {
  calculateTripRevenueInr,
  calculateVehicleRoiPct,
  REVENUE_RATE_INR_PER_KM_KG,
} from "@/lib/constants/revenue";

describe("calculateTripRevenueInr ADR-056", () => {
  test("planned_km × capacity × rate", () => {
    // 164 km × 9000 kg × 0.05 = 73800
    expect(calculateTripRevenueInr(164, 9000)).toBe(73_800);
  });

  test("rejects non-positive inputs", () => {
    expect(() => calculateTripRevenueInr(0, 1000)).toThrow("Planned distance");
    expect(() => calculateTripRevenueInr(10, 0)).toThrow("Capacity");
  });

  test("default rate is 0.05", () => {
    expect(REVENUE_RATE_INR_PER_KM_KG).toBe(0.05);
  });
});

describe("calculateVehicleRoiPct", () => {
  test("returns null when acquisition is zero", () => {
    expect(calculateVehicleRoiPct(100, 10, 0)).toBeNull();
  });

  test("computes percent", () => {
    expect(calculateVehicleRoiPct(400_000, 34_070, 2_575_000)).toBeCloseTo(14.22, 1);
  });
});
