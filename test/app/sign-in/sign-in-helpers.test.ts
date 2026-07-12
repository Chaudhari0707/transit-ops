import { describe, expect, test } from "bun:test";

import { getSignInErrorMessage, signInDefaultValues } from "@/app/sign-in/_lib/sign-in-helpers";

describe("signInDefaultValues", () => {
  test("starts with fleet manager role selected", () => {
    expect(signInDefaultValues.role).toBe("fleet_manager");
  });

  test("starts with empty credentials", () => {
    expect(signInDefaultValues.email).toBe("");
    expect(signInDefaultValues.password).toBe("");
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
