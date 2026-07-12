import { expect, test } from "@playwright/test";

import { LOGIN_ROLE_HEADER } from "@/lib/auth/login-role-header";

import { getPlaywrightRuntimeConfig } from "./support/env";

test("admin API sign-in rejects invalid credentials", async ({ page }) => {
  const runtime = getPlaywrightRuntimeConfig();

  const response = await page.request.post(`${runtime.baseURL}/api/auth/sign-in/email`, {
    data: {
      email: runtime.adminEmail,
      password: "definitely-wrong-password",
    },
    headers: {
      [LOGIN_ROLE_HEADER]: runtime.adminRole,
      "x-forwarded-for": "10.20.0.1",
    },
  });

  expect(response.status()).toBe(401);
});

test("admin API sign-in rejects role mismatch", async ({ page }) => {
  const runtime = getPlaywrightRuntimeConfig();

  const response = await page.request.post(`${runtime.baseURL}/api/auth/sign-in/email`, {
    data: {
      email: runtime.adminEmail,
      password: runtime.adminPassword,
    },
    headers: {
      [LOGIN_ROLE_HEADER]: "dispatcher",
      "x-forwarded-for": "10.20.0.2",
    },
  });

  expect(response.status()).toBe(401);
  expect(await response.json()).toMatchObject({
    message: "Invalid username or password",
  });
});

test("admin API sign-in rejects missing role header", async ({ page }) => {
  const runtime = getPlaywrightRuntimeConfig();

  const response = await page.request.post(`${runtime.baseURL}/api/auth/sign-in/email`, {
    data: {
      email: runtime.adminEmail,
      password: runtime.adminPassword,
    },
    headers: {
      "x-forwarded-for": "10.20.0.3",
    },
  });

  expect(response.status()).toBe(400);
});
