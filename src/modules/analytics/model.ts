import { t } from "elysia";

const vehicleCounts = t.Object({
  available: t.Number(),
  inShop: t.Number(),
  onTrip: t.Number(),
  retired: t.Number(),
});

const summary = t.Object({
  expensesTotalInr: t.String(),
  fleetUtilizationPercent: t.String(),
  fuelEfficiencyKmPerL: t.Union([t.String(), t.Null()]),
  fuelTotalInr: t.String(),
  fuelTotalLiters: t.String(),
  maintenanceTotalInr: t.String(),
  monthlyRevenueInr: t.String(),
  netMarginInr: t.String(),
  operationalCostInr: t.String(),
  roiFormula: t.String(),
  totalAcquisitionCostInr: t.String(),
  totalDistanceKm: t.String(),
  vehicleCounts,
  vehicleRoiPercent: t.Union([t.String(), t.Null()]),
});

const costBreakdown = t.Object({
  expensesTotalInr: t.String(),
  fuelTotalInr: t.String(),
  maintenanceTotalInr: t.String(),
  operationalCostInr: t.String(),
});

const costliestVehicle = t.Object({
  acquisitionCostInr: t.String(),
  fuelCostInr: t.String(),
  maintenanceCostInr: t.String(),
  operationalCostInr: t.String(),
  vehicleId: t.String({ format: "uuid" }),
  vehicleNameModel: t.String(),
  vehicleRegistration: t.String(),
});

const monthlyRevenuePoint = t.Object({
  label: t.String(),
  revenueInr: t.String(),
  yearMonth: t.String(),
});

const tripCounts = t.Object({
  cancelled: t.Number(),
  completed: t.Number(),
  dispatched: t.Number(),
  draft: t.Number(),
  total: t.Number(),
});

const vehicleRoiRow = t.Object({
  acquisitionCostInr: t.String(),
  fuelCostInr: t.String(),
  maintenanceCostInr: t.String(),
  netInr: t.String(),
  operationalCostInr: t.String(),
  revenueInr: t.String(),
  roiPercent: t.Union([t.String(), t.Null()]),
  vehicleId: t.String({ format: "uuid" }),
  vehicleNameModel: t.String(),
  vehicleRegistration: t.String(),
});

export const AnalyticsModel = {
  errorResponse: t.Object({
    message: t.String(),
  }),
  exportResponse: t.Object({
    csv: t.String(),
    filename: t.String(),
  }),
  reportResponse: t.Object({
    costBreakdown,
    costliestVehicles: t.Array(costliestVehicle),
    monthlyRevenue: t.Array(monthlyRevenuePoint),
    summary,
    tripCounts,
    vehicleRoiTable: t.Array(vehicleRoiRow),
  }),
  summaryResponse: summary,
} as const;
