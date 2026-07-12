import { expect, test } from "@playwright/test";

import { gotoRoute } from "./support/navigation";

test("homepage renders the TransitOps marketing shell", async ({ page }) => {
  await gotoRoute(page, "/");

  await expect(page.getByRole("link", { name: "TransitOps" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("heading", { name: /Run your logistics fleet with/i })).toBeVisible();
  // Sign in may be exposed as link (preferred) or button (Base UI Button+Link).
  await expect(
    page.getByRole("link", { name: "Sign in" }).or(page.getByRole("button", { name: "Sign in" })),
  ).toBeVisible();
});
