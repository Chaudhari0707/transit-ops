import { expect, test } from "@playwright/test";

import { ADMIN_AUTH_FILE, getPlaywrightRuntimeConfig } from "./support/env";

test.use({ storageState: ADMIN_AUTH_FILE });

test("authenticated admin session cookie is present after setup", async ({ page }) => {
  const runtime = getPlaywrightRuntimeConfig();

  await page.goto(runtime.baseURL);
  const cookies = await page.context().cookies();
  const sessionCookie = cookies.find((cookie) => cookie.name === "better-auth.session_token");

  expect(sessionCookie?.value.length).toBeGreaterThan(0);
});
