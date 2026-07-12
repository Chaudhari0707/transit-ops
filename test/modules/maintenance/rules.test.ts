import { describe, expect, test } from "bun:test";

import {
  assertMaintenanceReadRole,
  assertMaintenanceWriteRole,
  closeMaintenanceBlockedReason,
  normalizeCostInr,
  openMaintenanceBlockedReason,
  resolveDescriptionForOpen,
  validateOpenBody,
  vehicleStatusAfterClose,
} from "@/modules/maintenance/_lib/rules";

describe("assertMaintenanceReadRole failure modes", () => {
  test("rejects dispatcher", () => {
    expect(() => assertMaintenanceReadRole("dispatcher")).toThrow("Forbidden");
  });

  test("rejects safety_officer", () => {
    expect(() => assertMaintenanceReadRole("safety_officer")).toThrow("Forbidden");
  });

  test("allows fleet_manager and financial_analyst", () => {
    expect(() => assertMaintenanceReadRole("fleet_manager")).not.toThrow();
    expect(() => assertMaintenanceReadRole("financial_analyst")).not.toThrow();
  });
});

describe("assertMaintenanceWriteRole failure modes", () => {
  test("rejects financial_analyst (view only)", () => {
    expect(() => assertMaintenanceWriteRole("financial_analyst")).toThrow("Forbidden");
  });

  test("rejects dispatcher", () => {
    expect(() => assertMaintenanceWriteRole("dispatcher")).toThrow("Forbidden");
  });

  test("allows fleet_manager", () => {
    expect(() => assertMaintenanceWriteRole("fleet_manager")).not.toThrow();
  });
});

describe("openMaintenanceBlockedReason (BR-10 / BR-15)", () => {
  test("blocks soft-deleted vehicle", () => {
    expect(openMaintenanceBlockedReason({ status: "available", deletedAt: new Date() })).toBe(
      "Vehicle not found",
    );
  });

  test("blocks retired vehicle", () => {
    expect(openMaintenanceBlockedReason({ status: "retired", deletedAt: null })).toBe(
      "Cannot open maintenance on a retired vehicle",
    );
  });

  test("blocks on_trip vehicle", () => {
    expect(openMaintenanceBlockedReason({ status: "on_trip", deletedAt: null })).toBe(
      "Cannot open maintenance while vehicle is on trip",
    );
  });

  test("blocks already in_shop (one open max)", () => {
    expect(openMaintenanceBlockedReason({ status: "in_shop", deletedAt: null })).toBe(
      "Conflict: vehicle already has an open maintenance",
    );
  });

  test("allows available vehicle", () => {
    expect(openMaintenanceBlockedReason({ status: "available", deletedAt: null })).toBeNull();
  });
});

describe("closeMaintenanceBlockedReason (BR-11)", () => {
  test("blocks already closed log", () => {
    expect(closeMaintenanceBlockedReason({ status: "closed" })).toBe(
      "Maintenance log is already closed",
    );
  });

  test("allows open log", () => {
    expect(closeMaintenanceBlockedReason({ status: "open" })).toBeNull();
  });
});

describe("vehicleStatusAfterClose (BR-11)", () => {
  test("restores available from in_shop", () => {
    expect(vehicleStatusAfterClose("in_shop")).toBe("available");
  });

  test("keeps retired", () => {
    expect(vehicleStatusAfterClose("retired")).toBe("retired");
  });
});

describe("normalizeCostInr failure modes", () => {
  test("rejects negative cost", () => {
    expect(() => normalizeCostInr(-1)).toThrow("costInr must be greater than or equal to 0");
  });

  test("rejects NaN", () => {
    expect(() => normalizeCostInr("abc")).toThrow("costInr must be a valid number");
  });

  test("defaults missing to 0.00", () => {
    expect(normalizeCostInr(undefined)).toBe("0.00");
  });

  test("formats positive cost", () => {
    expect(normalizeCostInr(1500)).toBe("1500.00");
  });
});

describe("validateOpenBody failure modes", () => {
  test("requires vehicleId", () => {
    expect(() => validateOpenBody({ vehicleId: "", maintenanceTypeId: "a".repeat(36) })).toThrow(
      "vehicleId is required",
    );
  });

  test("requires maintenanceTypeId", () => {
    expect(() => validateOpenBody({ vehicleId: "a".repeat(36), maintenanceTypeId: "  " })).toThrow(
      "maintenanceTypeId is required",
    );
  });
});

describe("resolveDescriptionForOpen Other service type", () => {
  test("requires customServiceType when type is OTHER", () => {
    expect(() =>
      resolveDescriptionForOpen({
        maintenanceTypeCode: "OTHER",
        customServiceType: "  ",
        description: null,
      }),
    ).toThrow("customServiceType is required when service type is Other");
  });

  test("stores custom label for OTHER", () => {
    expect(
      resolveDescriptionForOpen({
        maintenanceTypeCode: "OTHER",
        customServiceType: "AC compressor repair",
        description: null,
      }),
    ).toBe("AC compressor repair");
  });

  test("appends notes after custom label for OTHER", () => {
    expect(
      resolveDescriptionForOpen({
        maintenanceTypeCode: "OTHER",
        customServiceType: "Battery swap",
        description: "warranty claim",
      }),
    ).toBe("Battery swap — warranty claim");
  });

  test("uses notes only for non-OTHER types", () => {
    expect(
      resolveDescriptionForOpen({
        maintenanceTypeCode: "OIL_CHANGE",
        customServiceType: "ignored",
        description: "5W-30",
      }),
    ).toBe("5W-30");
  });
});
