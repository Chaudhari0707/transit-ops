import { describe, expect, test } from "bun:test";

import {
  assertValidRegistration,
  normalizeRegistration,
} from "@/modules/vehicles/_lib/registration";
import {
  assertNonNegativeCost,
  assertNonNegativeOdometer,
  assertPositiveCapacity,
} from "@/modules/vehicles/_lib/validators";

describe("registration failure modes", () => {
  test("rejects blank after normalize", () => {
    expect(() => assertValidRegistration("  ")).toThrow(
      "Registration number must be between 3 and 32 characters",
    );
  });

  test("rejects too short", () => {
    expect(() => assertValidRegistration("AB")).toThrow(
      "Registration number must be between 3 and 32 characters",
    );
  });

  test("rejects invalid characters", () => {
    expect(() => assertValidRegistration("GJ@01")).toThrow("Registration number format is invalid");
  });
});

describe("registration allow modes", () => {
  test("normalizes case and spacing", () => {
    expect(normalizeRegistration("  gj-01-va-1005  ")).toBe("GJ-01-VA-1005");
  });

  test("accepts seeded-style registration", () => {
    expect(assertValidRegistration("gj-01-va-1005")).toBe("GJ-01-VA-1005");
  });
});

describe("numeric validator failure modes", () => {
  test("rejects zero and negative capacity", () => {
    expect(() => assertPositiveCapacity(0)).toThrow("Max load capacity must be greater than 0");
    expect(() => assertPositiveCapacity(-1)).toThrow("Max load capacity must be greater than 0");
  });

  test("rejects negative odometer", () => {
    expect(() => assertNonNegativeOdometer(-0.1)).toThrow(
      "Odometer must be greater than or equal to 0",
    );
  });

  test("rejects negative acquisition cost", () => {
    expect(() => assertNonNegativeCost(-1)).toThrow(
      "Acquisition cost must be greater than or equal to 0",
    );
  });
});
