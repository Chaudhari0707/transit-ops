import { type UnwrapSchema } from "elysia";

import type { AuthModel as AuthModelValue } from "@/modules/auth/model";

export type AuthModel = {
  [K in keyof typeof AuthModelValue]: UnwrapSchema<(typeof AuthModelValue)[K]>;
};
