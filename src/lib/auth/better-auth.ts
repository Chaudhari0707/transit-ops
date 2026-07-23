import "@/lib/runtime/bun-env-polyfill";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { expireCookie } from "better-auth/cookies";
import { nextCookies } from "better-auth/next-js";

import { validatePostSignInSession } from "@/lib/auth/_lib/sign-in-validation";
import { USER_ROLES } from "@/lib/auth/_types/user-role";
import { LOGIN_ROLE_HEADER } from "@/lib/auth/login-role-header";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { getDb } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";

type AuthInstance = ReturnType<typeof createAuth>;

let authInstance: AuthInstance | undefined;

function createAuth() {
  return betterAuth({
    secret: getAuthSecret(),
    baseURL: getBaseUrl(),
    trustedOrigins: getTrustedOrigins(),
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      password: {
        hash: hashPassword,
        verify: verifyPassword,
      },
    },
    user: {
      additionalFields: {
        role: {
          type: [...USER_ROLES],
          required: true,
          input: false,
        },
        phoneNumber: {
          type: "string",
          required: false,
          input: false,
        },
        isActive: {
          type: "boolean",
          required: true,
          defaultValue: true,
          input: false,
        },
        deletedAt: {
          type: "date",
          required: false,
          input: false,
        },
        createdByUserId: {
          type: "string",
          required: false,
          input: false,
        },
      },
    },
    rateLimit: {
      // Playwright browser tests share one client IP; lockout would flake e2e auth flows.
      // Unit tests cover lockout with unique X-Forwarded-For values.
      enabled: Bun.env.AUTH_RATE_LIMIT_ENABLED !== "false",
      window: 15 * 60,
      max: 5,
      customRules: {
        "/sign-in/email": {
          window: 15 * 60,
          max: 5,
        },
      },
    },
    hooks: {
      after: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== "/sign-in/email") {
          return;
        }

        const newSession = ctx.context.newSession;

        if (!newSession) {
          return;
        }

        const validation = validatePostSignInSession({
          selectedRole: ctx.headers?.get(LOGIN_ROLE_HEADER),
          user: newSession.user as typeof newSession.user & {
            deletedAt?: Date | string | null;
            isActive?: boolean;
            role?: string;
          },
        });

        if (!validation.ok) {
          await ctx.context.internalAdapter.deleteSession(newSession.session.token);
          expireCookie(ctx, ctx.context.authCookies.sessionToken);
          throw new APIError(validation.status === 400 ? "BAD_REQUEST" : "UNAUTHORIZED", {
            message: validation.message,
          });
        }
      }),
    },
    plugins: [nextCookies()],
  });
}

function getAuth() {
  if (!authInstance) {
    authInstance = createAuth();
  }

  return authInstance;
}

function getTrustedOrigins() {
  const configured = Bun.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  if (configured && configured.length > 0) {
    return configured;
  }

  const appOrigin = getAppOrigin();

  return appOrigin ? [appOrigin] : undefined;
}

function getAuthSecret() {
  const secret = Bun.env.BETTER_AUTH_SECRET?.trim();

  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET is required.");
  }

  return secret;
}

function getBaseUrl() {
  const baseUrl =
    Bun.env.BETTER_AUTH_URL?.trim() ?? Bun.env.NEXT_PUBLIC_APP_URL?.trim() ?? getAppOrigin();

  if (!baseUrl) {
    throw new Error("BETTER_AUTH_URL or NEXT_PUBLIC_APP_URL is required.");
  }

  return baseUrl;
}

function getAppOrigin() {
  const vercelUrl = Bun.env.VERCEL_URL?.trim();

  if (!vercelUrl) {
    return undefined;
  }

  return vercelUrl.startsWith("http://") || vercelUrl.startsWith("https://")
    ? vercelUrl
    : `https://${vercelUrl}`;
}

export const auth = new Proxy({} as AuthInstance, {
  get(_target, property, receiver) {
    return Reflect.get(getAuth(), property, receiver);
  },
  has(_target, property) {
    return property in getAuth();
  },
  ownKeys() {
    return Reflect.ownKeys(getAuth());
  },
  getOwnPropertyDescriptor(_target, property) {
    const descriptor = Reflect.getOwnPropertyDescriptor(getAuth(), property);

    if (descriptor) {
      descriptor.configurable = true;
    }

    return descriptor;
  },
}) as AuthInstance;
