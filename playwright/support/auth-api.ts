import { expect, type Page } from "@playwright/test";

import { getPlaywrightRuntimeConfig } from "./env";

export async function signInWithApi(
  page: Page,
  credentials?: { password?: string; username: string },
) {
  const runtime = getPlaywrightRuntimeConfig();
  const username = credentials?.username ?? runtime.adminUsername;
  const password = credentials?.password ?? runtime.adminPassword;

  if (!password) {
    throw new Error("Playwright admin password is required for API sign-in.");
  }

  const response = await page.request.post(`${runtime.baseURL}/api/auth/sign-in`, {
    data: {
      username,
      password,
    },
  });

  expect(response.ok()).toBeTruthy();
}
