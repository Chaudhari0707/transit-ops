import { describe, expect, test } from "bun:test";

import {
  errorMessage,
  FORBIDDEN_MESSAGE,
  resolveErrorCode,
  resolveErrorCodeFor,
  resolveErrorCodeNumber,
  UNAUTHORIZED_MESSAGE,
} from "@/lib/api/errors";

describe("resolveErrorCode failure-first edge cases", () => {
  test("maps Unauthorized case-insensitively", () => {
    expect(resolveErrorCode("Unauthorized")).toBe("401");
    expect(resolveErrorCode("unauthorized")).toBe("401");
    expect(resolveErrorCode("  UNAUTHORIZED  ")).toBe("401");
  });

  test("maps Forbidden", () => {
    expect(resolveErrorCode("Forbidden")).toBe("403");
  });

  test("maps friendly permission and session phrases", () => {
    expect(resolveErrorCode(FORBIDDEN_MESSAGE)).toBe("403");
    expect(resolveErrorCode(UNAUTHORIZED_MESSAGE)).toBe("401");
    expect(resolveErrorCode("do not have permission to edit")).toBe("403");
    expect(resolveErrorCode("session has expired")).toBe("401");
  });

  test("maps not-found suffix for domain resources", () => {
    expect(resolveErrorCode("Vehicle not found")).toBe("404");
    expect(resolveErrorCode("Driver not found")).toBe("404");
    expect(resolveErrorCode("Trip not found")).toBe("404");
  });

  test("maps conflict variants", () => {
    expect(resolveErrorCode("Conflict")).toBe("409");
    expect(resolveErrorCode("Conflict: registration number already exists")).toBe("409");
    expect(resolveErrorCode("Vehicle already has an open maintenance log")).toBe("409");
  });

  test("maps rate limit", () => {
    expect(resolveErrorCode("Too many requests")).toBe("429");
  });

  test("defaults business rule failures to 400", () => {
    expect(resolveErrorCode("Cannot retire a vehicle while on trip")).toBe("400");
    expect(resolveErrorCode("Source and destination must differ")).toBe("400");
  });
});

describe("resolveErrorCodeNumber and resolveErrorCodeFor", () => {
  test("numeric helper matches string status map", () => {
    expect(resolveErrorCodeNumber("Unauthorized")).toBe(401);
    expect(resolveErrorCodeNumber("Forbidden")).toBe(403);
    expect(resolveErrorCodeNumber("Trip not found")).toBe(404);
  });

  test("resolveErrorCodeFor clamps to allowed set", () => {
    expect(resolveErrorCodeFor("Unauthorized", [400, 401, 403] as const)).toBe(401);
    // Unknown → first allowed (write handlers often start at 400)
    expect(resolveErrorCodeFor("Something odd", [400, 401] as const)).toBe(400);
  });
});

describe("errorMessage edge cases", () => {
  test("prefers Error.message", () => {
    expect(errorMessage(new Error("Unauthorized"), "fallback")).toBe("Unauthorized");
  });

  test("uses non-empty string errors", () => {
    expect(errorMessage("Forbidden", "fallback")).toBe("Forbidden");
  });

  test("falls back for empty/unknown values", () => {
    expect(errorMessage("", "Unable to list")).toBe("Unable to list");
    expect(errorMessage(null, "Unable to list")).toBe("Unable to list");
    expect(errorMessage(undefined, "Unable to list")).toBe("Unable to list");
    expect(errorMessage(42, "Unable to list")).toBe("Unable to list");
  });
});
