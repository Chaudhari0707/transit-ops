export type DashboardKpis = {
  activeTrips: number;
  activeVehicles: number;
  availableVehicles: number;
  driversOnDuty: number;
  fleetUtilizationPercent: number;
  pendingTrips: number;
  vehiclesInMaintenance: number;
  vehicleStatus: VehicleStatusCounts;
};

export type RecentTripRow = {
  driverName: string;
  etaLabel: string;
  id: string;
  status: TripStatus;
  tripCode: string;
  vehicleName: string;
};

export type RecentTripsFilters = {
  limit?: number;
  status?: TripStatus;
  vehicleTypeId?: string;
};

export type TripStatus = "cancelled" | "completed" | "dispatched" | "draft";

export type TripStatusCounts = {
  cancelled: number;
  completed: number;
  dispatched: number;
  draft: number;
};

export type VehicleStatus = "available" | "in_shop" | "on_trip" | "retired";

export type VehicleStatusCounts = {
  available: number;
  in_shop: number;
  on_trip: number;
  retired: number;
};
