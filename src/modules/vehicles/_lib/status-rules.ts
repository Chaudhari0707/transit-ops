import type { VehicleStatus } from "@/modules/vehicles/_types/vehicles";

/** Statuses that trip/maintenance modules own — not free-form via registry API. */
const MODULE_OWNED_STATUSES = new Set<VehicleStatus>(["on_trip", "in_shop"]);

export function assertCanRetire(currentStatus: VehicleStatus): void {
  if (currentStatus === "on_trip") {
    throw new Error("Cannot retire a vehicle while on trip");
  }

  if (currentStatus === "retired") {
    throw new Error("Vehicle is already retired");
  }
}

export function assertCanSoftDelete(currentStatus: VehicleStatus): void {
  if (currentStatus === "on_trip") {
    throw new Error("Cannot delete a vehicle while on trip");
  }
}

/**
 * Registry API may only set `retired` manually.
 * `on_trip` / `in_shop` are owned by trip and maintenance modules.
 */
export function assertRegistryStatusChange(
  currentStatus: VehicleStatus,
  nextStatus: VehicleStatus,
): void {
  if (currentStatus === nextStatus) {
    return;
  }

  if (MODULE_OWNED_STATUSES.has(nextStatus)) {
    throw new Error("Cannot set vehicle status to on_trip or in_shop via registry API");
  }

  if (nextStatus === "retired") {
    assertCanRetire(currentStatus);
    return;
  }

  if (currentStatus === "retired") {
    throw new Error("Cannot change status of a retired vehicle");
  }

  throw new Error("Invalid vehicle status transition");
}
