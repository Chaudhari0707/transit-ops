import { Elysia } from "elysia";

import type { AuthModel as AuthModelTypes } from "@/modules/auth/_types/auth";
import { AuthModel } from "@/modules/auth/model";
import { Auth } from "@/modules/auth/service";

export const authModule = new Elysia({ prefix: "/auth" }).post(
  "/sign-in",
  async ({ body, cookie: { session }, status }) => {
    const response = await Auth.signIn(body);

    if (!response) {
      return status(400, "Invalid username or password" satisfies AuthModelTypes["signInInvalid"]);
    }

    if (session) {
      session.value = response.token;
    }

    return response;
  },
  {
    body: AuthModel.signInBody,
    response: {
      200: AuthModel.signInResponse,
      400: AuthModel.signInInvalid,
    },
  },
);
