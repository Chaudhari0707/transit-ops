import type {
  SignInSessionUser,
  SignInValidationResult,
} from "@/lib/auth/_types/sign-in-validation";
import { USER_ROLES, type UserRole } from "@/lib/auth/_types/user-role";

export const SIGN_IN_INVALID_CREDENTIALS_MESSAGE = "Invalid username or password";

export function isUserRole(value: string): value is UserRole {
  return USER_ROLES.includes(value as UserRole);
}

export function validatePostSignInSession(input: {
  selectedRole: string | null | undefined;
  user: SignInSessionUser;
}): SignInValidationResult {
  const normalizedRole = input.selectedRole?.trim();

  if (!normalizedRole || !isUserRole(normalizedRole)) {
    return {
      ok: false,
      status: 400,
      message: SIGN_IN_INVALID_CREDENTIALS_MESSAGE,
    };
  }

  if (input.user.isActive === false || input.user.deletedAt) {
    return {
      ok: false,
      status: 401,
      message: SIGN_IN_INVALID_CREDENTIALS_MESSAGE,
    };
  }

  if (input.user.role !== normalizedRole) {
    return {
      ok: false,
      status: 401,
      message: SIGN_IN_INVALID_CREDENTIALS_MESSAGE,
    };
  }

  return { ok: true, selectedRole: normalizedRole };
}
