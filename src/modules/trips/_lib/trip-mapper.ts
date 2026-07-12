import type { locations, trips } from "@/lib/db/schema";
import type { TripRecord } from "@/modules/trips/_types/trip";

type LocationRow = Pick<typeof locations.$inferSelect, "id" | "code" | "name">;

export function toTripRecord(
  trip: typeof trips.$inferSelect,
  sourceLocation: LocationRow,
  destinationLocation: LocationRow,
): TripRecord {
  return {
    actualDistanceKm: trip.actualDistanceKm,
    cancelledAt: trip.cancelledAt?.toISOString() ?? null,
    cancelReason: trip.cancelReason,
    cargoWeightKg: trip.cargoWeightKg,
    completedAt: trip.completedAt?.toISOString() ?? null,
    createdAt: trip.createdAt.toISOString(),
    createdByUserId: trip.createdByUserId,
    destinationLocation: {
      code: destinationLocation.code,
      id: destinationLocation.id,
      name: destinationLocation.name,
    },
    dispatchedAt: trip.dispatchedAt?.toISOString() ?? null,
    driverId: trip.driverId,
    endOdometerKm: trip.endOdometerKm,
    fuelConsumedLiters: trip.fuelConsumedLiters,
    fuelCostInr: trip.fuelCostInr,
    id: trip.id,
    plannedDistanceKm: trip.plannedDistanceKm,
    sourceLocation: {
      code: sourceLocation.code,
      id: sourceLocation.id,
      name: sourceLocation.name,
    },
    startOdometerKm: trip.startOdometerKm,
    status: trip.status,
    updatedAt: trip.updatedAt.toISOString(),
    vehicleId: trip.vehicleId,
  };
}
