import type { TripStatus } from "@/modules/dashboard/_types/dashboard";

/** Assume ~40 km/h average for ETA estimate from planned distance. */
const AVG_SPEED_KMH = 40;

/**
 * Derive a display ETA label for recent trips.
 * No persisted ETA field — estimate from status + planned distance.
 */
export function formatTripEtaLabel(status: TripStatus, plannedDistanceKm: number): string {
  if (status === "completed" || status === "cancelled") {
    return "—";
  }

  if (status === "draft") {
    return "Awaiting dispatch";
  }

  if (!Number.isFinite(plannedDistanceKm) || plannedDistanceKm <= 0) {
    return "En route";
  }

  const minutes = Math.max(1, Math.round((plannedDistanceKm / AVG_SPEED_KMH) * 60));

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;

  if (rem === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${rem}m`;
}
