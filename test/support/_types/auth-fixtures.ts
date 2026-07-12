import type { UserRole } from "@/lib/auth/_types/user-role";

export type TestAuthUser = {
  deletedAt: Date | null;
  email: string;
  fullName: string;
  isActive: boolean;
  password: string;
  phoneNumber: string;
  role: UserRole;
};
