import { describe, expect, test } from "bun:test";

import { isSignInInputEmpty, normalizeIdentifier } from "@/modules/auth/_lib/identifiers";

describe("normalizeIdentifier", () => {
  test("trims and lowercases usernames", () => {
    expect(normalizeIdentifier("  Admin.User  ")).toBe("admin.user");
  });

  test("preserves already normalized values", () => {
    expect(normalizeIdentifier("admin")).toBe("admin");
  });
});

describe("isSignInInputEmpty failure modes", () => {
  test("rejects blank username", () => {
    expect(isSignInInputEmpty("   ", "password")).toBe(true);
  });

  test("rejects blank password", () => {
    expect(isSignInInputEmpty("admin", "   ")).toBe(true);
  });

  test("accepts non-empty credentials", () => {
    expect(isSignInInputEmpty("admin", "password")).toBe(false);
  });
});
