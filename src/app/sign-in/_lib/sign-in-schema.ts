import { z } from "zod";

import { USER_ROLES } from "@/lib/auth/_types/user-role";

export const signInSchema = z.object({
  email: z.string().trim().pipe(z.email("Enter a valid email address")),
  password: z.string().trim().min(1, "Password is required"),
  role: z.enum(USER_ROLES, { message: "Select your role" }),
});
