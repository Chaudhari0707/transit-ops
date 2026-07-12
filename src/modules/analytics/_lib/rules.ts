import type { UserRole } from "@/lib/auth/_types/user-role";

/**
 * Demo monthly revenue for ROI (ADR-050).
 * Not persisted — real revenue source is deferred (OQ-01).
 */
export const STATIC_DEMO_MONTHLY_REVENUE_INR = 400_000;

/** Months of static demo revenue series for the analytics chart. */
export const DEMO_REVENUE_MONTH_COUNT = 8;

/**
 * Analytics deep screen: Fleet Manager + Financial Analyst (RBAC matrix).
 * Dashboard KPI tiles remain open to all authenticated roles elsewhere.
 */
export function assertAnalyticsReadRole(role: UserRole): void {
  if (role !== "fleet_manager" && role !== "financial_analyst") {
    throw new Error("Forbidden");
  }
}

/**
 * Operational cost (ADR-044) — same definition as fuel-expenses:
 * fuel + maintenance only (toll/misc excluded).
 */
export function computeOperationalCostInr(fuelCostInr: number, maintenanceCostInr: number): number {
  const fuel = Number.isFinite(fuelCostInr) ? Math.max(0, fuelCostInr) : 0;
  const maint = Number.isFinite(maintenanceCostInr) ? Math.max(0, maintenanceCostInr) : 0;
  return fuel + maint;
}

/**
 * Fuel efficiency (km/L):
 * SUM(actual_distance_km) / SUM(fuel_logs.liters)
 * Returns null when liters is zero / missing.
 */
export function computeFuelEfficiencyKmPerL(
  totalDistanceKm: number,
  totalFuelLiters: number,
): number | null {
  const distance = Number.isFinite(totalDistanceKm) ? Math.max(0, totalDistanceKm) : 0;
  const liters = Number.isFinite(totalFuelLiters) ? totalFuelLiters : 0;

  if (liters <= 0) {
    return null;
  }

  return distance / liters;
}

/**
 * Fleet utilization % (schema metrics):
 * (on_trip / (available + on_trip + in_shop)) × 100 — retired excluded.
 */
export function computeFleetUtilizationPercent(counts: {
  available: number;
  inShop: number;
  onTrip: number;
}): number {
  const available = Math.max(0, counts.available);
  const onTrip = Math.max(0, counts.onTrip);
  const inShop = Math.max(0, counts.inShop);
  const denominator = available + onTrip + inShop;

  if (denominator <= 0) {
    return 0;
  }

  return (onTrip / denominator) * 100;
}

/**
 * Vehicle / fleet ROI % (PDF §3.8):
 * (Revenue − (Maintenance + Fuel)) / Acquisition Cost × 100
 * Revenue is static demo for v1 (ADR-050).
 * Returns null when acquisition cost is zero.
 */
export function computeVehicleRoiPercent(params: {
  acquisitionCostInr: number;
  fuelCostInr: number;
  maintenanceCostInr: number;
  revenueInr: number;
}): number | null {
  const acquisition = Number.isFinite(params.acquisitionCostInr)
    ? Math.max(0, params.acquisitionCostInr)
    : 0;

  if (acquisition <= 0) {
    return null;
  }

  const opCost = computeOperationalCostInr(params.fuelCostInr, params.maintenanceCostInr);
  const revenue = Number.isFinite(params.revenueInr) ? params.revenueInr : 0;

  return ((revenue - opCost) / acquisition) * 100;
}

/** Round helper for display strings. */
export function roundTo(value: number, digits: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function moneyToFixed(value: number): string {
  return (Number.isFinite(value) ? value : 0).toFixed(2);
}

export function percentToFixed(value: number, digits = 1): string {
  return roundTo(value, digits).toFixed(digits);
}

export function efficiencyToFixed(value: number | null, digits = 1): string | null {
  if (value === null || !Number.isFinite(value)) {
    return null;
  }

  return roundTo(value, digits).toFixed(digits);
}

/**
 * Deterministic demo monthly revenue series for the bar chart (ADR-050).
 * Varied slightly month-to-month so the chart is not flat; not real bookings.
 */
export function buildDemoMonthlyRevenueSeries(
  baseRevenueInr: number,
  monthCount = DEMO_REVENUE_MONTH_COUNT,
  referenceDate: Date = new Date(),
): Array<{ label: string; revenueInr: string; yearMonth: string }> {
  const base = Number.isFinite(baseRevenueInr) && baseRevenueInr > 0 ? baseRevenueInr : 0;
  const count = Math.max(1, Math.min(24, monthCount));
  const items: Array<{ label: string; revenueInr: string; yearMonth: string }> = [];

  // Slight multipliers so the chart has visual variance (static, not from DB).
  const multipliers = [0.82, 0.9, 0.88, 0.95, 0.92, 1.0, 1.08, 1.05, 0.98, 1.12, 1.1, 1.15];

  for (let i = count - 1; i >= 0; i -= 1) {
    const date = new Date(
      Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth() - i, 1),
    );
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth(); // 0-based
    const yearMonth = `${year}-${String(month + 1).padStart(2, "0")}`;
    const label = date.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
    const mult = multipliers[month] ?? 1;
    const revenue = roundTo(base * mult, 2);

    items.push({
      label,
      yearMonth,
      revenueInr: moneyToFixed(revenue),
    });
  }

  return items;
}

/** Build a simple CSV string for analytics export (no external deps). */
export function buildAnalyticsCsv(params: {
  costliest: ReadonlyArray<{
    operationalCostInr: string;
    vehicleRegistration: string;
  }>;
  fuelEfficiencyKmPerL: string | null;
  fleetUtilizationPercent: string;
  operationalCostInr: string;
  vehicleRoiPercent: string | null;
}): string {
  const lines = [
    "metric,value",
    `fuel_efficiency_km_per_l,${params.fuelEfficiencyKmPerL ?? ""}`,
    `fleet_utilization_percent,${params.fleetUtilizationPercent}`,
    `operational_cost_inr,${params.operationalCostInr}`,
    `vehicle_roi_percent,${params.vehicleRoiPercent ?? ""}`,
    "",
    "vehicle_registration,operational_cost_inr",
    ...params.costliest.map((row) => `${row.vehicleRegistration},${row.operationalCostInr}`),
  ];

  return `${lines.join("\n")}\n`;
}
