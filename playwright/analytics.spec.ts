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

test.describe("Analytics API (authenticated fleet manager)", () => {
  test("returns report with KPI fields and charts data", async ({ request }) => {
    const response = await request.get(`${runtime().baseURL}/api/analytics/report`);
    expect(response.status()).toBe(200);

    const body = (await response.json()) as {
      summary: {
        fuelEfficiencyKmPerL: string | null;
        fleetUtilizationPercent: string;
        operationalCostInr: string;
        vehicleRoiPercent: string | null;
        roiFormula: string;
        monthlyRevenueInr: string;
      };
      costliestVehicles: Array<{ vehicleRegistration: string; operationalCostInr: string }>;
      monthlyRevenue: Array<{ label: string; revenueInr: string }>;
    };

    expect(body.summary.roiFormula).toContain("ROI");
    expect(body.summary.operationalCostInr).toMatch(/^\d+\.\d{2}$/);
    expect(body.summary.fleetUtilizationPercent).toMatch(/^\d+(\.\d+)?$/);
    // Real revenue from seeded revenue_logs (ADR-056) — not a hard-coded constant.
    expect(Number(body.summary.monthlyRevenueInr)).toBeGreaterThan(0);
    expect(body.monthlyRevenue.length).toBeGreaterThanOrEqual(6);
    expect(Array.isArray(body.costliestVehicles)).toBe(true);

    const deep = body as {
      costBreakdown?: { fuelTotalInr: string; operationalCostInr: string };
      tripCounts?: { total: number; completed: number };
      vehicleRoiTable?: Array<{ vehicleRegistration: string; roiPercent: string | null }>;
    };
    expect(deep.costBreakdown?.fuelTotalInr).toMatch(/^\d+\.\d{2}$/);
    expect(typeof deep.tripCounts?.total).toBe("number");
    expect(Array.isArray(deep.vehicleRoiTable)).toBe(true);
  });

  test("exports CSV with metric headers", async ({ request }) => {
    const response = await request.get(`${runtime().baseURL}/api/analytics/export`);
    expect(response.status()).toBe(200);

    const body = (await response.json()) as { csv: string; filename: string };
    expect(body.filename).toContain("analytics");
    expect(body.csv).toContain("fuel_efficiency_km_per_l");
    expect(body.csv).toContain("operational_cost_inr");
  });
});

test.describe("Analytics UI", () => {
  test("renders Reports & Analytics KPIs for fleet manager", async ({ page }) => {
    await gotoRoute(page, "/analytics");

    await expect(page.getByRole("heading", { name: /Reports & Analytics/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/Fuel efficiency/i).first()).toBeVisible();
    await expect(page.getByText(/Fleet utilization/i).first()).toBeVisible();
    await expect(page.getByText(/Operational cost/i).first()).toBeVisible();
    await expect(page.getByText(/Vehicle ROI/i).first()).toBeVisible();
    await expect(page.getByText("Monthly revenue", { exact: true })).toBeVisible();
    await expect(page.getByText("Top costliest vehicles", { exact: true })).toBeVisible();
    await expect(page.getByText("Cost composition", { exact: true })).toBeVisible();
    await expect(page.getByText("Deep vehicle ROI", { exact: true })).toBeVisible();
    await expect(page.getByText("Fleet & trip pulse", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /Export CSV/i })).toBeVisible();
  });
});
