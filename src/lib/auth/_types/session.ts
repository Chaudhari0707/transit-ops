import type { UserRole } from "@/lib/auth/_types/user-role";

export type AuthSessionUser = {
  email: string;
  id: string;
  name: string;
  role: UserRole;
  userId: string;
};
