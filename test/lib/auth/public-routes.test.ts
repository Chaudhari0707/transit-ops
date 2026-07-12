import { describe, expect, test } from "bun:test";

import {
  isProtectedAppPath,
  isPublicPath,
  PROTECTED_APP_ROUTES,
} from "@/lib/auth/_lib/public-routes";

describe("isPublicPath allow list", () => {
  test("allows landing and sign-in", () => {
    expect(isPublicPath("/")).toBe(true);
    expect(isPublicPath("/sign-in")).toBe(true);
    expect(isPublicPath("/sign-in/extra")).toBe(true);
  });

  test("allows public image assets", () => {
    expect(isPublicPath("/images/sign-in-panel.jpg")).toBe(true);
  });
});

describe("isPublicPath protected defaults", () => {
  test("rejects all app shell routes", () => {
    for (const route of PROTECTED_APP_ROUTES) {
      expect(isPublicPath(route)).toBe(false);
      expect(isPublicPath(`${route}/nested`)).toBe(false);
    }
  });
});

describe("isProtectedAppPath", () => {
  test("marks dashboard and domain pages", () => {
    expect(isProtectedAppPath("/dashboard")).toBe(true);
    expect(isProtectedAppPath("/dashboard/vehicles")).toBe(true);
    expect(isProtectedAppPath("/drivers")).toBe(true);
    expect(isProtectedAppPath("/maintenance")).toBe(true);
    expect(isProtectedAppPath("/fuel-expenses")).toBe(true);
    expect(isProtectedAppPath("/trips")).toBe(true);
  });

  test("does not mark public paths", () => {
    expect(isProtectedAppPath("/")).toBe(false);
    expect(isProtectedAppPath("/sign-in")).toBe(false);
  });
});
