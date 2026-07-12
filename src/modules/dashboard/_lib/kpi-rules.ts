import type {
  DashboardKpis,
  TripStatusCounts,
  VehicleStatusCounts,
} from "@/modules/dashboard/_types/dashboard";

/** Active vehicles = all non-retired, non-deleted (ADR-035). */
export function computeActiveVehicles(counts: VehicleStatusCounts): number {
  return counts.available + counts.on_trip + counts.in_shop;
}

/**
 * Fleet utilization % = on_trip / (available + on_trip + in_shop) × 100.
 * Retired vehicles are excluded from the denominator.
 * Returns 0 when there are no operational vehicles.
 */
export function computeFleetUtilizationPercent(counts: VehicleStatusCounts): number {
  const operational = counts.available + counts.on_trip + counts.in_shop;

  if (operational <= 0) {
    return 0;
  }

  return Math.round((counts.on_trip / operational) * 100);
}

export function buildDashboardKpis(input: {
  driversOnDuty: number;
  tripCounts: TripStatusCounts;
  vehicleCounts: VehicleStatusCounts;
}): DashboardKpis {
  const { vehicleCounts, tripCounts, driversOnDuty } = input;

  if (driversOnDuty < 0) {
    throw new Error("Drivers on duty count cannot be negative");
  }

  for (const [key, value] of Object.entries(vehicleCounts)) {
    if (value < 0) {
      throw new Error(`Vehicle status count for ${key} cannot be negative`);
    }
  }

  for (const [key, value] of Object.entries(tripCounts)) {
    if (value < 0) {
      throw new Error(`Trip status count for ${key} cannot be negative`);
    }
  }

  return {
    activeTrips: tripCounts.dispatched,
    activeVehicles: computeActiveVehicles(vehicleCounts),
    availableVehicles: vehicleCounts.available,
    driversOnDuty,
    fleetUtilizationPercent: computeFleetUtilizationPercent(vehicleCounts),
    pendingTrips: tripCounts.draft,
    vehiclesInMaintenance: vehicleCounts.in_shop,
    vehicleStatus: { ...vehicleCounts },
  };
}

export function emptyVehicleStatusCounts(): VehicleStatusCounts {
  return { available: 0, in_shop: 0, on_trip: 0, retired: 0 };
}

export function emptyTripStatusCounts(): TripStatusCounts {
  return { cancelled: 0, completed: 0, dispatched: 0, draft: 0 };
}
