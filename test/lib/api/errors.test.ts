import { describe, expect, test } from "bun:test";

import {
  errorMessage,
  FORBIDDEN_MESSAGE,
  resolveErrorCode,
  toUserFacingApiError,
  UNAUTHORIZED_MESSAGE,
} from "@/lib/api/errors";

describe("resolveErrorCode", () => {
  test("maps auth and not-found patterns", () => {
    expect(resolveErrorCode("Unauthorized")).toBe("401");
    expect(resolveErrorCode("Forbidden")).toBe("403");
    expect(resolveErrorCode("Vehicle not found")).toBe("404");
    expect(resolveErrorCode("Conflict: registration number already exists")).toBe("409");
    expect(resolveErrorCode("Too many requests")).toBe("429");
  });

  test("maps friendly auth messages to 401/403", () => {
    expect(resolveErrorCode(UNAUTHORIZED_MESSAGE)).toBe("401");
    expect(resolveErrorCode(FORBIDDEN_MESSAGE)).toBe("403");
  });

  test("defaults to 400", () => {
    expect(resolveErrorCode("Cannot retire a vehicle while on trip")).toBe("400");
  });
});

describe("errorMessage", () => {
  test("uses Error.message when present", () => {
    expect(errorMessage(new Error("Forbidden"), "fallback")).toBe("Forbidden");
  });

  test("falls back for non-errors", () => {
    expect(errorMessage("nope", "Unable to list vehicles")).toBe("nope");
  });
});

describe("toUserFacingApiError", () => {
  test("maps legacy keywords to friendly copy", () => {
    expect(toUserFacingApiError("Forbidden")).toBe(FORBIDDEN_MESSAGE);
    expect(toUserFacingApiError("Unauthorized")).toBe(UNAUTHORIZED_MESSAGE);
  });

  test("passes through domain messages", () => {
    expect(toUserFacingApiError("Vehicle not found")).toBe("Vehicle not found");
  });
});
