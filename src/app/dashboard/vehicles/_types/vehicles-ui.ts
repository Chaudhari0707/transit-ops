export type VehicleStatus = "available" | "on_trip" | "in_shop" | "retired";

export type VehicleTypeOption = {
  id: string;
  code: string;
  name: string;
};

export type VehicleListItem = {
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

export type VehiclesPageClientProps = {
  vehicleTypes: VehicleTypeOption[];
  canWrite: boolean;
};
