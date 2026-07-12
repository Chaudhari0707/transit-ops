/** Short human-readable trip code from UUID (e.g. TR-A1B2). */
export function formatTripCode(id: string): string {
  const compact = id.replace(/-/g, "").toUpperCase();

  if (compact.length < 4) {
    return `TR-${compact || "????"}`;
  }

  return `TR-${compact.slice(0, 4)}`;
}

/** Default recent trips page size for the dashboard. */
export const RECENT_TRIPS_DEFAULT_LIMIT = 8;

export function clampRecentTripsLimit(limit: number | undefined): number {
  if (limit === undefined) {
    return RECENT_TRIPS_DEFAULT_LIMIT;
  }

  if (!Number.isFinite(limit) || limit < 1) {
    throw new Error("Recent trips limit must be at least 1");
  }

  if (limit > 50) {
    throw new Error("Recent trips limit cannot exceed 50");
  }

  return Math.floor(limit);
}
