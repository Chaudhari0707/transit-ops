import { describe, expect, test } from "bun:test";

import { signInSchema } from "@/app/sign-in/_lib/sign-in-schema";
import { USER_ROLES } from "@/lib/auth/_types/user-role";

const validPayload = {
  email: "admin@example.com",
  password: "ChangeMe123!",
  role: "fleet_manager" as const,
};

describe("signInSchema failure modes", () => {
  test("rejects invalid email", () => {
    const result = signInSchema.safeParse({
      ...validPayload,
      email: "not-an-email",
    });

    expect(result.success).toBe(false);
  });

  test("rejects email without domain", () => {
    const result = signInSchema.safeParse({
      ...validPayload,
      email: "admin@",
    });

    expect(result.success).toBe(false);
  });

  test("rejects blank password", () => {
    const result = signInSchema.safeParse({
      ...validPayload,
      password: "   ",
    });

    expect(result.success).toBe(false);
  });

  test("rejects missing password", () => {
    const result = signInSchema.safeParse({
      email: validPayload.email,
      role: validPayload.role,
    });

    expect(result.success).toBe(false);
  });

  test("rejects unknown role", () => {
    const result = signInSchema.safeParse({
      ...validPayload,
      role: "super_admin",
    });

    expect(result.success).toBe(false);
  });

  test("rejects missing role", () => {
    const result = signInSchema.safeParse({
      email: validPayload.email,
      password: validPayload.password,
    });

    expect(result.success).toBe(false);
  });
});

describe("signInSchema success modes", () => {
  test("accepts valid credentials", () => {
    const result = signInSchema.safeParse(validPayload);

    expect(result.success).toBe(true);
  });

  test("trims email and password before validation", () => {
    const result = signInSchema.safeParse({
      email: "  admin@example.com  ",
      password: "  ChangeMe123!  ",
      role: "fleet_manager",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("admin@example.com");
      expect(result.data.password).toBe("ChangeMe123!");
    }
  });

  for (const role of USER_ROLES) {
    test(`accepts role ${role}`, () => {
      const result = signInSchema.safeParse({
        ...validPayload,
        role,
      });

      expect(result.success).toBe(true);
    });
  }
});
