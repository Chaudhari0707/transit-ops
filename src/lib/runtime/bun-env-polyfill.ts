/**
 * Global Bun.env polyfill for Next.js sandboxes where native Bun is absent
 * (e.g. Node workers when process hijacking does not apply).
 * Import at app root and in any module that reads Bun.env during module init.
 */
if (typeof Bun === "undefined") {
  (globalThis as Record<string, unknown>).Bun = {
    env: (globalThis as Record<string, unknown>).process
      ? (((globalThis as Record<string, unknown>).process as Record<string, unknown>).env ?? {})
      : {},
  };
}
