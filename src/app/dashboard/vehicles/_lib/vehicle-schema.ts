import { z } from "zod";

import { normalizeRegistration } from "@/modules/vehicles/_lib/registration";

const registrationPattern = /^[A-Z0-9][A-Z0-9\- ]{1,30}[A-Z0-9]$/;

export const vehicleFormSchema = z.object({
  registrationNumber: z
    .string()
    .trim()
    .min(3, "Registration number must be at least 3 characters")
    .max(32, "Registration number must be at most 32 characters")
    .transform(normalizeRegistration)
    .refine((value) => registrationPattern.test(value), {
      message: "Registration number format is invalid",
    }),
  nameModel: z.string().trim().min(1, "Name/model is required").max(160),
  vehicleTypeId: z.string().uuid("Select a vehicle type"),
  maxLoadCapacityKg: z.coerce
    .number({ error: "Capacity is required" })
    .positive("Capacity must be greater than 0"),
  odometerKm: z.coerce
    .number({ error: "Odometer is required" })
    .min(0, "Odometer must be 0 or greater"),
  acquisitionCostInr: z.coerce
    .number({ error: "Acquisition cost is required" })
    .min(0, "Acquisition cost must be 0 or greater"),
  notes: z.string().max(2000).optional(),
});

export type VehicleFormValues = z.input<typeof vehicleFormSchema>;
export type VehicleFormParsed = z.output<typeof vehicleFormSchema>;
