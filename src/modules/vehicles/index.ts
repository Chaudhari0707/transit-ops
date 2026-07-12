import { Elysia } from "elysia";

import { errorMessage, resolveErrorCode } from "@/lib/api/errors";
import { VehiclesModel } from "@/modules/vehicles/model";
import { VehiclesService } from "@/modules/vehicles/service";

const errorResponses = {
  400: VehiclesModel.errorResponse,
  401: VehiclesModel.errorResponse,
  403: VehiclesModel.errorResponse,
  404: VehiclesModel.errorResponse,
  409: VehiclesModel.errorResponse,
  429: VehiclesModel.errorResponse,
} as const;

export const vehiclesModule = new Elysia({ name: "vehicles", prefix: "/vehicles" })
  .get(
    "/",
    async ({ request, query, status }) => {
      try {
        return await VehiclesService.list(request.headers, query);
      } catch (error) {
        const message = errorMessage(error, "Unable to list vehicles");
        return status(resolveErrorCode(message), { message });
      }
    },
    {
      query: VehiclesModel.listQuery,
      response: {
        200: VehiclesModel.listResponse,
        ...errorResponses,
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
        return status(resolveErrorCode(message), { message });
      }
    },
    {
      params: VehiclesModel.idParams,
      response: {
        200: VehiclesModel.vehicleResponse,
        ...errorResponses,
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
        return status(resolveErrorCode(message), { message });
      }
    },
    {
      body: VehiclesModel.createBody,
      response: {
        200: VehiclesModel.vehicleResponse,
        ...errorResponses,
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
        return status(resolveErrorCode(message), { message });
      }
    },
    {
      params: VehiclesModel.idParams,
      body: VehiclesModel.updateBody,
      response: {
        200: VehiclesModel.vehicleResponse,
        ...errorResponses,
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
        return status(resolveErrorCode(message), { message });
      }
    },
    {
      params: VehiclesModel.idParams,
      response: {
        200: VehiclesModel.deleteResponse,
        ...errorResponses,
      },
    },
  );
