export type TripDriverSummary = {
  fullName: string;
  id: string;
};

export type TripLocationSummary = {
  code: string;
  id: string;
  name: string;
};

export type TripRecord = {
  actualDistanceKm: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  cargoWeightKg: string;
  completedAt: string | null;
  createdAt: string;
  createdByUserId: string;
  destinationLocation: TripLocationSummary;
  dispatchedAt: string | null;
  driver: TripDriverSummary;
  driverId: string;
  endOdometerKm: string | null;
  fuelConsumedLiters: string | null;
  fuelCostInr: string | null;
  id: string;
  plannedDistanceKm: string;
  sourceLocation: TripLocationSummary;
  startOdometerKm: string | null;
  status: TripStatus;
  updatedAt: string;
  vehicle: TripVehicleSummary;
  vehicleId: string;
};

export type TripStatus = "draft" | "dispatched" | "completed" | "cancelled";

export type TripVehicleSummary = {
  id: string;
  maxLoadCapacityKg: string;
  nameModel: string;
  registrationNumber: string;
};
