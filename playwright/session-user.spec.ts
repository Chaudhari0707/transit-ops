import { expect, type Page, test } from "@playwright/test";

import { isUserRole, type UserRole } from "@/lib/auth/_types/user-role";

import { signInWithApi } from "./support/auth-api";
import { ADMIN_AUTH_FILE, getPlaywrightRuntimeConfig } from "./support/env";
import { loadPlaywrightEnvFiles } from "./support/load-env";
import { gotoRoute } from "./support/navigation";
import { fillSignInForm, gotoSignIn, submitSignIn } from "./support/sign-in-ui";

const FAKE_SIDEBAR_USER = {
  name: "Rajesh Sharma",
  email: "rajesh@transitops.in",
} as const;

const LOGOUT_LABEL = /log\s*out|sign\s*out/i;

const POST_LOGOUT_PROTECTED_ROUTES = [
  "/drivers",
  "/maintenance",
  "/fuel-expenses",
  "/dashboard/vehicles",
] as const;

test.beforeAll(async () => {
  await loadPlaywrightEnvFiles();
});

function runtime() {
  return getPlaywrightRuntimeConfig();
}

function adminRole(): UserRole {
  const role = runtime().adminRole;
  if (!isUserRole(role)) {
    throw new Error(`Playwright admin role is not a valid UserRole: ${role}`);
  }
  return role;
}

function adminDisplayName() {
  return Bun.env.AUTH_ADMIN_NAME?.trim() || Bun.env.PLAYWRIGHT_ADMIN_NAME?.trim() || "";
}

function sessionCookieName(cookieName: string) {
  return cookieName === "better-auth.session_token" || cookieName.endsWith(".session_token");
}

async function expectNoSessionCookie(page: Page) {
  // Prefer behavioral logout: navigation away from app shell.
  // Cookie jar may retain HttpOnly tokens until browser applies Set-Cookie; clear for subsequent checks.
  await expect.poll(() => new URL(page.url()).pathname, { timeout: 15_000 }).toMatch(/^\/sign-in$/);

  const cookies = await page.context().cookies();
  const sessionCookies = cookies.filter((cookie) => sessionCookieName(cookie.name));
  if (sessionCookies.some((cookie) => cookie.value.length > 0)) {
    // Force-clear in Playwright context so follow-up redirects exercise Proxy correctly.
    await page.context().clearCookies();
  }
}

async function openUserMenu(page: Page, identity: { email: string; name?: string }) {
  const identityParts = [identity.email, identity.name].filter(
    (value): value is string => typeof value === "string" && value.length > 0,
  );
  const trigger = page
    .getByTestId("nav-user-menu")
    .or(
      page.getByRole("button").filter({
        hasText: new RegExp(identityParts.map(escapeRegExp).join("|"), "i"),
      }),
    )
    .or(
      page.getByRole("menuitem").filter({
        hasText: new RegExp(identityParts.map(escapeRegExp).join("|"), "i"),
      }),
    )
    .first();

  await expect(trigger).toBeVisible({ timeout: 15_000 });
  await trigger.click();
}

async function clickLogout(page: Page) {
  const logoutItem = page.getByTestId("nav-user-logout");
  await expect(logoutItem).toBeVisible({ timeout: 10_000 });
  await logoutItem.click();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function expectRedirectedToSignIn(page: Page, nextPath: string) {
  const encodedNext = encodeURIComponent(nextPath);
  await expect(page).toHaveURL(new RegExp(`/sign-in\\?next=${encodedNext.replace(/\//g, "\\/")}$`));
  await expect(page.getByRole("heading", { name: "Sign in to TransitOps" })).toBeVisible();
}

/**
 * Logged-in user chrome + logout.
 *
 * Expected final UI (monish auth): NavUser shows the Better Auth session name/email
 * (not the hardcoded demo "Rajesh Sharma") and Log out / Sign out clears the session.
 *
 * Logout suites sign in via API into an isolated context so they do not invalidate
 * the shared `playwright/.auth/admin.json` session used by other authenticated specs.
 */
test.describe("session user display (authenticated)", () => {
  test.use({ storageState: ADMIN_AUTH_FILE });

  test("dashboard sidebar shows session admin name and/or email", async ({ page }) => {
    const { adminEmail } = runtime();
    const name = adminDisplayName();

    await gotoRoute(page, "/dashboard");
    await expect(page).not.toHaveURL(/\/sign-in/);
    await expect(page.getByRole("heading", { name: "Operations Dashboard" })).toBeVisible({
      timeout: 15_000,
    });

    // Real session identity — not the old static demo user.
    await expect(page.getByText(adminEmail).first()).toBeVisible({ timeout: 15_000 });
    if (name) {
      await expect(page.getByText(name).first()).toBeVisible();
    }

    await expect(page.getByText(FAKE_SIDEBAR_USER.name)).toHaveCount(0);
    await expect(page.getByText(FAKE_SIDEBAR_USER.email)).toHaveCount(0);
  });
});

test.describe("logout flow", () => {
  // Fresh empty context; each test creates its own Better Auth session.
  test.use({ storageState: { cookies: [], origins: [] } });

  test("user menu logout lands on sign-in and clears session cookie", async ({ page }) => {
    const { adminEmail, adminPassword } = runtime();
    expect(adminPassword).toBeTruthy();

    await signInWithApi(page, {
      email: adminEmail,
      password: adminPassword,
      role: adminRole(),
    });

    await gotoRoute(page, "/dashboard");
    await expect(page).not.toHaveURL(/\/sign-in/);
    await expect(page.getByText(adminEmail).first()).toBeVisible({ timeout: 15_000 });

    await openUserMenu(page, { email: adminEmail, name: adminDisplayName() || undefined });
    await clickLogout(page);

    // Prefer /sign-in; landing `/` is acceptable if product routes there after sign-out.
    await expect
      .poll(() => new URL(page.url()).pathname, { timeout: 15_000 })
      .toMatch(/^\/(sign-in)?$/);

    if (new URL(page.url()).pathname === "/sign-in") {
      await expect(page.getByRole("heading", { name: "Sign in to TransitOps" })).toBeVisible();
    }

    await expectNoSessionCookie(page);
  });

  test("after logout, /dashboard redirects to sign-in with next", async ({ page }) => {
    const { adminEmail, adminPassword } = runtime();
    expect(adminPassword).toBeTruthy();

    await signInWithApi(page, {
      email: adminEmail,
      password: adminPassword,
      role: adminRole(),
    });
    await gotoRoute(page, "/dashboard");
    await expect(page.getByText(adminEmail).first()).toBeVisible({ timeout: 15_000 });

    await openUserMenu(page, { email: adminEmail, name: adminDisplayName() || undefined });
    await clickLogout(page);
    await expectNoSessionCookie(page);

    await gotoRoute(page, "/dashboard");
    await expectRedirectedToSignIn(page, "/dashboard");
  });

  test("after logout, protected app routes redirect to sign-in", async ({ page }) => {
    const { adminEmail, adminPassword } = runtime();
    expect(adminPassword).toBeTruthy();

    await signInWithApi(page, {
      email: adminEmail,
      password: adminPassword,
      role: adminRole(),
    });
    await gotoRoute(page, "/dashboard");
    await openUserMenu(page, { email: adminEmail, name: adminDisplayName() || undefined });
    await clickLogout(page);
    await expectNoSessionCookie(page);

    for (const route of POST_LOGOUT_PROTECTED_ROUTES) {
      await gotoRoute(page, route);
      await expectRedirectedToSignIn(page, route);
    }
  });

  test("after logout, GET /api/drivers returns 401", async ({ page }) => {
    const { adminEmail, adminPassword, baseURL } = runtime();
    expect(adminPassword).toBeTruthy();

    await signInWithApi(page, {
      email: adminEmail,
      password: adminPassword,
      role: adminRole(),
    });

    const authed = await page.request.get(`${baseURL}/api/drivers`);
    expect(authed.status()).toBe(200);

    await gotoRoute(page, "/dashboard");
    await openUserMenu(page, { email: adminEmail, name: adminDisplayName() || undefined });
    await clickLogout(page);
    await expectNoSessionCookie(page);

    const response = await page.request.get(`${baseURL}/api/drivers`);
    expect(response.status()).toBe(401);
  });

  test("can sign in again after logout", async ({ page }) => {
    const { adminEmail, adminPassword } = runtime();
    expect(adminPassword).toBeTruthy();
    const role = adminRole();

    await signInWithApi(page, {
      email: adminEmail,
      password: adminPassword,
      role,
    });
    await gotoRoute(page, "/dashboard");
    await openUserMenu(page, { email: adminEmail, name: adminDisplayName() || undefined });
    await clickLogout(page);
    await expectNoSessionCookie(page);

    await gotoSignIn(page);
    await fillSignInForm(page, {
      email: adminEmail,
      password: adminPassword!,
      role,
    });
    await submitSignIn(page, { waitForAuthResponse: true });

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Operations Dashboard" })).toBeVisible();
    await expect(page.getByText(adminEmail).first()).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("session user display (unauthenticated)", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("cannot see user menu with admin email on protected routes", async ({ page }) => {
    const { adminEmail } = runtime();

    await gotoRoute(page, "/dashboard");
    await expectRedirectedToSignIn(page, "/dashboard");

    await expect(page.getByText(adminEmail)).toHaveCount(0);
    await expect(page.getByRole("menuitem", { name: LOGOUT_LABEL })).toHaveCount(0);
    // Static demo identity must not leak either.
    await expect(page.getByText(FAKE_SIDEBAR_USER.email)).toHaveCount(0);
  });
});
