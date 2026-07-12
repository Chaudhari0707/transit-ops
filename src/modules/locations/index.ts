import { Elysia } from "elysia";

import { errorMessage, resolveErrorCodeFor } from "@/lib/api/errors";
import { requireUser } from "@/lib/api/session";
import { LocationsModel } from "@/modules/locations/model";
import { LocationsService } from "@/modules/locations/service";

const LIST_ERRORS = [400, 401, 403] as const;
const CREATE_ERRORS = [400, 401, 403, 409] as const;

export const locationsModule = new Elysia({ name: "locations", prefix: "/locations" })
  .get(
    "/",
    async ({ request, status }) => {
      try {
        const actor = await requireUser(request.headers);
        return await LocationsService.list(actor);
      } catch (error) {
        const message = errorMessage(error, "Unable to list locations");
        return status(resolveErrorCodeFor(message, LIST_ERRORS), { message });
      }
    },
    {
      response: {
        200: LocationsModel.listResponse,
        400: LocationsModel.errorResponse,
        401: LocationsModel.errorResponse,
        403: LocationsModel.errorResponse,
      },
    },
  )
  .post(
    "/",
    async ({ body, request, status }) => {
      try {
        const actor = await requireUser(request.headers);
        return await LocationsService.create(actor, body);
      } catch (error) {
        const message = errorMessage(error, "Unable to create location");
        return status(resolveErrorCodeFor(message, CREATE_ERRORS), { message });
      }
    },
    {
      body: LocationsModel.createBody,
      response: {
        201: LocationsModel.createResponse,
        400: LocationsModel.errorResponse,
        401: LocationsModel.errorResponse,
        403: LocationsModel.errorResponse,
        409: LocationsModel.errorResponse,
      },
    },
  );
