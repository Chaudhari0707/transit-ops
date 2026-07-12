import { describe, expect, test } from "bun:test";

import {
  DEMO_SIGN_IN_BY_ROLE,
  DEMO_SIGN_IN_PASSWORD,
  getDemoCredentialsForRole,
  getSignInErrorMessage,
  signInDefaultValues,
} from "@/app/sign-in/_lib/sign-in-helpers";
import { USER_ROLES } from "@/lib/auth/_types/user-role";

describe("signInDefaultValues", () => {
  test("starts with fleet manager role and demo credentials", () => {
    expect(signInDefaultValues.role).toBe("fleet_manager");
    expect(signInDefaultValues.email).toBe(DEMO_SIGN_IN_BY_ROLE.fleet_manager.email);
    expect(signInDefaultValues.password).toBe(DEMO_SIGN_IN_PASSWORD);
  });
});

describe("getDemoCredentialsForRole", () => {
  test("maps every role to a seeded demo email and shared password", () => {
    for (const role of USER_ROLES) {
      const credentials = getDemoCredentialsForRole(role);
      expect(credentials.email).toContain("@example.com");
      expect(credentials.password).toBe(DEMO_SIGN_IN_PASSWORD);
      expect(credentials).toEqual(DEMO_SIGN_IN_BY_ROLE[role]);
    }
  });

  test("uses distinct emails per role", () => {
    const emails = USER_ROLES.map((role) => getDemoCredentialsForRole(role).email);
    expect(new Set(emails).size).toBe(USER_ROLES.length);
  });
});

describe("getSignInErrorMessage", () => {
  test("returns lockout copy for rate-limited sign-in", () => {
    expect(getSignInErrorMessage({ status: 429 })).toBe(
      "Account locked after 5 failed attempts. Try again later.",
    );
  });

  test("returns generic invalid-credentials copy for unauthorized responses", () => {
    expect(getSignInErrorMessage({ status: 401, message: "Unauthorized" })).toBe(
      "Invalid username or password",
    );
  });

  test("returns generic invalid-credentials copy for bad-request responses", () => {
    expect(getSignInErrorMessage({ status: 400, message: "Bad Request" })).toBe(
      "Invalid username or password",
    );
  });

  test("does not leak server error details to the UI", () => {
    expect(
      getSignInErrorMessage({
        status: 401,
        message: "User fleet_manager does not match dispatcher",
      }),
    ).toBe("Invalid username or password");
  });
});
