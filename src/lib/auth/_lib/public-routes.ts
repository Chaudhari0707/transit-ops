/**
 * Paths that do not require a Better Auth session cookie (Proxy layer).
 *
 * Note: `src/proxy.ts` matcher already excludes `api/*` (Next auth guide).
 * Service layer still enforces session on domain APIs.
 */

const PUBLIC_EXACT = new Set(["/", "/sign-in"]);

export function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) {
    return true;
  }

  // Sign-in nested segments (if any)
  if (pathname.startsWith("/sign-in/")) {
    return true;
  }

  // Static assets under public/ (also skipped by matcher for file extensions)
  if (pathname.startsWith("/images/")) {
    return true;
  }

  return false;
}

/** App shell / ops routes that must never render without login. */
export const PROTECTED_APP_ROUTES = [
  "/dashboard",
  "/drivers",
  "/maintenance",
  "/fuel-expenses",
  "/trips",
] as const;

export function isProtectedAppPath(pathname: string): boolean {
  return PROTECTED_APP_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}
