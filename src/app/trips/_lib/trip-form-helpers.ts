import type { CargoCapacityAlert, CreateTripFormValues } from "@/app/trips/_types/trip-form";
import type { AssignableVehicleRecord } from "@/modules/trips/_types/assignable";
import type { TripRecord } from "@/modules/trips/_types/trip";

export const emptyCreateTripForm = (): CreateTripFormValues => ({
  cargoWeightKg: "",
  destinationLocationId: "",
  driverId: "",
  plannedDistanceKm: "",
  sourceLocationId: "",
  vehicleId: "",
});

export function getCargoCapacityAlert(
  cargoWeightKg: string,
  maxLoadCapacityKg: string | undefined,
): CargoCapacityAlert | null {
  if (!maxLoadCapacityKg || cargoWeightKg.trim() === "") {
    return null;
  }

  const cargoKg = Number(cargoWeightKg);
  const capacityKg = Number(maxLoadCapacityKg);

  if (!Number.isFinite(cargoKg) || !Number.isFinite(capacityKg) || cargoKg <= capacityKg) {
    return null;
  }

  const exceededByKg = cargoKg - capacityKg;

  return {
    capacityKg,
    cargoKg,
    exceededByKg,
    summary: `Vehicle Capacity ${capacityKg} kg · Cargo Weight ${cargoKg} kg`,
    message: `Capacity exceeded by ${exceededByKg} kg — dispatch blocked`,
  };
}

export function getCargoCapacityError(
  cargoWeightKg: string,
  maxLoadCapacityKg: string | undefined,
): string | null {
  return getCargoCapacityAlert(cargoWeightKg, maxLoadCapacityKg)?.message ?? null;
}

export function formatVehicleCapacityKg(maxLoadCapacityKg: string): string {
  const capacityKg = Number(maxLoadCapacityKg);

  if (!Number.isFinite(capacityKg)) {
    return maxLoadCapacityKg;
  }

  return `${capacityKg.toLocaleString("en-IN")} kg`;
}

export function formatVehicleOptionLabel(vehicle: AssignableVehicleRecord): string {
  return `${vehicle.registrationNumber} · ${vehicle.nameModel} · ${formatVehicleCapacityKg(vehicle.maxLoadCapacityKg)} max`;
}

/**
 * Base UI Select falls back to the raw value (UUID) when items are still loading.
 * Only bind the select value once the matching option label is resolved.
 */
export function resolvedSelectValue(
  id: string,
  resolvedLabel: string | null | undefined,
): string | null {
  if (!id || !resolvedLabel) {
    return null;
  }

  return id;
}

export function sortVehiclesByCapacity(
  vehicles: AssignableVehicleRecord[],
): AssignableVehicleRecord[] {
  return [...vehicles].sort(
    (left, right) => Number(left.maxLoadCapacityKg) - Number(right.maxLoadCapacityKg),
  );
}

export function formatRouteLabel(sourceName: string, destinationName: string): string {
  return `${sourceName} → ${destinationName}`;
}

export function formatTripDisplayId(trip: TripRecord, index: number): string {
  const suffix = trip.id.replace(/-/g, "").slice(0, 3).toUpperCase();
  return `TR${suffix || String(index + 1).padStart(3, "0")}`;
}

export function getTripBoardSubtitle(trip: TripRecord): string | null {
  if (trip.status === "draft" && !trip.driverId) {
    return "Awaiting driver";
  }

  if (trip.status === "cancelled") {
    return trip.cancelReason ?? "Unassigned";
  }

  if (trip.status === "draft") {
    return "Awaiting dispatch";
  }

  return null;
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function tripToFormValues(trip: TripRecord): CreateTripFormValues {
  return {
    cargoWeightKg: trip.cargoWeightKg,
    destinationLocationId: trip.destinationLocation.id,
    driverId: trip.driverId,
    plannedDistanceKm: trip.plannedDistanceKm,
    sourceLocationId: trip.sourceLocation.id,
    vehicleId: trip.vehicleId,
  };
}

export function isTripFormEditable(status: TripRecord["status"]): boolean {
  return status === "draft";
}
