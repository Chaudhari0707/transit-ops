import { expect, test } from "@playwright/test";

import { ADMIN_AUTH_FILE, getPlaywrightRuntimeConfig } from "./support/env";
import { loadPlaywrightEnvFiles } from "./support/load-env";
import { gotoRoute } from "./support/navigation";

test.use({ storageState: ADMIN_AUTH_FILE });

test.beforeAll(async () => {
  await loadPlaywrightEnvFiles();
});

function runtime() {
  return getPlaywrightRuntimeConfig();
}

test.describe("Drivers API (authenticated)", () => {
  test("lists seeded drivers with compliance fields", async ({ request }) => {
    const response = await request.get(`${runtime().baseURL}/api/drivers`);
    expect(response.status()).toBe(200);

    const body = (await response.json()) as {
      items: Array<{
        fullName: string;
        isLicenseExpired: boolean;
        isLicenseExpiringSoon: boolean;
        status: string;
      }>;
    };

    expect(body.items.length).toBeGreaterThanOrEqual(7);

    const alex = body.items.find((d) => d.fullName === "Alex Kumar");
    expect(alex).toBeTruthy();

    const expired = body.items.find((d) => d.fullName === "Meera Iyer");
    expect(expired?.isLicenseExpired).toBe(true);

    const suspended = body.items.find((d) => d.fullName === "Karan Shah");
    expect(suspended?.status).toBe("suspended");
  });

  test("filters expired licenses", async ({ request }) => {
    const response = await request.get(
      `${runtime().baseURL}/api/drivers?licenseCompliance=expired`,
    );
    expect(response.status()).toBe(200);
    const body = (await response.json()) as { items: Array<{ isLicenseExpired: boolean }> };
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.items.every((d) => d.isLicenseExpired)).toBe(true);
  });

  test("CRUD lifecycle: create, update, soft-delete", async ({ request }) => {
    const base = runtime().baseURL;
    const categoriesRes = await request.get(`${base}/api/drivers/categories`);
    expect(categoriesRes.ok()).toBeTruthy();
    const categories = (await categoriesRes.json()) as {
      items: Array<{ id: string; code: string }>;
    };
    const lmv = categories.items.find((c) => c.code === "LMV") ?? categories.items[0];
    expect(lmv).toBeTruthy();

    const licenseNumber = `E2E${Date.now().toString().slice(-10)}`;

    const createRes = await request.post(`${base}/api/drivers`, {
      data: {
        fullName: "E2E Test Driver",
        licenseNumber,
        licenseCategoryId: lmv!.id,
        licenseExpiryDate: "2029-06-01",
        contactNumber: "9111222333",
        safetyScore: 87,
        status: "available",
        notes: "playwright e2e",
      },
    });
    expect(createRes.status()).toBe(200);
    const created = (await createRes.json()) as { driver: { id: string; fullName: string } };
    expect(created.driver.fullName).toBe("E2E Test Driver");
    const driverId = created.driver.id;

    const dupRes = await request.post(`${base}/api/drivers`, {
      data: {
        fullName: "Duplicate License",
        licenseNumber,
        licenseCategoryId: lmv!.id,
        licenseExpiryDate: "2029-06-01",
        contactNumber: "9111222334",
        status: "available",
      },
    });
    expect(dupRes.status()).toBe(409);

    const updateRes = await request.put(`${base}/api/drivers/${driverId}`, {
      data: {
        fullName: "E2E Test Driver Updated",
        licenseNumber,
        licenseCategoryId: lmv!.id,
        licenseExpiryDate: "2029-06-01",
        contactNumber: "9111222333",
        safetyScore: 91,
        status: "off_duty",
        notes: "updated by e2e",
      },
    });
    expect(updateRes.status()).toBe(200);
    const updated = (await updateRes.json()) as {
      driver: { fullName: string; status: string; safetyScore: number };
    };
    expect(updated.driver.fullName).toBe("E2E Test Driver Updated");
    expect(updated.driver.status).toBe("off_duty");
    expect(updated.driver.safetyScore).toBe(91);

    const deleteRes = await request.delete(`${base}/api/drivers/${driverId}`);
    expect(deleteRes.status()).toBe(200);

    const getRes = await request.get(`${base}/api/drivers/${driverId}`);
    expect(getRes.status()).toBe(404);
  });

  test("rejects unauthenticated access", async ({ playwright }) => {
    // Explicit empty storage — project-level ADMIN_AUTH_FILE must not leak in.
    const context = await playwright.request.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const response = await context.get(`${runtime().baseURL}/api/drivers`);
    expect(response.status()).toBe(401);
    await context.dispose();
  });
});

test.describe("Drivers UI (authenticated)", () => {
  test("drivers page shows seed data and create form", async ({ page }) => {
    const cfg = runtime();
    await gotoRoute(page, "/drivers");

    // Session from setup should skip sign-in; if not, use on-page form.
    const signInButton = page.getByRole("button", { name: /^sign in$/i });
    if (await signInButton.isVisible().catch(() => false)) {
      await page.getByLabel(/email/i).fill(cfg.adminEmail);
      await page.getByLabel(/password/i).fill(cfg.adminPassword ?? "ChangeMe123!");
      await signInButton.click();
      await expect(page.getByRole("heading", { name: /drivers/i }).first()).toBeVisible({
        timeout: 15_000,
      });
    }

    await expect(page.getByRole("heading", { name: "Drivers" }).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("Alex Kumar").first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Meera Iyer").first()).toBeVisible();
    // Compliance seed: Meera has expiry 2025-12-31 — show date in table body.
    await expect(page.locator("table").getByText("2025-12-31").first()).toBeVisible();
    await expect(page.getByText("Karan Shah").first()).toBeVisible();
    await expect(page.locator("table").getByText("Suspended").first()).toBeVisible();
    await expect(page.getByText("Add driver").first()).toBeVisible();
    await expect(page.getByRole("button", { name: /create driver/i })).toBeVisible();
  });

  test("UI create driver appears in table", async ({ page }) => {
    const cfg = runtime();
    await gotoRoute(page, "/drivers");

    const signInButton = page.getByRole("button", { name: /^sign in$/i });
    if (await signInButton.isVisible().catch(() => false)) {
      await page.getByLabel(/email/i).fill(cfg.adminEmail);
      await page.getByLabel(/password/i).fill(cfg.adminPassword ?? "ChangeMe123!");
      await signInButton.click();
      await page.waitForTimeout(1000);
    }

    await expect(page.getByLabel(/full name/i)).toBeVisible({ timeout: 15_000 });

    const suffix = Date.now().toString().slice(-8);
    const fullName = `UI E2E Driver ${suffix}`;
    const license = `UI${suffix}`;

    await page.getByLabel(/full name/i).fill(fullName);
    await page.getByLabel(/license number/i).fill(license);
    await page.getByLabel(/license expiry/i).fill("2029-12-31");
    await page.getByLabel(/contact number/i).fill("9888777666");
    await page.getByLabel(/safety score/i).fill("93");

    // Category select may already have LMV selected from seed load.
    const category = page.locator("#drv-cat");
    if (await category.isVisible()) {
      const options = category.locator("option");
      const count = await options.count();
      if (count > 1) {
        await category.selectOption({ index: 1 });
      }
    }

    await page.getByRole("button", { name: /create driver/i }).click();
    await expect(page.getByText(fullName).first()).toBeVisible({ timeout: 15_000 });
  });
});
