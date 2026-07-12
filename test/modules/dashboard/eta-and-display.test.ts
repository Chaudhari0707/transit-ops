import { describe, expect, test } from "bun:test";

import { formatTripEtaLabel } from "@/modules/dashboard/_lib/eta";
import { clampRecentTripsLimit, formatTripCode } from "@/modules/dashboard/_lib/trip-display";

describe("formatTripEtaLabel", () => {
  test("completed and cancelled show em dash", () => {
    expect(formatTripEtaLabel("completed", 100)).toBe("—");
    expect(formatTripEtaLabel("cancelled", 100)).toBe("—");
  });

  test("draft shows awaiting dispatch", () => {
    expect(formatTripEtaLabel("draft", 50)).toBe("Awaiting dispatch");
  });

  test("dispatched with invalid distance falls back to en route", () => {
    expect(formatTripEtaLabel("dispatched", 0)).toBe("En route");
    expect(formatTripEtaLabel("dispatched", -5)).toBe("En route");
    expect(formatTripEtaLabel("dispatched", Number.NaN)).toBe("En route");
  });

  test("dispatched estimates minutes from planned distance", () => {
    // 40 km @ 40 km/h = 60 min → 1h
    expect(formatTripEtaLabel("dispatched", 40)).toBe("1h");
    // 20 km @ 40 km/h = 30 min
    expect(formatTripEtaLabel("dispatched", 20)).toBe("30 min");
  });
});

describe("formatTripCode", () => {
  test("uses first 4 hex chars of uuid", () => {
    expect(formatTripCode("a1b2c3d4-e5f6-7890-abcd-ef1234567890")).toBe("TR-A1B2");
  });

  test("handles short ids without throwing", () => {
    expect(formatTripCode("ab")).toBe("TR-AB");
    expect(formatTripCode("")).toBe("TR-????");
  });
});

describe("clampRecentTripsLimit failure modes", () => {
  test("defaults to 8 when undefined", () => {
    expect(clampRecentTripsLimit(undefined)).toBe(8);
  });

  test("rejects less than 1", () => {
    expect(() => clampRecentTripsLimit(0)).toThrow("Recent trips limit must be at least 1");
    expect(() => clampRecentTripsLimit(-3)).toThrow("Recent trips limit must be at least 1");
  });

  test("rejects greater than 50", () => {
    expect(() => clampRecentTripsLimit(51)).toThrow("Recent trips limit cannot exceed 50");
  });

  test("floors fractional limits", () => {
    expect(clampRecentTripsLimit(5.9)).toBe(5);
  });
});
