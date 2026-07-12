import { describe, expect, test } from "bun:test";

import {
  assertDriverReadRole,
  assertDriverWriteRole,
  assertManualStatusTransition,
  computeTripCompletionPct,
  isAssignableToTrip,
  isLicenseExpired,
  isLicenseExpiringSoon,
  normalizeSafetyScore,
  validateDriverWriteBody,
} from "@/modules/drivers/_lib/rules";

describe("RBAC", () => {
  test("dispatcher cannot read driver admin", () => {
    expect(() => assertDriverReadRole("dispatcher")).toThrow("Forbidden");
  });

  test("finance cannot write drivers", () => {
    expect(() => assertDriverWriteRole("financial_analyst")).toThrow("Forbidden");
  });

  test("fleet and safety can write", () => {
    expect(() => assertDriverWriteRole("fleet_manager")).not.toThrow();
    expect(() => assertDriverWriteRole("safety_officer")).not.toThrow();
  });
});

describe("license compliance", () => {
  test("expired when before today", () => {
    expect(isLicenseExpired("2020-01-01", "2026-07-12")).toBe(true);
  });

  test("expiring soon within 30 days", () => {
    expect(isLicenseExpiringSoon("2026-07-20", 30, "2026-07-12")).toBe(true);
    expect(isLicenseExpiringSoon("2026-12-01", 30, "2026-07-12")).toBe(false);
  });
});

describe("status transitions", () => {
  test("cannot manually set on_trip", () => {
    expect(() => assertManualStatusTransition("available", "on_trip")).toThrow(
      "Cannot set status to on_trip manually",
    );
  });

  test("blocks freeing on_trip except suspend path message", () => {
    expect(() => assertManualStatusTransition("on_trip", "available")).toThrow("Driver is on_trip");
  });

  test("allows suspend from on_trip", () => {
    expect(() => assertManualStatusTransition("on_trip", "suspended")).not.toThrow();
  });
});

describe("assignable helper BR-03/04", () => {
  test("available + valid license", () => {
    expect(
      isAssignableToTrip({
        status: "available",
        licenseExpiryDate: "2027-01-01",
        deletedAt: null,
      }),
    ).toBe(true);
  });

  test("rejects suspended", () => {
    expect(
      isAssignableToTrip({
        status: "suspended",
        licenseExpiryDate: "2027-01-01",
        deletedAt: null,
      }),
    ).toBe(false);
  });

  test("rejects expired license", () => {
    expect(
      isAssignableToTrip({
        status: "available",
        licenseExpiryDate: "2020-01-01",
        deletedAt: null,
      }),
    ).toBe(false);
  });
});

describe("trip completion % ADR-049", () => {
  test("null when no assignments", () => {
    expect(computeTripCompletionPct(0, 0)).toBeNull();
  });

  test("computes percentage", () => {
    expect(computeTripCompletionPct(48, 50)).toBe(96);
  });
});

describe("validate write body", () => {
  test("rejects empty name", () => {
    expect(() =>
      validateDriverWriteBody({
        fullName: "  ",
        licenseNumber: "GJ1",
        licenseCategoryId: "a".repeat(36),
        licenseExpiryDate: "2027-01-01",
        contactNumber: "999",
      }),
    ).toThrow("fullName is required");
  });

  test("rejects safety score out of range", () => {
    expect(() => normalizeSafetyScore(101)).toThrow("safetyScore must be between 0 and 100");
  });

  test("rejects manual on_trip", () => {
    expect(() =>
      validateDriverWriteBody({
        fullName: "Alex",
        licenseNumber: "GJ1",
        licenseCategoryId: "a".repeat(36),
        licenseExpiryDate: "2027-01-01",
        contactNumber: "999",
        status: "on_trip",
      }),
    ).toThrow("Cannot set status to on_trip manually");
  });
});
