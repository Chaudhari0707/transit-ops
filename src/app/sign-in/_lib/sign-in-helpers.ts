import type { SignInFormValues } from "@/app/sign-in/_types/sign-in";
import type { UserRole } from "@/lib/auth/_types/user-role";

/**
 * Demo credentials from `bun run db:seed` / README.
 * Shared password for all seeded role accounts (dev only).
 */
export const DEMO_SIGN_IN_PASSWORD = "password";

/** Role → seeded email + password for quick role switching on the sign-in form. */
export const DEMO_SIGN_IN_BY_ROLE: Record<
  UserRole,
  Pick<SignInFormValues, "email" | "password">
> = {
  fleet_manager: {
    email: "admin@example.com",
    password: DEMO_SIGN_IN_PASSWORD,
  },
  dispatcher: {
    email: "dispatcher@example.com",
    password: DEMO_SIGN_IN_PASSWORD,
  },
  safety_officer: {
    email: "safety@example.com",
    password: DEMO_SIGN_IN_PASSWORD,
  },
  financial_analyst: {
    email: "finance@example.com",
    password: DEMO_SIGN_IN_PASSWORD,
  },
};

export function getDemoCredentialsForRole(
  role: UserRole,
): Pick<SignInFormValues, "email" | "password"> {
  return DEMO_SIGN_IN_BY_ROLE[role];
}

export const signInDefaultValues: SignInFormValues = {
  role: "fleet_manager",
  ...DEMO_SIGN_IN_BY_ROLE.fleet_manager,
};

export function getSignInErrorMessage(error: { message?: string; status?: number }): string {
  if (error.status === 429) {
    return "Account locked after 5 failed attempts. Try again later.";
  }

  return "Invalid username or password";
}
