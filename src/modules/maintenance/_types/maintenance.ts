import type { UnwrapSchema } from "elysia";

import type { MaintenanceModel as MaintenanceModelValue } from "@/modules/maintenance/model";

export type CloseMaintenanceInput = {
  costInr?: number | string;
  description?: string | null;
  nextDueOdometerKm?: number | string | null;
  odometerAtServiceKm?: number | string | null;
  vendorName?: string | null;
};

export type MaintenanceLogListItem = {
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
  vehicleStatus: MaintenanceVehicleStatus;
  vendorName: string | null;
};

export type MaintenanceModel = {
  [K in keyof typeof MaintenanceModelValue]: UnwrapSchema<(typeof MaintenanceModelValue)[K]>;
};

export type MaintenanceVehicleStatus = "available" | "in_shop" | "on_trip" | "retired";

export type OpenMaintenanceInput = {
  costInr?: number | string;
  /** Required when maintenance type code is OTHER — free-text service label. */
  customServiceType?: string | null;
  description?: string | null;
  maintenanceTypeId: string;
  nextDueOdometerKm?: number | string | null;
  odometerAtServiceKm?: number | string | null;
  vehicleId: string;
  vendorName?: string | null;
};
