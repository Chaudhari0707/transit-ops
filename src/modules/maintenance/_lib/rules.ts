import { FORBIDDEN_MESSAGE } from "@/lib/api/http-errors";
import type { UserRole } from "@/lib/auth/_types/user-role";
import type {
  MaintenanceVehicleStatus,
  OpenMaintenanceInput,
} from "@/modules/maintenance/_types/maintenance";

/** RBAC: Fleet Manager write; Financial Analyst view costs only. */
export function assertMaintenanceReadRole(role: UserRole): void {
  if (role !== "fleet_manager" && role !== "financial_analyst") {
    throw new Error(FORBIDDEN_MESSAGE);
  }
}

export function assertMaintenanceWriteRole(role: UserRole): void {
  if (role !== "fleet_manager") {
    throw new Error(FORBIDDEN_MESSAGE);
  }
}

/**
 * BR-10 / BR-15 / status machine: open only from available;
 * not on_trip, not retired, not already in_shop.
 */
export function openMaintenanceBlockedReason(vehicle: {
  deletedAt: Date | null;
  status: MaintenanceVehicleStatus;
}): string | null {
  if (vehicle.deletedAt !== null) {
    return "Vehicle not found";
  }

  if (vehicle.status === "retired") {
    return "Cannot open maintenance on a retired vehicle";
  }

  if (vehicle.status === "on_trip") {
    return "Cannot open maintenance while vehicle is on trip";
  }

  if (vehicle.status === "in_shop") {
    return "Conflict: vehicle already has an open maintenance";
  }

  if (vehicle.status !== "available") {
    return "Vehicle must be available to open maintenance";
  }

  return null;
}

/** BR-11: close open log only. */
export function closeMaintenanceBlockedReason(log: { status: "open" | "closed" }): string | null {
  if (log.status !== "open") {
    return "Maintenance log is already closed";
  }

  return null;
}

/** After close → available unless vehicle is retired. */
export function vehicleStatusAfterClose(
  vehicleStatus: MaintenanceVehicleStatus,
): "available" | "retired" {
  return vehicleStatus === "retired" ? "retired" : "available";
}

/** Cost ≥ 0 (schema check + BR feed into op cost, not expenses). */
export function normalizeCostInr(costInr: number | string | undefined): string {
  if (costInr === undefined || costInr === null || costInr === "") {
    return "0.00";
  }

  const value = typeof costInr === "number" ? costInr : Number(costInr);

  if (!Number.isFinite(value)) {
    throw new Error("costInr must be a valid number");
  }

  if (value < 0) {
    throw new Error("costInr must be greater than or equal to 0");
  }

  return value.toFixed(2);
}

export function normalizeOptionalKm(
  value: number | string | null | undefined,
  fieldName: string,
): string | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(`${fieldName} must be a valid number`);
  }

  if (parsed < 0) {
    throw new Error(`${fieldName} must be greater than or equal to 0`);
  }

  return parsed.toFixed(1);
}

export const OTHER_MAINTENANCE_TYPE_CODE = "OTHER";

/**
 * When service type is OTHER, require a free-text custom label and store it
 * in description (optionally with extra notes).
 */
export function resolveDescriptionForOpen(input: {
  customServiceType?: string | null;
  description?: string | null;
  maintenanceTypeCode: string;
}): string | null {
  const notes = input.description?.trim() ? input.description.trim() : null;
  const isOther = input.maintenanceTypeCode.toUpperCase() === OTHER_MAINTENANCE_TYPE_CODE;

  if (!isOther) {
    return notes;
  }

  const custom = input.customServiceType?.trim() ?? "";

  if (custom.length === 0) {
    throw new Error("customServiceType is required when service type is Other");
  }

  if (custom.length > 120) {
    throw new Error("customServiceType must be at most 120 characters");
  }

  return notes ? `${custom} — ${notes}` : custom;
}

export function validateOpenBody(input: OpenMaintenanceInput): {
  costInr: string;
  description: string | null;
  nextDueOdometerKm: string | null;
  odometerAtServiceKm: string | null;
  vendorName: string | null;
} {
  if (!input.vehicleId?.trim()) {
    throw new Error("vehicleId is required");
  }

  if (!input.maintenanceTypeId?.trim()) {
    throw new Error("maintenanceTypeId is required");
  }

  const vendorName = input.vendorName?.trim() ? input.vendorName.trim().slice(0, 160) : null;
  // Description resolved after type code is known in the service layer.
  const description = input.description?.trim() ? input.description.trim() : null;

  return {
    costInr: normalizeCostInr(input.costInr),
    description,
    nextDueOdometerKm: normalizeOptionalKm(input.nextDueOdometerKm, "nextDueOdometerKm"),
    odometerAtServiceKm: normalizeOptionalKm(input.odometerAtServiceKm, "odometerAtServiceKm"),
    vendorName,
  };
}
