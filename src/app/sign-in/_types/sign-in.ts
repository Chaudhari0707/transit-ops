import type { z } from "zod";

import type { signInSchema } from "@/app/sign-in/_lib/sign-in-schema";

export type SignInFormValues = z.infer<typeof signInSchema>;
