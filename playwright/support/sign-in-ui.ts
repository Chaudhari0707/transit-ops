import { expect, type Page } from "@playwright/test";

import { USER_ROLE_LABELS, type UserRole } from "@/lib/auth/_types/user-role";

import { gotoRoute } from "./navigation";

export async function gotoSignIn(page: Page) {
  await gotoRoute(page, "/sign-in");
  await expect(page.getByRole("heading", { name: "Sign in to TransitOps" })).toBeVisible();
  // Wait until client handlers are mounted (avoids pre-hydration native form posts).
  await expect(page.locator('form[data-ready="true"]')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("button", { name: "Sign in" })).toBeEnabled();
}

export async function fillSignInForm(
  page: Page,
  credentials: {
    email: string;
    password: string;
    role: UserRole;
  },
) {
  // Role first: changing role autofills demo credentials, so set email/password after.
  const roleLabel = USER_ROLE_LABELS[credentials.role];
  const roleTrigger = page.getByRole("combobox", { name: "Role" });
  const selectedRole = await roleTrigger.innerText();

  if (!selectedRole.includes(credentials.role) && !selectedRole.includes(roleLabel)) {
    await roleTrigger.click();
    const option = page.getByRole("option", { name: roleLabel });
    await expect(option).toBeVisible({ timeout: 10_000 });
    await option.click();
    // Trigger may show enum value or human label depending on SelectValue rendering.
    await expect(roleTrigger).toContainText(new RegExp(`${credentials.role}|${roleLabel}`, "i"));
  }

  await page.locator("#email").fill(credentials.email);
  await page.locator("#password").fill(credentials.password);
  await expect(page.locator("#email")).toHaveValue(credentials.email);
  await expect(page.locator("#password")).toHaveValue(credentials.password);
}

export async function submitSignIn(page: Page, options?: { waitForAuthResponse?: boolean }) {
  const submitButton = page.getByRole("button", { name: "Sign in" });
  await expect(submitButton).toBeEnabled();

  if (options?.waitForAuthResponse) {
    const signInResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/api/auth/sign-in/email") &&
        response.request().method() === "POST",
      { timeout: 30_000 },
    );

    await submitButton.click();
    await signInResponse;
    await expect(page.getByRole("button", { name: "Signing in..." })).toBeHidden({
      timeout: 15_000,
    });
    return;
  }

  await submitButton.click();
}
