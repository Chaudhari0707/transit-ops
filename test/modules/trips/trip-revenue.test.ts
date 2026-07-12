import { describe, expect, test } from "bun:test";

import {
  calculateTripRevenueInr,
  calculateVehicleRoiPct,
  REVENUE_RATE_INR_PER_KM_KG,
} from "@/lib/constants/revenue";
import { buildTripRevenueSnapshot } from "@/modules/trips/_lib/trip-revenue";

describe("calculateTripRevenueInr", () => {
  test("computes planned_km × capacity_kg × rate", () => {
    // Truck-12 seed: 164 km × 9000 kg × 0.05 = 73_800
    expect(calculateTripRevenueInr(164, 9000)).toBe(73800);
  });

  test("rounds money to 2 decimal places", () => {
    // 10.5 × 100.25 × 0.0333 = 35.049… → 35.05
    expect(calculateTripRevenueInr(10.5, 100.25, 0.0333)).toBe(35.05);
  });

  test("rejects non-positive inputs", () => {
    expect(() => calculateTripRevenueInr(0, 1000)).toThrow("Planned distance");
    expect(() => calculateTripRevenueInr(10, 0)).toThrow("Capacity");
    expect(() => calculateTripRevenueInr(10, 1000, 0)).toThrow("Revenue rate");
  });
});

describe("buildTripRevenueSnapshot", () => {
  test("snapshots rate and amount for revenue_logs", () => {
    const snap = buildTripRevenueSnapshot(312, 10000);
    expect(snap.plannedDistanceKm).toBe(312);
    expect(snap.capacityKg).toBe(10000);
    expect(snap.rateInrPerKmKg).toBe(REVENUE_RATE_INR_PER_KM_KG);
    expect(snap.amountInr).toBe(156000);
  });
});

describe("calculateVehicleRoiPct", () => {
  test("returns (revenue − op cost) / acquisition × 100", () => {
    // revenue 100_000, op cost 20_000, acquisition 800_000 → 10%
    expect(calculateVehicleRoiPct(100_000, 20_000, 800_000)).toBe(10);
  });

  test("returns null when acquisition cost is zero", () => {
    expect(calculateVehicleRoiPct(10_000, 1_000, 0)).toBeNull();
  });
});
