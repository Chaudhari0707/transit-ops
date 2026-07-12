import { expect, test } from "@playwright/test";

import { getPlaywrightRuntimeConfig } from "./support/env";
import { gotoRoute } from "./support/navigation";
import { fillSignInForm, gotoSignIn, submitSignIn } from "./support/sign-in-ui";

const runtime = getPlaywrightRuntimeConfig();

test.describe("sign-in page shell", () => {
  test("renders email, password, role, and submit controls", async ({ page }) => {
    await gotoSignIn(page);

    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.locator("#role")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("landing page sign-in link routes to /sign-in", async ({ page }) => {
    await gotoRoute(page, "/");
    const signInCta = page
      .getByRole("link", { name: "Sign in" })
      .or(page.getByRole("button", { name: "Sign in" }));
    await expect(signInCta.first()).toBeVisible({ timeout: 15_000 });
    await signInCta.first().click();
    await expect(page).toHaveURL(/\/sign-in/);
  });
});

test.describe("sign-in validation UX", () => {
  test("shows field errors when submitting an empty form", async ({ page }) => {
    await gotoSignIn(page);
    // Demo credentials autofill for the default role — clear them for this validation case.
    await page.locator("#email").fill("");
    await page.locator("#password").fill("");
    await submitSignIn(page);

    await expect(page.locator("[data-slot=field-error]").first()).toContainText(
      "Enter a valid email address",
    );
    await expect(page.getByText("Password is required")).toBeVisible();
  });

  test("autofills demo email and password when the role changes", async ({ page }) => {
    await gotoSignIn(page);

    await expect(page.locator("#email")).toHaveValue("admin@example.com");
    await expect(page.locator("#password")).toHaveValue("password");

    await page.locator("#role").click();
    await page.getByRole("option", { name: "Dispatcher" }).click();

    await expect(page.locator("#email")).toHaveValue("dispatcher@example.com");
    await expect(page.locator("#password")).toHaveValue("password");

    await page.locator("#role").click();
    await page.getByRole("option", { name: "Financial Analyst" }).click();

    await expect(page.locator("#email")).toHaveValue("finance@example.com");
    await expect(page.locator("#password")).toHaveValue("password");
  });

  test("shows an email validation error for malformed addresses", async ({ page }) => {
    await gotoSignIn(page);
    await page.locator("#email").fill("not-an-email");
    await page.locator("#password").fill("password");
    await submitSignIn(page);

    await expect(page.getByText("Enter a valid email address")).toBeVisible();
  });
});

test.describe("sign-in auth flows", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("rejects invalid credentials with a generic error", async ({ page }) => {
    await gotoSignIn(page);
    await fillSignInForm(page, {
      email: runtime.adminEmail,
      password: "definitely-wrong-password",
      role: "fleet_manager",
    });
    await submitSignIn(page, { waitForAuthResponse: true });

    await expect(page.getByText("Invalid username or password")).toBeVisible();
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("rejects a valid password when the selected role does not match", async ({ page }) => {
    await gotoSignIn(page);
    await fillSignInForm(page, {
      email: runtime.adminEmail,
      password: runtime.adminPassword ?? "password",
      role: "dispatcher",
    });
    await submitSignIn(page, { waitForAuthResponse: true });

    await expect(page.getByText("Invalid username or password")).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("signs in with matching role and opens the dashboard", async ({ page }) => {
    await gotoSignIn(page);
    await fillSignInForm(page, {
      email: runtime.adminEmail,
      password: runtime.adminPassword ?? "password",
      role: "fleet_manager",
    });
    await submitSignIn(page, { waitForAuthResponse: true });

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Operations Dashboard" })).toBeVisible();
  });

  test("redirects unauthenticated dashboard visits to sign-in", async ({ page }) => {
    await gotoRoute(page, "/dashboard");

    await expect(page).toHaveURL(/\/sign-in\?next=%2Fdashboard$/);
    await expect(page.getByRole("heading", { name: "Sign in to TransitOps" })).toBeVisible();
  });
});
