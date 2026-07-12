import type { UserRole } from "@/lib/auth/_types/user-role";

/** Fleet RBAC for vehicles (docs/architecture/05-rbac-matrix.md). */

export function canViewVehicles(role: UserRole): boolean {
  return role === "fleet_manager" || role === "dispatcher" || role === "financial_analyst";
}

export function canWriteVehicles(role: UserRole): boolean {
  return role === "fleet_manager";
}

export function assertCanViewVehicles(role: UserRole): void {
  if (!canViewVehicles(role)) {
    throw new Error("Forbidden");
  }
}

export function assertCanWriteVehicles(role: UserRole): void {
  if (!canWriteVehicles(role)) {
    throw new Error("Forbidden");
  }
}
