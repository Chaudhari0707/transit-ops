export type AnalyticsReport = {
  costBreakdown: CostBreakdown;
  costliestVehicles: CostliestVehicle[];
  monthlyRevenue: MonthlyRevenuePoint[];
  summary: AnalyticsSummary;
  tripCounts: TripCounts;
  vehicleRoiTable: VehicleRoiRow[];
};

export type AnalyticsSummary = {
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

export type CostBreakdown = {
  expensesTotalInr: string;
  fuelTotalInr: string;
  maintenanceTotalInr: string;
  operationalCostInr: string;
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

export type TripCounts = {
  cancelled: number;
  completed: number;
  dispatched: number;
  draft: number;
  total: number;
};

export type VehicleRoiRow = {
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
