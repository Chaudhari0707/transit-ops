import type { VehicleFormParsed } from "@/app/dashboard/vehicles/_lib/vehicle-schema";
import type {
  VehicleListItem,
  VehicleStatus,
  VehicleTypeOption,
} from "@/app/dashboard/vehicles/_types/vehicles-ui";

export const VEHICLE_STATUS_OPTIONS: Array<{ value: VehicleStatus; label: string }> = [
  { value: "available", label: "Available" },
  { value: "on_trip", label: "On Trip" },
  { value: "in_shop", label: "In Shop" },
  { value: "retired", label: "Retired" },
];

export const VEHICLE_STATUS_LABEL: Record<VehicleStatus, string> = {
  available: "Available",
  on_trip: "On Trip",
  in_shop: "In Shop",
  retired: "Retired",
};

export const VEHICLE_STATUS_CLASS: Record<VehicleStatus, string> = {
  available: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  on_trip: "bg-primary/15 text-primary",
  in_shop: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  retired: "bg-muted text-muted-foreground",
};

export function typeLabel(
  types: VehicleTypeOption[],
  vehicleTypeId: string,
): string {
  const match = types.find((type) => type.id === vehicleTypeId);
  return match ? `${match.name} (${match.code})` : "Unknown type";
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatKm(km: number): string {
  return `${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 }).format(km)} km`;
}

export function toCreateBody(values: VehicleFormParsed) {
  return {
    registrationNumber: values.registrationNumber,
    nameModel: values.nameModel,
    vehicleTypeId: values.vehicleTypeId,
    maxLoadCapacityKg: values.maxLoadCapacityKg,
    odometerKm: values.odometerKm,
    acquisitionCostInr: values.acquisitionCostInr,
    notes: values.notes?.trim() ? values.notes.trim() : null,
  };
}

export function toUpdateBody(values: VehicleFormParsed) {
  return {
    registrationNumber: values.registrationNumber,
    nameModel: values.nameModel,
    vehicleTypeId: values.vehicleTypeId,
    maxLoadCapacityKg: values.maxLoadCapacityKg,
    odometerKm: values.odometerKm,
    acquisitionCostInr: values.acquisitionCostInr,
    notes: values.notes?.trim() ? values.notes.trim() : null,
  };
}

export function vehicleToFormDefaults(vehicle: VehicleListItem): {
  registrationNumber: string;
  nameModel: string;
  vehicleTypeId: string;
  maxLoadCapacityKg: number;
  odometerKm: number;
  acquisitionCostInr: number;
  notes: string;
} {
  return {
    registrationNumber: vehicle.registrationNumber,
    nameModel: vehicle.nameModel,
    vehicleTypeId: vehicle.vehicleTypeId,
    maxLoadCapacityKg: vehicle.maxLoadCapacityKg,
    odometerKm: vehicle.odometerKm,
    acquisitionCostInr: vehicle.acquisitionCostInr,
    notes: vehicle.notes ?? "",
  };
}

export function emptyVehicleFormDefaults(defaultTypeId: string) {
  return {
    registrationNumber: "",
    nameModel: "",
    vehicleTypeId: defaultTypeId,
    maxLoadCapacityKg: 1000,
    odometerKm: 0,
    acquisitionCostInr: 0,
    notes: "",
  };
}

export function parseApiError(payload: unknown, fallback: string): string {
  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    return payload.message;
  }

  return fallback;
}
