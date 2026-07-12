export type AnalyticsReportUi = {
  costliestVehicles: CostliestVehicleUi[];
  monthlyRevenue: MonthlyRevenuePointUi[];
  summary: AnalyticsSummaryUi;
};

export type AnalyticsSummaryUi = {
  fleetUtilizationPercent: string;
  fuelEfficiencyKmPerL: string | null;
  fuelTotalInr: string;
  fuelTotalLiters: string;
  maintenanceTotalInr: string;
  monthlyRevenueInr: string;
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
