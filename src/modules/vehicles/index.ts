import { Elysia } from "elysia";

import { errorMessage, resolveErrorCodeNumber } from "@/lib/api/errors";
import { VehiclesModel } from "@/modules/vehicles/model";
import { VehiclesService } from "@/modules/vehicles/service";

function errorBody(message: string) {
  return { message };
}

export const vehiclesModule = new Elysia({ name: "vehicles", prefix: "/vehicles" })
  .get(
    "/",
    async ({ request, query, status }) => {
      try {
        return await VehiclesService.list(request.headers, query);
      } catch (error) {
        const message = errorMessage(error, "Unable to list vehicles");
        const code = resolveErrorCodeNumber(message);
        if (code === 401) return status(401, errorBody(message));
        if (code === 403) return status(403, errorBody(message));
        if (code === 404) return status(404, errorBody(message));
        if (code === 409) return status(409, errorBody(message));
        if (code === 429) return status(429, errorBody(message));
        return status(400, errorBody(message));
      }
    },
    {
      query: VehiclesModel.listQuery,
      response: {
        200: VehiclesModel.listResponse,
        400: VehiclesModel.errorResponse,
        401: VehiclesModel.errorResponse,
        403: VehiclesModel.errorResponse,
        404: VehiclesModel.errorResponse,
        409: VehiclesModel.errorResponse,
        429: VehiclesModel.errorResponse,
      },
    },
  )
  .get(
    "/:id",
    async ({ request, params, status }) => {
      try {
        return await VehiclesService.getById(request.headers, params.id);
      } catch (error) {
        const message = errorMessage(error, "Unable to get vehicle");
        const code = resolveErrorCodeNumber(message);
        if (code === 401) return status(401, errorBody(message));
        if (code === 403) return status(403, errorBody(message));
        if (code === 404) return status(404, errorBody(message));
        if (code === 409) return status(409, errorBody(message));
        if (code === 429) return status(429, errorBody(message));
        return status(400, errorBody(message));
      }
    },
    {
      params: VehiclesModel.idParams,
      response: {
        200: VehiclesModel.vehicleResponse,
        400: VehiclesModel.errorResponse,
        401: VehiclesModel.errorResponse,
        403: VehiclesModel.errorResponse,
        404: VehiclesModel.errorResponse,
        409: VehiclesModel.errorResponse,
        429: VehiclesModel.errorResponse,
      },
    },
  )
  .post(
    "/",
    async ({ request, body, status }) => {
      try {
        return await VehiclesService.create(request.headers, body);
      } catch (error) {
        const message = errorMessage(error, "Unable to create vehicle");
        const code = resolveErrorCodeNumber(message);
        if (code === 401) return status(401, errorBody(message));
        if (code === 403) return status(403, errorBody(message));
        if (code === 404) return status(404, errorBody(message));
        if (code === 409) return status(409, errorBody(message));
        if (code === 429) return status(429, errorBody(message));
        return status(400, errorBody(message));
      }
    },
    {
      body: VehiclesModel.createBody,
      response: {
        200: VehiclesModel.vehicleResponse,
        400: VehiclesModel.errorResponse,
        401: VehiclesModel.errorResponse,
        403: VehiclesModel.errorResponse,
        404: VehiclesModel.errorResponse,
        409: VehiclesModel.errorResponse,
        429: VehiclesModel.errorResponse,
      },
    },
  )
  .put(
    "/:id",
    async ({ request, params, body, status }) => {
      try {
        return await VehiclesService.update(request.headers, params.id, body);
      } catch (error) {
        const message = errorMessage(error, "Unable to update vehicle");
        const code = resolveErrorCodeNumber(message);
        if (code === 401) return status(401, errorBody(message));
        if (code === 403) return status(403, errorBody(message));
        if (code === 404) return status(404, errorBody(message));
        if (code === 409) return status(409, errorBody(message));
        if (code === 429) return status(429, errorBody(message));
        return status(400, errorBody(message));
      }
    },
    {
      params: VehiclesModel.idParams,
      body: VehiclesModel.updateBody,
      response: {
        200: VehiclesModel.vehicleResponse,
        400: VehiclesModel.errorResponse,
        401: VehiclesModel.errorResponse,
        403: VehiclesModel.errorResponse,
        404: VehiclesModel.errorResponse,
        409: VehiclesModel.errorResponse,
        429: VehiclesModel.errorResponse,
      },
    },
  )
  .delete(
    "/:id",
    async ({ request, params, status }) => {
      try {
        return await VehiclesService.softDelete(request.headers, params.id);
      } catch (error) {
        const message = errorMessage(error, "Unable to delete vehicle");
        const code = resolveErrorCodeNumber(message);
        if (code === 401) return status(401, errorBody(message));
        if (code === 403) return status(403, errorBody(message));
        if (code === 404) return status(404, errorBody(message));
        if (code === 409) return status(409, errorBody(message));
        if (code === 429) return status(429, errorBody(message));
        return status(400, errorBody(message));
      }
    },
    {
      params: VehiclesModel.idParams,
      response: {
        200: VehiclesModel.deleteResponse,
        400: VehiclesModel.errorResponse,
        401: VehiclesModel.errorResponse,
        403: VehiclesModel.errorResponse,
        404: VehiclesModel.errorResponse,
        409: VehiclesModel.errorResponse,
        429: VehiclesModel.errorResponse,
      },
    },
  );
