export type SeedTripRow = {
  actualDistanceKm?: string;
  cargoWeightKg: string;
  completedOn?: string;
  destinationLocationCode: string;
  dispatchedOn?: string;
  driverFullName: string;
  endOdometerKm?: string;
  expenseAmountInr?: string;
  expenseCategoryCode?: string;
  fuelConsumedLiters?: string;
  fuelCostInr?: string;
  plannedDistanceKm: string;
  seedKey: string;
  sourceLocationCode: string;
  startOdometerKm?: string;
  status: SeedTripStatus;
  vehicleNameModel: string;
};

export type SeedTripStatus = "draft" | "dispatched" | "completed";
