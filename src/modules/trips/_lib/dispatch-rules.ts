import type { DispatchDriver, DispatchVehicle } from "@/modules/trips/_types/dispatch";

export function assertVehicleDispatchable(vehicle: DispatchVehicle): void {
  if (vehicle.status === "retired" || vehicle.status === "in_shop") {
    throw new Error("Vehicle is not available for dispatch");
  }

  if (vehicle.status === "on_trip") {
    throw new Error("Vehicle is already on trip");
  }

  if (vehicle.status !== "available") {
    throw new Error("Vehicle is not available for dispatch");
  }
}

export function assertDriverAssignable(driver: DispatchDriver, todayIsoDate: string): void {
  if (driver.status !== "available") {
    throw new Error("Driver is not available for dispatch");
  }

  if (driver.licenseExpiryDate < todayIsoDate) {
    throw new Error("Driver license is expired");
  }
}

export function assertCargoWithinCapacity(cargoWeightKg: number, maxLoadCapacityKg: number): void {
  if (cargoWeightKg <= 0) {
    throw new Error("Cargo weight must be greater than zero");
  }

  if (cargoWeightKg > maxLoadCapacityKg) {
    throw new Error("Cargo weight exceeds vehicle capacity");
  }
}

export function assertEndOdometerValid(
  endOdometerKm: number,
  startOdometerKm: number,
  currentVehicleOdometerKm: number,
): void {
  if (endOdometerKm < startOdometerKm) {
    throw new Error("End odometer must be greater than or equal to start odometer");
  }

  if (endOdometerKm < currentVehicleOdometerKm) {
    throw new Error("End odometer must be greater than or equal to current vehicle odometer");
  }
}

export function assertPositiveFuel(liters: number, costInr: number): void {
  if (liters <= 0) {
    throw new Error("Fuel liters must be greater than zero");
  }

  if (costInr < 0) {
    throw new Error("Fuel cost cannot be negative");
  }
}

export function assertTripExpensesPresent(expenseCount: number): void {
  if (expenseCount <= 0) {
    throw new Error("At least one trip expense is required to complete the trip");
  }
}
