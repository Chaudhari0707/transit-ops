import { describe, expect, test } from "bun:test";

import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("password hashing", () => {
  test("verifies a password against its hash", async () => {
    const password = "ChangeMe123!";
    const hash = await hashPassword(password);

    expect(await verifyPassword({ password, hash })).toBe(true);
  });

  test("rejects an incorrect password for the same hash", async () => {
    const hash = await hashPassword("correct-password");

    expect(await verifyPassword({ password: "wrong-password", hash })).toBe(false);
  });
});
