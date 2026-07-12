import { expect, type Page } from "@playwright/test";

import { LOGIN_ROLE_HEADER } from "@/lib/auth/login-role-header";

import { getPlaywrightRuntimeConfig } from "./env";

function parseSetCookieHeader(header: string): {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
} {
  const parts = header.split(";").map((part) => part.trim());
  const [nameValue, ...attrs] = parts;
  const separator = nameValue?.indexOf("=") ?? -1;
  const name = separator >= 0 ? nameValue!.slice(0, separator) : (nameValue ?? "");
  const value = separator >= 0 ? nameValue!.slice(separator + 1) : "";

  const cookie: {
    name: string;
    value: string;
    domain?: string;
    path?: string;
    expires?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "Strict" | "Lax" | "None";
  } = { name, value, path: "/" };

  for (const attr of attrs) {
    const [rawKey, ...rawValue] = attr.split("=");
    const key = rawKey?.trim().toLowerCase() ?? "";
    const attrValue = rawValue.join("=").trim();

    if (key === "path" && attrValue) cookie.path = attrValue;
    if (key === "domain" && attrValue) cookie.domain = attrValue;
    if (key === "httponly") cookie.httpOnly = true;
    if (key === "secure") cookie.secure = true;
    if (key === "samesite" && attrValue) {
      const normalized = attrValue.toLowerCase();
      if (normalized === "strict" || normalized === "lax" || normalized === "none") {
        cookie.sameSite = (normalized.charAt(0).toUpperCase() + normalized.slice(1)) as
          | "Strict"
          | "Lax"
          | "None";
      }
    }
    if (key === "max-age" && attrValue) {
      const maxAge = Number(attrValue);
      if (Number.isFinite(maxAge)) {
        cookie.expires = Math.floor(Date.now() / 1000) + maxAge;
      }
    }
  }

  return cookie;
}

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

  if (!runtime.baseURL) {
    throw new Error("Playwright baseURL is required for API sign-in.");
  }

  const signInUrl = `${runtime.baseURL.replace(/\/$/, "")}/api/auth/sign-in/email`;

  // Use global fetch — page.request has URL-resolution issues under bun+playwright.
  const response = await fetch(signInUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: runtime.baseURL,
      [LOGIN_ROLE_HEADER]: role,
      "x-forwarded-for": "10.20.0.99",
    },
    body: JSON.stringify({ email, password }),
  });

  expect(response.ok).toBeTruthy();

  const setCookies =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : (() => {
          const single = response.headers.get("set-cookie");
          return single ? [single] : [];
        })();

  expect(setCookies.length).toBeGreaterThan(0);

  const host = new URL(runtime.baseURL).hostname;
  const cookies = setCookies.map((header) => {
    const parsed = parseSetCookieHeader(header);
    return {
      name: parsed.name,
      value: parsed.value,
      domain: parsed.domain ?? host,
      path: parsed.path ?? "/",
      expires: parsed.expires,
      httpOnly: parsed.httpOnly,
      secure: parsed.secure ?? false,
      sameSite: parsed.sameSite ?? ("Lax" as const),
    };
  });

  await page.context().addCookies(cookies);
}
