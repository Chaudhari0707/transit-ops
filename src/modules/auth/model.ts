import { t } from "elysia";

export const AuthModel = {
  signInBody: t.Object({
    username: t.String(),
    password: t.String(),
  }),
  signInResponse: t.Object({
    username: t.String(),
    token: t.String(),
  }),
  signInInvalid: t.Literal("Invalid username or password"),
  errorResponse: t.Object({
    message: t.String(),
  }),
  meResponse: t.Object({
    id: t.String(),
    email: t.String(),
    name: t.String(),
    role: t.Union([
      t.Literal("fleet_manager"),
      t.Literal("dispatcher"),
      t.Literal("safety_officer"),
      t.Literal("financial_analyst"),
    ]),
  }),
} as const;
