import { type BrowserContext, expect, type Page } from "@playwright/test";

import { getPlaywrightRuntimeConfig } from "./env";

type SignInResult = {
  token: string;
  username: string;
};

/**
 * Sign in via Bun fetch (avoids Bun+Playwright page.request URL quirks),
 * then inject the session cookie into the browser context.
 */
export async function signInWithApi(
  page: Page,
  credentials?: { password?: string; username?: string },
) {
  const runtime = getPlaywrightRuntimeConfig();
  const username = credentials?.username ?? runtime.adminEmail ?? runtime.adminUsername;
  const password = credentials?.password ?? runtime.adminPassword;

  if (!password) {
    throw new Error("Playwright admin password is required for API sign-in.");
  }

  const signInUrl = `${runtime.baseURL}/api/auth/sign-in`;
  const response = await fetch(signInUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const rawBody = await response.text();
  expect(response.ok, `sign-in failed: ${response.status} ${rawBody}`).toBeTruthy();

  const body = JSON.parse(rawBody) as SignInResult;
  expect(body.token?.length).toBeGreaterThan(0);

  await applySessionCookie(page.context(), body.token, runtime.baseURL);
}

export async function applySessionCookie(context: BrowserContext, token: string, baseURL: string) {
  const url = new URL(baseURL);
  await context.addCookies([
    {
      name: "session",
      value: token,
      domain: url.hostname,
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      secure: url.protocol === "https:",
    },
  ]);
}
