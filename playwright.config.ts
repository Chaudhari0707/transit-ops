import { defineConfig, devices } from "@playwright/test";

import { getPlaywrightRuntimeConfig } from "./playwright/support/env";
import { loadPlaywrightEnvFiles } from "./playwright/support/load-env";

await loadPlaywrightEnvFiles();

const runtime = getPlaywrightRuntimeConfig();

export default defineConfig({
  testDir: "./playwright",
  timeout: 60_000,
  fullyParallel: true,
  forbidOnly: Boolean(Bun.env.CI),
  retries: Bun.env.CI ? 2 : 0,
  workers: Bun.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: runtime.baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
      testMatch: /smoke\.spec\.ts/,
    },
    {
      name: "chromium-authenticated",
      use: {
        ...devices["Desktop Chrome"],
      },
      dependencies: ["setup"],
      testMatch: /auth-api\.spec\.ts/,
    },
  ],
  webServer: {
    command: `bun run dev -- --hostname 127.0.0.1 --port ${runtime.port}`,
    url: runtime.baseURL,
    reuseExistingServer: !Bun.env.CI,
    timeout: 120_000,
  },
});
