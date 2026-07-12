export type AnalyticsReport = {
  costliestVehicles: CostliestVehicle[];
  monthlyRevenue: MonthlyRevenuePoint[];
  summary: AnalyticsSummary;
};

export type AnalyticsSummary = {
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

export type CostliestVehicle = {
  acquisitionCostInr: string;
  fuelCostInr: string;
  maintenanceCostInr: string;
  operationalCostInr: string;
  vehicleId: string;
  vehicleNameModel: string;
  vehicleRegistration: string;
};

export type MonthlyRevenuePoint = {
  label: string;
  revenueInr: string;
  yearMonth: string;
};
