import { Elysia } from "elysia";

import { errorMessage, requireSessionUser } from "@/modules/auth/_lib/session";
import type { AuthModel as AuthModelTypes } from "@/modules/auth/_types/auth";
import { AuthModel } from "@/modules/auth/model";
import { Auth } from "@/modules/auth/service";

export const authModule = new Elysia({ prefix: "/auth" })
  .post(
    "/sign-in",
    async ({ body, cookie: { session }, status }) => {
      const response = await Auth.signIn(body);

      if (!response) {
        return status(
          400,
          "Invalid username or password" satisfies AuthModelTypes["signInInvalid"],
        );
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
  )
  .get(
    "/me",
    async ({ request, status }) => {
      try {
        const actor = await requireSessionUser(request.headers);
        return {
          id: actor.id,
          email: actor.email,
          name: actor.name,
          role: actor.role,
        };
      } catch (error) {
        const message = errorMessage(error, "Unauthorized");
        return status(401, { message });
      }
    },
    {
      response: {
        200: AuthModel.meResponse,
        401: AuthModel.errorResponse,
      },
    },
  );
