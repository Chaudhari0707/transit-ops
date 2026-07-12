export type VehicleRecord = {
  acquisitionCostInr: number;
  createdAt: string;
  createdByUserId: string | null;
  id: string;
  maxLoadCapacityKg: number;
  nameModel: string;
  notes: string | null;
  odometerKm: number;
  registrationNumber: string;
  status: VehicleStatus;
  updatedAt: string;
  vehicleTypeId: string;
};

export type VehicleStatus = "available" | "in_shop" | "on_trip" | "retired";
