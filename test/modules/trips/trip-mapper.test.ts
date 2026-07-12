import { describe, expect, test } from "bun:test";

import { toTripRecord } from "@/modules/trips/_lib/trip-mapper";

describe("toTripRecord", () => {
  test("maps vehicle max load capacity onto trip responses", () => {
    const createdAt = new Date("2026-07-12T08:00:00.000Z");
    const updatedAt = new Date("2026-07-12T08:05:00.000Z");

    const record = toTripRecord(
      {
        actualDistanceKm: null,
        cancelReason: null,
        cancelledAt: null,
        cargoWeightKg: "700.00",
        completedAt: null,
        createdAt,
        createdByUserId: "user-1",
        deletedAt: null,
        destinationLocationId: "dest-1",
        dispatchedAt: null,
        driverId: "driver-1",
        endOdometerKm: null,
        fuelConsumedLiters: null,
        fuelCostInr: null,
        id: "trip-1",
        plannedDistanceKm: "120.00",
        sourceLocationId: "source-1",
        startOdometerKm: null,
        status: "draft",
        updatedAt,
        vehicleId: "vehicle-1",
      },
      { code: "AHM", id: "source-1", name: "Ahmedabad Hub" },
      { code: "SUR", id: "dest-1", name: "Surat Hub" },
      {
        id: "vehicle-1",
        maxLoadCapacityKg: "500.00",
        nameModel: "Tata 407",
        registrationNumber: "GJ-01-VA-1005",
      },
      { fullName: "Ravi Patel", id: "driver-1" },
    );

    expect(record.vehicle.maxLoadCapacityKg).toBe("500.00");
  });
});
