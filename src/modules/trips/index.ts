import { Elysia } from "elysia";

import { errorMessage, resolveErrorCodeFor } from "@/lib/api/errors";
import { requireUser } from "@/lib/api/session";
import { TripsModel } from "@/modules/trips/model";
import { TripsService } from "@/modules/trips/service";

const READ_ERRORS = [400, 401, 403, 404] as const;
const WRITE_ERRORS = [400, 401, 403, 404] as const;
const DISPATCH_ERRORS = [400, 401, 403, 404, 409] as const;

export const tripsModule = new Elysia({ name: "trips", prefix: "/trips" })
  .get(
    "/assignables/vehicles",
    async ({ request, status }) => {
      try {
        const actor = await requireUser(request.headers);
        return await TripsService.listAssignableVehicles(actor);
      } catch (error) {
        const message = errorMessage(error, "Unable to list assignable vehicles");
        return status(resolveErrorCodeFor(message, READ_ERRORS), { message });
      }
    },
    {
      response: {
        200: TripsModel.assignableVehiclesResponse,
        400: TripsModel.errorResponse,
        401: TripsModel.errorResponse,
        403: TripsModel.errorResponse,
        404: TripsModel.errorResponse,
      },
    },
  )
  .get(
    "/assignables/drivers",
    async ({ request, status }) => {
      try {
        const actor = await requireUser(request.headers);
        return await TripsService.listAssignableDrivers(actor);
      } catch (error) {
        const message = errorMessage(error, "Unable to list assignable drivers");
        return status(resolveErrorCodeFor(message, READ_ERRORS), { message });
      }
    },
    {
      response: {
        200: TripsModel.assignableDriversResponse,
        400: TripsModel.errorResponse,
        401: TripsModel.errorResponse,
        403: TripsModel.errorResponse,
        404: TripsModel.errorResponse,
      },
    },
  )
  .get(
    "/",
    async ({ request, query, status }) => {
      try {
        const actor = await requireUser(request.headers);
        return await TripsService.list(actor, query.status);
      } catch (error) {
        const message = errorMessage(error, "Unable to list trips");
        return status(resolveErrorCodeFor(message, READ_ERRORS), { message });
      }
    },
    {
      query: TripsModel.listQuery,
      response: {
        200: TripsModel.listResponse,
        400: TripsModel.errorResponse,
        401: TripsModel.errorResponse,
        403: TripsModel.errorResponse,
        404: TripsModel.errorResponse,
      },
    },
  )
  .get(
    "/:id",
    async ({ request, params, status }) => {
      try {
        const actor = await requireUser(request.headers);
        return await TripsService.getById(actor, params.id);
      } catch (error) {
        const message = errorMessage(error, "Unable to get trip");
        return status(resolveErrorCodeFor(message, READ_ERRORS), { message });
      }
    },
    {
      params: TripsModel.idParams,
      response: {
        200: TripsModel.tripResponse,
        400: TripsModel.errorResponse,
        401: TripsModel.errorResponse,
        403: TripsModel.errorResponse,
        404: TripsModel.errorResponse,
      },
    },
  )
  .post(
    "/",
    async ({ body, request, status }) => {
      try {
        const actor = await requireUser(request.headers);
        return await TripsService.create(actor, body);
      } catch (error) {
        const message = errorMessage(error, "Unable to create trip");
        return status(resolveErrorCodeFor(message, WRITE_ERRORS), { message });
      }
    },
    {
      body: TripsModel.createBody,
      response: {
        201: TripsModel.tripResponse,
        400: TripsModel.errorResponse,
        401: TripsModel.errorResponse,
        403: TripsModel.errorResponse,
        404: TripsModel.errorResponse,
      },
    },
  )
  .patch(
    "/:id",
    async ({ body, request, params, status }) => {
      try {
        const actor = await requireUser(request.headers);
        return await TripsService.update(actor, params.id, body);
      } catch (error) {
        const message = errorMessage(error, "Unable to update trip");
        return status(resolveErrorCodeFor(message, WRITE_ERRORS), { message });
      }
    },
    {
      params: TripsModel.idParams,
      body: TripsModel.updateBody,
      response: {
        200: TripsModel.tripResponse,
        400: TripsModel.errorResponse,
        401: TripsModel.errorResponse,
        403: TripsModel.errorResponse,
        404: TripsModel.errorResponse,
      },
    },
  )
  .post(
    "/:id/dispatch",
    async ({ request, params, status }) => {
      try {
        const actor = await requireUser(request.headers);
        return await TripsService.dispatch(actor, params.id);
      } catch (error) {
        const message = errorMessage(error, "Unable to dispatch trip");
        return status(resolveErrorCodeFor(message, DISPATCH_ERRORS), { message });
      }
    },
    {
      params: TripsModel.idParams,
      response: {
        200: TripsModel.tripResponse,
        400: TripsModel.errorResponse,
        401: TripsModel.errorResponse,
        403: TripsModel.errorResponse,
        404: TripsModel.errorResponse,
        409: TripsModel.errorResponse,
      },
    },
  )
  .post(
    "/:id/cancel",
    async ({ body, request, params, status }) => {
      try {
        const actor = await requireUser(request.headers);
        return await TripsService.cancel(actor, params.id, body.cancelReason);
      } catch (error) {
        const message = errorMessage(error, "Unable to cancel trip");
        return status(resolveErrorCodeFor(message, WRITE_ERRORS), { message });
      }
    },
    {
      params: TripsModel.idParams,
      body: TripsModel.cancelBody,
      response: {
        200: TripsModel.tripResponse,
        400: TripsModel.errorResponse,
        401: TripsModel.errorResponse,
        403: TripsModel.errorResponse,
        404: TripsModel.errorResponse,
      },
    },
  )
  .post(
    "/:id/complete",
    async ({ body, request, params, status }) => {
      try {
        const actor = await requireUser(request.headers);
        return await TripsService.complete(actor, params.id, body);
      } catch (error) {
        const message = errorMessage(error, "Unable to complete trip");
        return status(resolveErrorCodeFor(message, WRITE_ERRORS), { message });
      }
    },
    {
      params: TripsModel.idParams,
      body: TripsModel.completeBody,
      response: {
        200: TripsModel.tripResponse,
        400: TripsModel.errorResponse,
        401: TripsModel.errorResponse,
        403: TripsModel.errorResponse,
        404: TripsModel.errorResponse,
      },
    },
  );
