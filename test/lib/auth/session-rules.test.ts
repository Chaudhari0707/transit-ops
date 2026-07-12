import { describe, expect, test } from "bun:test";

import { FORBIDDEN_MESSAGE } from "@/lib/api/http-errors";
import { requireAnyRole, requireRole } from "@/lib/auth/_lib/require-role";
import type { AuthSessionUser } from "@/lib/auth/_types/session";
import { USER_ROLES, type UserRole } from "@/lib/auth/_types/user-role";

function actor(role: UserRole): AuthSessionUser {
  return {
    email: `${role}@test.local`,
    id: "user-1",
    name: "Test User",
    role,
    userId: "user-1",
  };
}

describe("requireRole failure modes", () => {
  test("throws Forbidden when actor role is not allowed", () => {
    expect(() => requireRole(actor("dispatcher"), ["fleet_manager"])).toThrow(FORBIDDEN_MESSAGE);
  });

  test("throws Forbidden for empty allow-list", () => {
    expect(() => requireRole(actor("fleet_manager"), [])).toThrow(FORBIDDEN_MESSAGE);
  });

  test("allows exact matching role", () => {
    expect(() => requireRole(actor("fleet_manager"), ["fleet_manager"])).not.toThrow();
  });
});

describe("requireAnyRole failure modes", () => {
  test("rejects safety_officer for fleet-write roles", () => {
    expect(() => requireAnyRole(actor("safety_officer"), ["fleet_manager", "dispatcher"])).toThrow(
      FORBIDDEN_MESSAGE,
    );
  });

  test("rejects financial_analyst for trip-write roles", () => {
    expect(() => requireAnyRole(actor("financial_analyst"), ["dispatcher"])).toThrow(
      FORBIDDEN_MESSAGE,
    );
  });

  test("returns the same actor when role is allowed", () => {
    const input = actor("dispatcher");
    expect(requireAnyRole(input, ["dispatcher", "fleet_manager"])).toBe(input);
  });
});

describe("USER_ROLES matrix coverage", () => {
  test("exactly four product roles exist", () => {
    expect(USER_ROLES).toEqual([
      "fleet_manager",
      "dispatcher",
      "safety_officer",
      "financial_analyst",
    ]);
  });

  test("every role can be allow-listed for itself", () => {
    for (const role of USER_ROLES) {
      expect(() => requireRole(actor(role), [role])).not.toThrow();
    }
  });
});
