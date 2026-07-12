export type DashboardKpisView = {
  activeTrips: number;
  activeVehicles: number;
  availableVehicles: number;
  driversOnDuty: number;
  fleetUtilizationPercent: number;
  pendingTrips: number;
  vehiclesInMaintenance: number;
  vehicleStatus: {
    available: number;
    in_shop: number;
    on_trip: number;
    retired: number;
  };
};

export type DashboardPageClientProps = {
  initialKpis: DashboardKpisView;
  initialTrips: RecentTripView[];
  vehicleTypes: VehicleTypeOption[];
};

export type RecentTripView = {
  driverName: string;
  etaLabel: string;
  id: string;
  status: "cancelled" | "completed" | "dispatched" | "draft";
  tripCode: string;
  vehicleName: string;
};

export type TripStatusFilter = "all" | "cancelled" | "completed" | "dispatched" | "draft";

export type VehicleTypeOption = {
  code: string;
  id: string;
  name: string;
};
