import { test as setup } from "@playwright/test";

import { signInWithApi } from "./support/auth-api";
import {
  ADMIN_AUTH_FILE,
  ensurePlaywrightAuthDirectory,
  getPlaywrightRuntimeConfig,
} from "./support/env";

const runtime = getPlaywrightRuntimeConfig();

setup.beforeAll(async () => {
  await ensurePlaywrightAuthDirectory();
});

setup("authenticate admin via API", async ({ page }) => {
  await signInWithApi(page, {
    username: runtime.adminUsername,
    password: runtime.adminPassword,
  });

  await page.context().storageState({ path: ADMIN_AUTH_FILE });
});
