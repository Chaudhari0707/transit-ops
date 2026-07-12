import { apiJson } from "@/lib/api/fetch-api";
import type { LocationRecord } from "@/modules/locations/_types/location";
import type {
  AssignableDriverRecord,
  AssignableVehicleRecord,
} from "@/modules/trips/_types/assignable";
import type { TripRecord, TripStatus } from "@/modules/trips/_types/trip";

export async function signIn(username: string, password: string) {
  return apiJson<{ token: string; username: string }>("/api/auth/sign-in", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function listLocations() {
  return apiJson<{ locations: LocationRecord[] }>("/api/locations");
}

export async function listAssignableVehicles() {
  return apiJson<{ vehicles: AssignableVehicleRecord[] }>("/api/trips/assignables/vehicles");
}

export async function listAssignableDrivers() {
  return apiJson<{ drivers: AssignableDriverRecord[] }>("/api/trips/assignables/drivers");
}

export async function listTrips(status?: TripStatus) {
  const query = status ? `?status=${status}` : "";
  return apiJson<{ trips: TripRecord[] }>(`/api/trips${query}`);
}

export async function updateTrip(
  tripId: string,
  input: {
    sourceLocationId: string;
    destinationLocationId: string;
    vehicleId: string;
    driverId: string;
    cargoWeightKg: number;
    plannedDistanceKm: number;
  },
) {
  return apiJson<{ trip: TripRecord }>(`/api/trips/${tripId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function createTrip(input: {
  sourceLocationId: string;
  destinationLocationId: string;
  vehicleId: string;
  driverId: string;
  cargoWeightKg: number;
  plannedDistanceKm: number;
}) {
  return apiJson<{ trip: TripRecord }>("/api/trips", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function dispatchTrip(tripId: string) {
  return apiJson<{ trip: TripRecord }>(`/api/trips/${tripId}/dispatch`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function cancelTrip(tripId: string, cancelReason?: string) {
  return apiJson<{ trip: TripRecord }>(`/api/trips/${tripId}/cancel`, {
    method: "POST",
    body: JSON.stringify({ cancelReason }),
  });
}

export async function completeTrip(
  tripId: string,
  input: {
    endOdometerKm: number;
    fuelLiters: number;
    fuelCostInr: number;
    expenses: Array<{
      expenseCategoryId: string;
      amountInr: number;
      incurredOn: string;
      description?: string;
    }>;
  },
) {
  return apiJson<{ trip: TripRecord }>(`/api/trips/${tripId}/complete`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
