import { describe, expect, test } from "bun:test";

import {
  isUserRole,
  SIGN_IN_INVALID_CREDENTIALS_MESSAGE,
  validatePostSignInSession,
} from "@/lib/auth/_lib/sign-in-validation";

describe("isUserRole", () => {
  test("accepts every configured TransitOps role", () => {
    expect(isUserRole("fleet_manager")).toBe(true);
    expect(isUserRole("dispatcher")).toBe(true);
    expect(isUserRole("safety_officer")).toBe(true);
    expect(isUserRole("financial_analyst")).toBe(true);
  });

  test("rejects unknown roles", () => {
    expect(isUserRole("super_admin")).toBe(false);
    expect(isUserRole("")).toBe(false);
    expect(isUserRole("Fleet_Manager")).toBe(false);
  });
});

describe("validatePostSignInSession failure modes", () => {
  test("rejects missing role header", () => {
    const result = validatePostSignInSession({
      selectedRole: undefined,
      user: { role: "fleet_manager", isActive: true, deletedAt: null },
    });

    expect(result).toEqual({
      ok: false,
      status: 400,
      message: SIGN_IN_INVALID_CREDENTIALS_MESSAGE,
    });
  });

  test("rejects blank role header", () => {
    const result = validatePostSignInSession({
      selectedRole: "   ",
      user: { role: "fleet_manager", isActive: true, deletedAt: null },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
    }
  });

  test("rejects invalid role header value", () => {
    const result = validatePostSignInSession({
      selectedRole: "super_admin",
      user: { role: "fleet_manager", isActive: true, deletedAt: null },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
    }
  });

  test("rejects inactive users", () => {
    const result = validatePostSignInSession({
      selectedRole: "fleet_manager",
      user: { role: "fleet_manager", isActive: false, deletedAt: null },
    });

    expect(result).toEqual({
      ok: false,
      status: 401,
      message: SIGN_IN_INVALID_CREDENTIALS_MESSAGE,
    });
  });

  test("rejects soft-deleted users", () => {
    const result = validatePostSignInSession({
      selectedRole: "dispatcher",
      user: {
        role: "dispatcher",
        isActive: true,
        deletedAt: "2026-07-12T00:00:00.000Z",
      },
    });

    expect(result).toEqual({
      ok: false,
      status: 401,
      message: SIGN_IN_INVALID_CREDENTIALS_MESSAGE,
    });
  });

  test("rejects role mismatch even when password authentication succeeded", () => {
    const result = validatePostSignInSession({
      selectedRole: "dispatcher",
      user: { role: "fleet_manager", isActive: true, deletedAt: null },
    });

    expect(result).toEqual({
      ok: false,
      status: 401,
      message: SIGN_IN_INVALID_CREDENTIALS_MESSAGE,
    });
  });
});

describe("validatePostSignInSession success", () => {
  test("accepts matching active role", () => {
    const result = validatePostSignInSession({
      selectedRole: " safety_officer ",
      user: { role: "safety_officer", isActive: true, deletedAt: null },
    });

    expect(result).toEqual({ ok: true, selectedRole: "safety_officer" });
  });
});
