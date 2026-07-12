import { describe, expect, test } from "bun:test";

import {
  isDriverAssignableForPool,
  isVehicleAssignable,
} from "@/modules/trips/_lib/assignable-pool";

describe("assignable vehicle pool", () => {
  test("includes available vehicles", () => {
    expect(isVehicleAssignable("available")).toBe(true);
  });

  test("excludes in_shop vehicles", () => {
    expect(isVehicleAssignable("in_shop")).toBe(false);
  });

  test("excludes on_trip vehicles", () => {
    expect(isVehicleAssignable("on_trip")).toBe(false);
  });

  test("excludes retired vehicles", () => {
    expect(isVehicleAssignable("retired")).toBe(false);
  });
});

describe("assignable driver pool", () => {
  test("includes available drivers with valid license", () => {
    expect(
      isDriverAssignableForPool(
        { status: "available", licenseExpiryDate: "2026-12-31" },
        "2026-07-12",
      ),
    ).toBe(true);
  });

  test("excludes expired licenses", () => {
    expect(
      isDriverAssignableForPool(
        { status: "available", licenseExpiryDate: "2026-01-01" },
        "2026-07-12",
      ),
    ).toBe(false);
  });

  test("excludes suspended drivers", () => {
    expect(
      isDriverAssignableForPool(
        { status: "suspended", licenseExpiryDate: "2026-12-31" },
        "2026-07-12",
      ),
    ).toBe(false);
  });

  test("excludes on_trip drivers", () => {
    expect(
      isDriverAssignableForPool(
        { status: "on_trip", licenseExpiryDate: "2026-12-31" },
        "2026-07-12",
      ),
    ).toBe(false);
  });

  test("excludes off_duty drivers", () => {
    expect(
      isDriverAssignableForPool(
        { status: "off_duty", licenseExpiryDate: "2026-12-31" },
        "2026-07-12",
      ),
    ).toBe(false);
  });
});
