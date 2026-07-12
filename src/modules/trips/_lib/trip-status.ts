import type { TripStatus } from "@/modules/trips/_types/trip";

export function canEditTrip(status: TripStatus): boolean {
  return status === "draft";
}

export function canDispatchTrip(status: TripStatus): boolean {
  return status === "draft";
}

export function canCancelTrip(status: TripStatus): boolean {
  return status === "draft" || status === "dispatched";
}

export function canCompleteTrip(status: TripStatus): boolean {
  return status === "dispatched";
}
