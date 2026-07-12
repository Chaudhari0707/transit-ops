import { z } from "zod";

export const createTripSchema = z
  .object({
    sourceLocationId: z.string().min(1, "Select a source location"),
    destinationLocationId: z.string().min(1, "Select a destination location"),
    vehicleId: z.string().min(1, "Select a vehicle"),
    driverId: z.string().min(1, "Select a driver"),
    cargoWeightKg: z.coerce.number().positive("Cargo must be greater than zero"),
    plannedDistanceKm: z.coerce.number().positive("Planned distance must be greater than zero"),
  })
  .refine((values) => values.sourceLocationId !== values.destinationLocationId, {
    message: "Source and destination must be different",
    path: ["destinationLocationId"],
  });

export const completeTripSchema = z.object({
  endOdometerKm: z.coerce.number().nonnegative("End odometer cannot be negative"),
  fuelLiters: z.coerce.number().positive("Fuel liters must be greater than zero"),
  fuelCostInr: z.coerce.number().nonnegative("Fuel cost cannot be negative"),
  expenseCategoryId: z.string().min(1, "Select an expense category"),
  expenseAmountInr: z.coerce.number().positive("Expense amount must be greater than zero"),
  expenseDescription: z.string().max(500).optional(),
});
