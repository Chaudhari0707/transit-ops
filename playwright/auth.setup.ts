import { test as setup } from "@playwright/test";

import { signInWithApi } from "./support/auth-api";
import {
  ADMIN_AUTH_FILE,
  ensurePlaywrightAuthDirectory,
  getPlaywrightRuntimeConfig,
} from "./support/env";
import { loadPlaywrightEnvFiles } from "./support/load-env";

setup.beforeAll(async () => {
  await loadPlaywrightEnvFiles();
  await ensurePlaywrightAuthDirectory();
});

setup("authenticate admin via API", async ({ page }) => {
  await loadPlaywrightEnvFiles();
  const runtime = getPlaywrightRuntimeConfig();

  await signInWithApi(page, {
    username: runtime.adminEmail,
    password: runtime.adminPassword,
  });

  await page.context().storageState({ path: ADMIN_AUTH_FILE });
});
