export type VehicleStatus = "available" | "on_trip" | "in_shop" | "retired";

export type VehicleRecord = {
  id: string;
  registrationNumber: string;
  nameModel: string;
  vehicleTypeId: string;
  maxLoadCapacityKg: number;
  odometerKm: number;
  acquisitionCostInr: number;
  status: VehicleStatus;
  notes: string | null;
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
};
