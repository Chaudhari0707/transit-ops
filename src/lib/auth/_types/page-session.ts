import type { UserRole } from "@/lib/auth/_types/user-role";

export type PageSession = {
  email: string;
  name: string;
  role: UserRole;
  userId: string;
};
