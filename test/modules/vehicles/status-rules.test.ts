import { describe, expect, test } from "bun:test";

import {
  assertCanRetire,
  assertCanSoftDelete,
  assertRegistryStatusChange,
} from "@/modules/vehicles/_lib/status-rules";

describe("retire failure modes", () => {
  test("blocks retire while on_trip", () => {
    expect(() => assertCanRetire("on_trip")).toThrow("Cannot retire a vehicle while on trip");
  });

  test("blocks retire when already retired", () => {
    expect(() => assertCanRetire("retired")).toThrow("Vehicle is already retired");
  });
});

describe("soft-delete failure modes", () => {
  test("blocks delete while on_trip", () => {
    expect(() => assertCanSoftDelete("on_trip")).toThrow("Cannot delete a vehicle while on trip");
  });
});

describe("registry status change failure modes", () => {
  test("rejects manual on_trip", () => {
    expect(() => assertRegistryStatusChange("available", "on_trip")).toThrow(
      "Cannot set vehicle status to on_trip or in_shop via registry API",
    );
  });

  test("rejects manual in_shop", () => {
    expect(() => assertRegistryStatusChange("available", "in_shop")).toThrow(
      "Cannot set vehicle status to on_trip or in_shop via registry API",
    );
  });

  test("rejects un-retire", () => {
    expect(() => assertRegistryStatusChange("retired", "available")).toThrow(
      "Cannot change status of a retired vehicle",
    );
  });

  test("rejects available -> available noop is ok", () => {
    expect(() => assertRegistryStatusChange("available", "available")).not.toThrow();
  });

  test("allows retire from available and in_shop", () => {
    expect(() => assertRegistryStatusChange("available", "retired")).not.toThrow();
    expect(() => assertRegistryStatusChange("in_shop", "retired")).not.toThrow();
  });

  test("rejects retire from on_trip via registry change", () => {
    expect(() => assertRegistryStatusChange("on_trip", "retired")).toThrow(
      "Cannot retire a vehicle while on trip",
    );
  });
});
