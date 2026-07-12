type PlaywrightRuntimeConfig = {
  /** Email used for transitional `/api/auth/sign-in` (preferred over username). */
  adminEmail: string;
  adminPassword?: string;
  adminUsername: string;
  baseURL: string;
  port: number;
};

const AUTH_DIR = `${import.meta.dir}/../.auth`;

let authDirectoryPromise: Promise<void> | null = null;

export const ADMIN_AUTH_FILE = `${AUTH_DIR}/admin.json`;

export function ensurePlaywrightAuthDirectory() {
  if (authDirectoryPromise) {
    return authDirectoryPromise;
  }

  authDirectoryPromise = Bun.$`mkdir -p ${AUTH_DIR}`.then(() => undefined);

  return authDirectoryPromise;
}

function getEnvValue(key: string) {
  return Bun.env[key];
}

function requireEnvValue(...keys: string[]) {
  for (const key of keys) {
    const value = getEnvValue(key);

    if (value) {
      return value;
    }
  }

  throw new Error(`Missing required Playwright value. Checked: ${keys.join(", ")}`);
}

let envLoaded = false;

async function ensureEnvLoaded() {
  if (envLoaded) {
    return;
  }
  const { loadPlaywrightEnvFiles } = await import("./load-env");
  await loadPlaywrightEnvFiles();
  envLoaded = true;
}

/** Sync load for workers: read env files if PLAYWRIGHT_BASE_URL missing. */
function ensureEnvLoadedSync() {
  if (Bun.env.PLAYWRIGHT_BASE_URL) {
    return;
  }
  // Best-effort: config already loaded env in main process; workers inherit shell env.
  // If still missing, caller's config import path should have set it.
}

export function getPlaywrightRuntimeConfig(): PlaywrightRuntimeConfig {
  ensureEnvLoadedSync();

  const baseURL = requireEnvValue("PLAYWRIGHT_BASE_URL");
  const parsedBaseUrl = new URL(baseURL);

  return {
    adminEmail: requireEnvValue("PLAYWRIGHT_ADMIN_EMAIL", "AUTH_ADMIN_EMAIL"),
    adminUsername: requireEnvValue("PLAYWRIGHT_ADMIN_USERNAME", "AUTH_ADMIN_USERNAME"),
    adminPassword:
      getEnvValue("PLAYWRIGHT_ADMIN_PASSWORD") ?? getEnvValue("AUTH_ADMIN_PASSWORD") ?? undefined,
    baseURL: parsedBaseUrl.toString().replace(/\/$/, ""),
    port: Number(parsedBaseUrl.port) || 3000,
  };
}

export { ensureEnvLoaded };
