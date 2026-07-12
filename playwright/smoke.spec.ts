import { expect, test } from "@playwright/test";

import { gotoRoute } from "./support/navigation";

test("homepage renders the transit ops shell", async ({ page }) => {
  await gotoRoute(page, "/");

  await expect(page.getByRole("heading", { name: "Transit Ops" })).toBeVisible();
  await expect(page.getByText(/operations dashboard concept/i)).toBeVisible();
});
