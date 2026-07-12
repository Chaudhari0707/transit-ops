import { describe, expect, test } from "bun:test";

import {
  emptyVehicleFormDefaults,
  formatInr,
  parseApiError,
  typeLabel,
  toCreateBody,
} from "@/app/dashboard/vehicles/_lib/vehicle-helpers";
import { vehicleFormSchema } from "@/app/dashboard/vehicles/_lib/vehicle-schema";

const typeId = "11111111-1111-4111-8111-111111111111";

describe("vehicleFormSchema failure modes", () => {
  test("rejects short registration", () => {
    const result = vehicleFormSchema.safeParse({
      ...emptyVehicleFormDefaults(typeId),
      registrationNumber: "AB",
    });
    expect(result.success).toBe(false);
  });

  test("rejects zero capacity", () => {
    const result = vehicleFormSchema.safeParse({
      ...emptyVehicleFormDefaults(typeId),
      registrationNumber: "GJ-01-VA-9999",
      maxLoadCapacityKg: 0,
    });
    expect(result.success).toBe(false);
  });

  test("rejects negative odometer", () => {
    const result = vehicleFormSchema.safeParse({
      ...emptyVehicleFormDefaults(typeId),
      registrationNumber: "GJ-01-VA-9999",
      odometerKm: -1,
    });
    expect(result.success).toBe(false);
  });
});

describe("vehicleFormSchema allow modes", () => {
  test("normalizes registration and accepts valid payload", () => {
    const result = vehicleFormSchema.safeParse({
      registrationNumber: "  gj-01-va-9999  ",
      nameModel: "Test Van",
      vehicleTypeId: typeId,
      maxLoadCapacityKg: "1200",
      odometerKm: "10",
      acquisitionCostInr: "500000",
      notes: "",
    });
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.registrationNumber).toBe("GJ-01-VA-9999");
      expect(result.data.maxLoadCapacityKg).toBe(1200);
      expect(toCreateBody(result.data).notes).toBeNull();
    }
  });
});

describe("vehicle helpers", () => {
  test("typeLabel falls back for unknown ids", () => {
    expect(typeLabel([{ id: typeId, code: "VAN", name: "Van" }], "missing")).toBe(
      "Unknown type",
    );
  });

  test("formatInr uses INR currency", () => {
    const formatted = formatInr(850000);
    expect(formatted.includes("₹") || formatted.includes("INR")).toBe(true);
    expect(formatted.includes("8")).toBe(true);
  });

  test("parseApiError reads message", () => {
    expect(parseApiError({ message: "Forbidden" }, "fallback")).toBe("Forbidden");
    expect(parseApiError(null, "fallback")).toBe("fallback");
  });
});
