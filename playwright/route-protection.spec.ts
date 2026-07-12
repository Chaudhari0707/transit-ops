import { expect, test } from "@playwright/test";

import { gotoRoute } from "./support/navigation";

/**
 * Without a session, app shell routes must never render dashboard chrome.
 * Proxy redirects to /sign-in?next=…
 */
const PROTECTED_ROUTES = [
  "/dashboard",
  "/dashboard/vehicles",
  "/drivers",
  "/maintenance",
  "/fuel-expenses",
] as const;

test.describe("route protection (unauthenticated)", () => {
  for (const route of PROTECTED_ROUTES) {
    test(`redirects ${route} to sign-in with next param`, async ({ page }) => {
      await gotoRoute(page, route);

      const encodedNext = encodeURIComponent(route);
      await expect(page).toHaveURL(
        new RegExp(`/sign-in\\?next=${encodedNext.replace(/\//g, "\\/")}$`),
      );
      await expect(page.getByRole("heading", { name: "Sign in to TransitOps" })).toBeVisible();

      // Must not leak app shell / domain content
      await expect(page.getByText("Alex Kumar")).toHaveCount(0);
      await expect(page.getByRole("heading", { name: "Operations Dashboard" })).toHaveCount(0);
      await expect(page.getByRole("heading", { name: "Drivers" })).toHaveCount(0);
    });
  }

  test("domain API without session returns 401", async ({ playwright, baseURL }) => {
    // Fresh context: prior auth-api tests must not leak cookies into this check.
    const context = await playwright.request.newContext({
      baseURL,
      storageState: { cookies: [], origins: [] },
    });

    try {
      for (const path of [
        "/api/drivers",
        "/api/vehicles",
        "/api/trips",
        "/api/locations",
        "/api/maintenance",
        "/api/fuel-expenses/summary",
      ]) {
        const response = await context.get(path);
        expect(response.status(), path).toBe(401);
      }
    } finally {
      await context.dispose();
    }
  });

  test("public landing and sign-in remain reachable", async ({ page }) => {
    await gotoRoute(page, "/");
    await expect(page).toHaveURL(/\/$/);
    // Button+Link may expose as link or button depending on Base UI nativeButton.
    await expect(
      page
        .getByRole("link", { name: /sign in/i })
        .or(page.getByRole("button", { name: /sign in/i })),
    ).toBeVisible({ timeout: 15_000 });

    await gotoRoute(page, "/sign-in");
    await expect(page).toHaveURL(/\/sign-in/);
    await expect(page.getByRole("heading", { name: "Sign in to TransitOps" })).toBeVisible();
  });
});
