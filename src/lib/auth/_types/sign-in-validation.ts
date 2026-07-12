import type { UserRole } from "@/lib/auth/_types/user-role";

export type SignInSessionUser = {
  deletedAt?: Date | string | null;
  isActive?: boolean;
  role?: string;
};

export type SignInValidationResult =
  | { ok: true; selectedRole: UserRole }
  | { message: string; ok: false; status: 400 | 401 };
