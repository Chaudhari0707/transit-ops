import type { TripStatus } from "@/modules/trips/_types/trip";

export type CargoCapacityAlert = {
  capacityKg: number;
  cargoKg: number;
  exceededByKg: number;
  message: string;
  summary: string;
};

export type CompleteTripFormValues = {
  endOdometerKm: string;
  expenseAmountInr: string;
  expenseCategoryId: string;
  expenseDescription: string;
  fuelCostInr: string;
  fuelLiters: string;
};

export type CreateTripFormValues = {
  cargoWeightKg: string;
  destinationLocationId: string;
  driverId: string;
  plannedDistanceKm: string;
  sourceLocationId: string;
  vehicleId: string;
};

export type ExpenseCategoryOption = {
  code: string;
  id: string;
  name: string;
};

export type TripFormSession = { kind: "new" } | { kind: "trip"; tripId: string };

export type TripStatusFilter = TripStatus | "all";
