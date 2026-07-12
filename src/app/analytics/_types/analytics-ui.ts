export type AnalyticsReportUi = {
  costBreakdown: CostBreakdownUi;
  costliestVehicles: CostliestVehicleUi[];
  monthlyRevenue: MonthlyRevenuePointUi[];
  summary: AnalyticsSummaryUi;
  tripCounts: TripCountsUi;
  vehicleRoiTable: VehicleRoiRowUi[];
};

export type AnalyticsSummaryUi = {
  expensesTotalInr: string;
  fleetUtilizationPercent: string;
  fuelEfficiencyKmPerL: string | null;
  fuelTotalInr: string;
  fuelTotalLiters: string;
  maintenanceTotalInr: string;
  monthlyRevenueInr: string;
  netMarginInr: string;
  operationalCostInr: string;
  roiFormula: string;
  totalAcquisitionCostInr: string;
  totalDistanceKm: string;
  vehicleCounts: {
    available: number;
    inShop: number;
    onTrip: number;
    retired: number;
  };
  vehicleRoiPercent: string | null;
};

export type CostBreakdownUi = {
  expensesTotalInr: string;
  fuelTotalInr: string;
  maintenanceTotalInr: string;
  operationalCostInr: string;
};

export type CostliestVehicleUi = {
  acquisitionCostInr: string;
  fuelCostInr: string;
  maintenanceCostInr: string;
  operationalCostInr: string;
  vehicleId: string;
  vehicleNameModel: string;
  vehicleRegistration: string;
};

export type MonthlyRevenuePointUi = {
  label: string;
  revenueInr: string;
  yearMonth: string;
};

export type TripCountsUi = {
  cancelled: number;
  completed: number;
  dispatched: number;
  draft: number;
  total: number;
};

export type VehicleRoiRowUi = {
  acquisitionCostInr: string;
  fuelCostInr: string;
  maintenanceCostInr: string;
  netInr: string;
  operationalCostInr: string;
  revenueInr: string;
  roiPercent: string | null;
  vehicleId: string;
  vehicleNameModel: string;
  vehicleRegistration: string;
};
