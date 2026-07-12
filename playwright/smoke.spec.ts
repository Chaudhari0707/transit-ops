import { expect, test } from "@playwright/test";

import { gotoRoute } from "./support/navigation";

test("homepage renders the TransitOps marketing shell", async ({ page }) => {
  await gotoRoute(page, "/");

  await expect(page.getByRole("link", { name: "TransitOps" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Run your logistics fleet with/i })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
});
