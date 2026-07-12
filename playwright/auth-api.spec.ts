import { expect, test } from "@playwright/test";

import { ADMIN_AUTH_FILE, getPlaywrightRuntimeConfig } from "./support/env";

test.use({ storageState: ADMIN_AUTH_FILE });

test("admin API sign-in rejects invalid credentials", async ({ page }) => {
  const runtime = getPlaywrightRuntimeConfig();

  const response = await page.request.post(`${runtime.baseURL}/api/auth/sign-in`, {
    data: {
      username: runtime.adminUsername,
      password: "definitely-wrong-password",
    },
  });

  expect(response.status()).toBe(400);
});

test("authenticated admin session cookie is present after setup", async ({ page }) => {
  const runtime = getPlaywrightRuntimeConfig();

  await page.goto(runtime.baseURL);
  const cookies = await page.context().cookies();
  const sessionCookie = cookies.find((cookie) => cookie.name === "session");

  expect(sessionCookie?.value.length).toBeGreaterThan(0);
});
