import { describe, expect, test } from "bun:test";

import {
  buildDashboardKpis,
  computeActiveVehicles,
  computeFleetUtilizationPercent,
  emptyTripStatusCounts,
  emptyVehicleStatusCounts,
} from "@/modules/dashboard/_lib/kpi-rules";

describe("computeActiveVehicles", () => {
  test("excludes retired vehicles", () => {
    expect(
      computeActiveVehicles({
        available: 10,
        on_trip: 5,
        in_shop: 2,
        retired: 8,
      }),
    ).toBe(17);
  });

  test("returns 0 when only retired", () => {
    expect(
      computeActiveVehicles({
        available: 0,
        on_trip: 0,
        in_shop: 0,
        retired: 4,
      }),
    ).toBe(0);
  });
});

describe("computeFleetUtilizationPercent", () => {
  test("uses on_trip over operational fleet only", () => {
    // 5 / (10+5+5) = 25%
    expect(
      computeFleetUtilizationPercent({
        available: 10,
        on_trip: 5,
        in_shop: 5,
        retired: 100,
      }),
    ).toBe(25);
  });

  test("returns 0 when no operational vehicles", () => {
    expect(
      computeFleetUtilizationPercent({
        available: 0,
        on_trip: 0,
        in_shop: 0,
        retired: 3,
      }),
    ).toBe(0);
  });

  test("rounds to nearest percent", () => {
    // 1 / 3 ≈ 33.33 → 33
    expect(
      computeFleetUtilizationPercent({
        available: 2,
        on_trip: 1,
        in_shop: 0,
        retired: 0,
      }),
    ).toBe(33);
  });

  test("100% when all operational vehicles are on trip", () => {
    expect(
      computeFleetUtilizationPercent({
        available: 0,
        on_trip: 7,
        in_shop: 0,
        retired: 2,
      }),
    ).toBe(100);
  });
});

describe("buildDashboardKpis failure modes", () => {
  test("rejects negative drivers on duty", () => {
    expect(() =>
      buildDashboardKpis({
        vehicleCounts: emptyVehicleStatusCounts(),
        tripCounts: emptyTripStatusCounts(),
        driversOnDuty: -1,
      }),
    ).toThrow("Drivers on duty count cannot be negative");
  });

  test("rejects negative vehicle status counts", () => {
    expect(() =>
      buildDashboardKpis({
        vehicleCounts: { ...emptyVehicleStatusCounts(), available: -2 },
        tripCounts: emptyTripStatusCounts(),
        driversOnDuty: 0,
      }),
    ).toThrow("Vehicle status count for available cannot be negative");
  });

  test("rejects negative trip status counts", () => {
    expect(() =>
      buildDashboardKpis({
        vehicleCounts: emptyVehicleStatusCounts(),
        tripCounts: { ...emptyTripStatusCounts(), draft: -1 },
        driversOnDuty: 0,
      }),
    ).toThrow("Trip status count for draft cannot be negative");
  });
});

describe("buildDashboardKpis happy path", () => {
  test("maps counts to KPI fields per ODO-32 definitions", () => {
    const kpis = buildDashboardKpis({
      vehicleCounts: {
        available: 42,
        on_trip: 8,
        in_shop: 5,
        retired: 3,
      },
      tripCounts: {
        draft: 9,
        dispatched: 18,
        completed: 40,
        cancelled: 2,
      },
      driversOnDuty: 26,
    });

    expect(kpis.activeVehicles).toBe(55);
    expect(kpis.availableVehicles).toBe(42);
    expect(kpis.vehiclesInMaintenance).toBe(5);
    expect(kpis.activeTrips).toBe(18);
    expect(kpis.pendingTrips).toBe(9);
    expect(kpis.driversOnDuty).toBe(26);
    // 8 / (42+8+5) = 8/55 ≈ 15%
    expect(kpis.fleetUtilizationPercent).toBe(15);
    expect(kpis.vehicleStatus.retired).toBe(3);
  });
});
