import { calculateTripRevenueInr, REVENUE_RATE_INR_PER_KM_KG } from "@/lib/constants/revenue";
import type { TripRevenueSnapshot } from "@/modules/trips/_types/revenue";

/** Build the immutable snapshot written to revenue_logs on trip complete. */
export function buildTripRevenueSnapshot(
  plannedDistanceKm: number,
  capacityKg: number,
  rateInrPerKmKg: number = REVENUE_RATE_INR_PER_KM_KG,
): TripRevenueSnapshot {
  return {
    amountInr: calculateTripRevenueInr(plannedDistanceKm, capacityKg, rateInrPerKmKg),
    capacityKg,
    plannedDistanceKm,
    rateInrPerKmKg,
  };
}
