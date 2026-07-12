import { expect, type Page } from "@playwright/test";

import { LOGIN_ROLE_HEADER } from "@/lib/auth/login-role-header";

import { getPlaywrightRuntimeConfig } from "./env";

export async function signInWithApi(
  page: Page,
  credentials?: { email?: string; password?: string; role?: string },
) {
  const runtime = getPlaywrightRuntimeConfig();
  const email = credentials?.email ?? runtime.adminEmail;
  const password = credentials?.password ?? runtime.adminPassword;
  const role = credentials?.role ?? runtime.adminRole;

  if (!password) {
    throw new Error("Playwright admin password is required for API sign-in.");
  }

  const response = await page.request.post(`${runtime.baseURL}/api/auth/sign-in/email`, {
    data: {
      email,
      password,
    },
    headers: {
      [LOGIN_ROLE_HEADER]: role,
      "x-forwarded-for": "10.20.0.99",
    },
  });

  expect(response.ok()).toBeTruthy();
}
