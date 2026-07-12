import type { z } from "zod";

import type { vehicleFormSchema } from "@/app/dashboard/vehicles/_lib/vehicle-schema";

export type VehicleFormParsed = z.output<typeof vehicleFormSchema>;
export type VehicleFormValues = z.input<typeof vehicleFormSchema>;

export type VehicleListItem = {
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

export type VehiclesPageClientProps = {
  canWrite: boolean;
  vehicleTypes: VehicleTypeOption[];
};

export type VehicleStatus = "available" | "in_shop" | "on_trip" | "retired";

export type VehicleTypeOption = {
  code: string;
  id: string;
  name: string;
};
