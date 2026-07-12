type PlaywrightRuntimeConfig = {
  adminEmail: string;
  adminPassword?: string;
  adminRole: string;
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

export function getPlaywrightRuntimeConfig(): PlaywrightRuntimeConfig {
  const baseURL = requireEnvValue("PLAYWRIGHT_BASE_URL");
  const parsedBaseUrl = new URL(baseURL);

  return {
    adminEmail: requireEnvValue("PLAYWRIGHT_ADMIN_EMAIL", "AUTH_ADMIN_EMAIL"),
    adminUsername: requireEnvValue("PLAYWRIGHT_ADMIN_USERNAME", "AUTH_ADMIN_USERNAME"),
    adminPassword:
      getEnvValue("PLAYWRIGHT_ADMIN_PASSWORD") ?? getEnvValue("AUTH_ADMIN_PASSWORD") ?? undefined,
    adminRole: getEnvValue("PLAYWRIGHT_ADMIN_ROLE") ?? "fleet_manager",
    baseURL: parsedBaseUrl.toString().replace(/\/$/, ""),
    port: Number(parsedBaseUrl.port),
  };
}
