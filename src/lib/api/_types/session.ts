import type { UserRole } from "@/lib/db/schema/_types/roles";

export type SessionUser = {
  email: string;
  id: string;
  name: string;
  role: UserRole;
};
