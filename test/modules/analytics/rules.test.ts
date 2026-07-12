import { describe, expect, test } from "bun:test";

import {
  assertAnalyticsReadRole,
  buildAnalyticsCsv,
  buildDemoMonthlyRevenueSeries,
  buildMonthlyRevenueSeriesFromLogs,
  computeFleetUtilizationPercent,
  computeFuelEfficiencyKmPerL,
  computeOperationalCostInr,
  computeVehicleRoiPercent,
  efficiencyToFixed,
  STATIC_DEMO_MONTHLY_REVENUE_INR,
} from "@/modules/analytics/_lib/rules";

describe("assertAnalyticsReadRole", () => {
  test("rejects dispatcher", () => {
    expect(() => assertAnalyticsReadRole("dispatcher")).toThrow("Forbidden");
  });

  test("rejects safety officer", () => {
    expect(() => assertAnalyticsReadRole("safety_officer")).toThrow("Forbidden");
  });

  test("allows fleet manager and financial analyst", () => {
    expect(() => assertAnalyticsReadRole("fleet_manager")).not.toThrow();
    expect(() => assertAnalyticsReadRole("financial_analyst")).not.toThrow();
  });
});

describe("computeOperationalCostInr ADR-044", () => {
  test("fuel + maintenance only", () => {
    expect(computeOperationalCostInr(13600, 18000)).toBe(31600);
  });

  test("floors negatives to zero", () => {
    expect(computeOperationalCostInr(-50, 100)).toBe(100);
  });
});

describe("computeFuelEfficiencyKmPerL", () => {
  test("distance / liters", () => {
    expect(computeFuelEfficiencyKmPerL(840, 100)).toBe(8.4);
  });

  test("returns null when liters is zero", () => {
    expect(computeFuelEfficiencyKmPerL(100, 0)).toBeNull();
  });

  test("returns null for non-positive liters", () => {
    expect(computeFuelEfficiencyKmPerL(100, -1)).toBeNull();
  });
});

describe("computeFleetUtilizationPercent", () => {
  test("on_trip over active fleet", () => {
    // 8 on trip / (10 available + 8 on trip + 2 in shop) = 40%
    expect(computeFleetUtilizationPercent({ available: 10, onTrip: 8, inShop: 2 })).toBe(40);
  });

  test("returns 0 when no active vehicles", () => {
    expect(computeFleetUtilizationPercent({ available: 0, onTrip: 0, inShop: 0 })).toBe(0);
  });
});

describe("computeVehicleRoiPercent PDF §3.8", () => {
  test("uses (revenue - op cost) / acquisition", () => {
    // (400000 - 34070) / 2575000 ≈ 14.22
    const roi = computeVehicleRoiPercent({
      revenueInr: 400_000,
      fuelCostInr: 16_000,
      maintenanceCostInr: 18_070,
      acquisitionCostInr: 2_575_000,
    });
    expect(roi).not.toBeNull();
    expect(roi!).toBeCloseTo(14.22, 1);
  });

  test("returns null when acquisition is zero", () => {
    expect(
      computeVehicleRoiPercent({
        revenueInr: 100,
        fuelCostInr: 10,
        maintenanceCostInr: 10,
        acquisitionCostInr: 0,
      }),
    ).toBeNull();
  });
});

describe("demo revenue series", () => {
  test("returns requested month count with static base", () => {
    const series = buildDemoMonthlyRevenueSeries(STATIC_DEMO_MONTHLY_REVENUE_INR, 8);
    expect(series).toHaveLength(8);
    expect(series[0]?.yearMonth).toMatch(/^\d{4}-\d{2}$/);
    expect(Number(series.at(-1)?.revenueInr)).toBeGreaterThan(0);
  });
});

describe("buildMonthlyRevenueSeriesFromLogs ADR-056", () => {
  test("aggregates amounts by earned month", () => {
    const series = buildMonthlyRevenueSeriesFromLogs(
      [
        { amountInr: "1000.00", earnedOn: "2026-05-18" },
        { amountInr: "500.00", earnedOn: "2026-05-20" },
        { amountInr: "2000.00", earnedOn: "2026-07-02" },
      ],
      3,
      new Date(Date.UTC(2026, 6, 12)), // July 2026
    );

    expect(series).toHaveLength(3);
    const may = series.find((m) => m.yearMonth === "2026-05");
    const jun = series.find((m) => m.yearMonth === "2026-06");
    const jul = series.find((m) => m.yearMonth === "2026-07");
    expect(may?.revenueInr).toBe("1500.00");
    expect(jun?.revenueInr).toBe("0.00");
    expect(jul?.revenueInr).toBe("2000.00");
  });
});

describe("buildAnalyticsCsv", () => {
  test("includes kpi rows and costliest vehicles", () => {
    const csv = buildAnalyticsCsv({
      fuelEfficiencyKmPerL: "8.4",
      fleetUtilizationPercent: "81.0",
      operationalCostInr: "34070.00",
      vehicleRoiPercent: "14.2",
      costliest: [
        { vehicleRegistration: "TRUCK-11", operationalCostInr: "12000.00" },
        { vehicleRegistration: "MINI-03", operationalCostInr: "8000.00" },
      ],
    });

    expect(csv).toContain("fuel_efficiency_km_per_l,8.4");
    expect(csv).toContain("TRUCK-11,12000.00");
    expect(csv).toContain("MINI-03,8000.00");
  });
});

describe("efficiencyToFixed", () => {
  test("formats and nulls", () => {
    expect(efficiencyToFixed(8.44)).toBe("8.4");
    expect(efficiencyToFixed(null)).toBeNull();
  });
});
