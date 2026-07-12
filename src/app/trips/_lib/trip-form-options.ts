import type {
  AssignableDriverRecord,
  AssignableVehicleRecord,
} from "@/modules/trips/_types/assignable";
import type { TripRecord } from "@/modules/trips/_types/trip";

export function mergeVehicleOptions(
  vehicles: AssignableVehicleRecord[],
  trip: TripRecord | null,
): AssignableVehicleRecord[] {
  if (!trip) {
    return vehicles;
  }

  if (vehicles.some((vehicle) => vehicle.id === trip.vehicleId)) {
    return vehicles;
  }

  return [
    ...vehicles,
    {
      id: trip.vehicle.id,
      maxLoadCapacityKg: trip.vehicle.maxLoadCapacityKg,
      nameModel: trip.vehicle.nameModel,
      odometerKm: trip.startOdometerKm ?? "0",
      registrationNumber: trip.vehicle.registrationNumber,
      status: "available",
    },
  ];
}

export function mergeDriverOptions(
  drivers: AssignableDriverRecord[],
  trip: TripRecord | null,
): AssignableDriverRecord[] {
  if (!trip) {
    return drivers;
  }

  if (drivers.some((driver) => driver.id === trip.driverId)) {
    return drivers;
  }

  return [
    ...drivers,
    {
      contactNumber: "",
      fullName: trip.driver.fullName,
      id: trip.driver.id,
      licenseExpiryDate: "2099-12-31",
      licenseNumber: "—",
      safetyScore: 100,
      status: "available",
    },
  ];
}
