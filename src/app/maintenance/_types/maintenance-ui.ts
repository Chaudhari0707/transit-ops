export type MaintenanceFormState = {
  costInr: string;
  /** Free-text service name when type code is OTHER. */
  customServiceType: string;
  description: string;
  maintenanceTypeId: string;
  vehicleId: string;
  vendorName: string;
};

export type MaintenanceLogUi = {
  completedAt: string | null;
  costInr: string;
  description: string | null;
  id: number;
  maintenanceTypeCode: string;
  maintenanceTypeId: string;
  maintenanceTypeName: string;
  nextDueOdometerKm: string | null;
  odometerAtServiceKm: string | null;
  startedAt: string;
  status: "closed" | "open";
  vehicleId: string;
  vehicleNameModel: string;
  vehicleRegistration: string;
  vehicleStatus: "available" | "in_shop" | "on_trip" | "retired";
  vendorName: string | null;
};

export type MaintenanceTypeOption = {
  code: string;
  id: string;
  name: string;
};

export type MaintenanceVehicleOption = {
  id: string;
  nameModel: string;
  odometerKm: string;
  registrationNumber: string;
  status: "available" | "in_shop" | "on_trip" | "retired";
};
