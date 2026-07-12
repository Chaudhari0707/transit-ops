/**
 * Fleet-wide freight rate (ADR-056 / ADR-046).
 * Not a Settings table — single app constant for hackathon v1.
 * Unit: INR earned per planned kilometre per kilogram of vehicle capacity.
 */
export const REVENUE_RATE_INR_PER_KM_KG = 0.05;

/**
 * Trip revenue = planned_distance_km × capacity_kg × rate.
 * Capacity is vehicle max load capacity (what the company sells), not cargo weight.
 */
export function calculateTripRevenueInr(
  plannedDistanceKm: number,
  capacityKg: number,
  rateInrPerKmKg: number = REVENUE_RATE_INR_PER_KM_KG,
): number {
  if (plannedDistanceKm <= 0) {
    throw new Error("Planned distance must be greater than zero");
  }

  if (capacityKg <= 0) {
    throw new Error("Capacity must be greater than zero");
  }

  if (rateInrPerKmKg <= 0) {
    throw new Error("Revenue rate must be greater than zero");
  }

  const amount = plannedDistanceKm * capacityKg * rateInrPerKmKg;
  return Math.round(amount * 100) / 100;
}

/**
 * Vehicle ROI % = (total revenue − op cost) / acquisition cost × 100.
 * Op cost = fuel + maintenance (ADR-044). Returns null when acquisition cost is 0.
 */
export function calculateVehicleRoiPct(
  totalRevenueInr: number,
  operationalCostInr: number,
  acquisitionCostInr: number,
): number | null {
  if (acquisitionCostInr <= 0) {
    return null;
  }

  return Math.round(((totalRevenueInr - operationalCostInr) / acquisitionCostInr) * 10000) / 100;
}
