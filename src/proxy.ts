import { type NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

import { isPublicPath } from "@/lib/auth/_lib/public-routes";

/**
 * Optimistic auth gate — Next.js Authentication guide:
 * https://nextjs.org/docs/app/guides/authentication#optimistic-checks-with-proxy-optional
 *
 * Rules (Next 16 Proxy / former Middleware):
 * - Only read session **cookie presence** here (no DB / getSession).
 * - Real session + role checks live in `requirePageSession` + domain services (DAL).
 * - Matcher skips `api/*` so API handlers own 401 JSON (data-access layer).
 * - Public pages: `/`, `/sign-in`, static assets under `public/images`.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes stay open (landing, sign-in, images).
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Optimistic check: cookie only (Better Auth). No DB in Proxy.
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    const signInUrl = new URL("/sign-in", request.url);
    const nextTarget = `${pathname}${request.nextUrl.search}`;
    signInUrl.searchParams.set("next", nextTarget);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Align with Next.js auth guide matcher pattern:
     * - Skip API routes (auth + domain APIs protect themselves)
     * - Skip Next internals + common static extensions
     * Docs: authentication.md → "Optimistic checks with Proxy"
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
