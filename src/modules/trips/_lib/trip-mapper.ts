import type { drivers, locations, trips, vehicles } from "@/lib/db/schema";
import type { TripRecord } from "@/modules/trips/_types/trip";

type LocationRow = Pick<typeof locations.$inferSelect, "id" | "code" | "name">;
type VehicleRow = Pick<
  typeof vehicles.$inferSelect,
  "id" | "maxLoadCapacityKg" | "nameModel" | "registrationNumber"
>;
type DriverRow = Pick<typeof drivers.$inferSelect, "id" | "fullName">;

export function toTripRecord(
  trip: typeof trips.$inferSelect,
  sourceLocation: LocationRow,
  destinationLocation: LocationRow,
  vehicle: VehicleRow,
  driver: DriverRow,
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
    driver: {
      fullName: driver.fullName,
      id: driver.id,
    },
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
    vehicle: {
      id: vehicle.id,
      maxLoadCapacityKg: vehicle.maxLoadCapacityKg,
      nameModel: vehicle.nameModel,
      registrationNumber: vehicle.registrationNumber,
    },
    vehicleId: trip.vehicleId,
  };
}
